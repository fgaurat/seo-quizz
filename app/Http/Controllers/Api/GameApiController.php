<?php

namespace App\Http\Controllers\Api;

use App\Events\AnswerSubmitted;
use App\Events\GameCompleted;
use App\Events\GameStarted;
use App\Events\PlayerJoinedGame;
use App\Events\QuestionEnded;
use App\Events\QuestionStarted;
use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\GameSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GameApiController extends Controller
{
    /**
     * Player joins a game by PIN and nickname.
     *
     * Stores the player_uuid in the PHP session so subsequent requests
     * can identify the player without requiring authentication.
     */
    public function joinGame(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pin' => ['required', 'string', 'size:6'],
            'nickname' => ['required', 'string', 'max:50'],
        ]);

        $gameSession = GameSession::query()
            ->where('pin', $validated['pin'])
            ->where('status', '!=', 'completed')
            ->first();

        if (! $gameSession) {
            return response()->json(['message' => 'Aucune partie trouvée avec ce code.'], 404);
        }

        if (! $gameSession->isWaiting()) {
            return response()->json(['message' => 'Cette partie a déjà commencé.'], 409);
        }

        $nicknameExists = $gameSession->players()
            ->where('nickname', $validated['nickname'])
            ->exists();

        if ($nicknameExists) {
            return response()->json(['message' => 'Ce pseudo est déjà pris dans cette partie.'], 409);
        }

        $player = $gameSession->players()->create([
            'nickname' => $validated['nickname'],
            'score' => 0,
            'is_connected' => true,
        ]);

        session(['player_uuid' => $player->uuid]);

        $playerData = [
            'uuid' => $player->uuid,
            'nickname' => $player->nickname,
            'score' => $player->score,
        ];

        $playersCount = $gameSession->players()->count();

        event(new PlayerJoinedGame($gameSession->uuid, $playerData, $playersCount));

        return response()->json([
            'game_session_uuid' => $gameSession->uuid,
            'player' => $playerData,
        ]);
    }

    /**
     * Host starts the game, transitioning it from 'waiting' to 'in_progress'.
     */
    public function startGame(GameSession $gameSession, Request $request): JsonResponse
    {
        if (Auth::id() !== $gameSession->host_user_id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if (! $gameSession->isWaiting()) {
            return response()->json(['message' => 'La partie ne peut pas être démarrée dans son état actuel.'], 409);
        }

        $settings = $gameSession->settings ?? [];
        if ($request->has('auto_advance')) {
            $settings['auto_advance'] = (bool) $request->input('auto_advance');
            $settings['auto_advance_delay'] = (int) ($request->input('auto_advance_delay', 5));
        }

        $timePerQuestion = $request->has('time_per_question')
            ? max(5, min(120, (int) $request->input('time_per_question')))
            : $gameSession->time_per_question;

        $gameSession->update([
            'status' => 'in_progress',
            'started_at' => now(),
            'current_question_index' => 0,
            'question_started_at' => now(),
            'settings' => $settings,
            'time_per_question' => $timePerQuestion,
        ]);

        event(new GameStarted($gameSession->uuid));

        $gameSession->load('quiz');
        $question = $gameSession->currentQuestion()->load('answers');
        $questionData = [
            'id' => $question->id,
            'body' => $question->body,
            'media' => $question->media,
            'answers' => $question->answers->map(fn ($a) => ['id' => $a->id, 'body' => $a->body, 'order' => $a->order])->values()->toArray(),
        ];
        $isLast = $gameSession->totalQuestions() <= 1;

        event(new QuestionStarted($gameSession->uuid, 0, $questionData, $gameSession->time_per_question, $isLast));

        return response()->json(['status' => 'started']);
    }

    /**
     * Player submits an answer to the current question.
     *
     * Points are calculated on a 0–1000 scale, decreasing linearly with
     * elapsed time. Only correct answers earn points.
     */
    public function submitAnswer(GameSession $gameSession, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'answer_id' => ['required', 'integer', 'exists:answers,id'],
            'player_uuid' => ['required', 'string'],
        ]);

        if (! $gameSession->isInProgress()) {
            return response()->json(['message' => 'La partie n\'est pas en cours.'], 409);
        }

        $player = $gameSession->players()
            ->where('uuid', $validated['player_uuid'])
            ->first();

        if (! $player) {
            return response()->json(['message' => 'Joueur introuvable dans cette partie.'], 404);
        }

        $currentQuestion = $gameSession->currentQuestion();

        if (! $currentQuestion) {
            return response()->json(['message' => 'Aucune question en cours.'], 409);
        }

        // Verify the answer belongs to the current question
        $answer = Answer::query()
            ->where('id', $validated['answer_id'])
            ->where('question_id', $currentQuestion->id)
            ->first();

        if (! $answer) {
            return response()->json(['message' => 'Cette réponse n\'appartient pas à la question en cours.'], 422);
        }

        // Prevent duplicate answers for the same question
        $alreadyAnswered = $gameSession->responses()
            ->where('game_player_id', $player->id)
            ->where('question_id', $currentQuestion->id)
            ->exists();

        if ($alreadyAnswered) {
            return response()->json(['message' => 'Vous avez déjà répondu à cette question.'], 409);
        }

        // Check the question has not timed out
        $elapsedMs = max(0, (int) ($gameSession->question_started_at
            ? now()->diffInMilliseconds($gameSession->question_started_at)
            : 0));

        $timeLimitMs = $gameSession->time_per_question * 1000;

        if ($elapsedMs > $timeLimitMs) {
            return response()->json(['message' => 'Le temps est écoulé pour cette question.'], 409);
        }

        $isCorrect = (bool) $answer->is_correct;
        $pointsEarned = 0;

        if ($isCorrect) {
            $pointsEarned = min(1000, max(0, (int) round(1000 * (1 - ($elapsedMs / $timeLimitMs)))));
        }

        $gameSession->responses()->create([
            'game_player_id' => $player->id,
            'question_id' => $currentQuestion->id,
            'answer_id' => $answer->id,
            'is_correct' => $isCorrect,
            'response_time_ms' => $elapsedMs,
            'points_earned' => $pointsEarned,
        ]);

        if ($isCorrect) {
            $player->increment('score', $pointsEarned);
        }

        $playersAnsweredCount = $gameSession->responses()
            ->where('question_id', $currentQuestion->id)
            ->count();

        $playersCount = $gameSession->players()->count();

        event(new AnswerSubmitted($gameSession->uuid, $playersAnsweredCount, $playersCount));

        return response()->json([
            'is_correct' => $isCorrect,
            'points_earned' => $pointsEarned,
            'response_time_ms' => $elapsedMs,
        ]);
    }

    /**
     * Host advances the game to the next question.
     *
     * If no more questions remain, the game is marked as completed.
     */
    public function nextQuestion(GameSession $gameSession): JsonResponse
    {
        if (Auth::id() !== $gameSession->host_user_id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if (! $gameSession->isInProgress()) {
            return response()->json(['message' => 'La partie n\'est pas en cours.'], 409);
        }

        $nextIndex = $gameSession->current_question_index + 1;
        $totalQuestions = $gameSession->totalQuestions();
        $isLast = $nextIndex >= $totalQuestions;

        // Capture current question data before advancing the index
        $gameSession->load('quiz');
        $currentQuestion = $gameSession->currentQuestion()->load('answers');
        $correctAnswer = $currentQuestion->answers->firstWhere('is_correct', true);
        $answerCounts = $currentQuestion->answers->map(fn ($a) => [
            'answer_id' => $a->id,
            'count' => $gameSession->responses()->where('question_id', $currentQuestion->id)->where('answer_id', $a->id)->count(),
        ])->toArray();
        $leaderboard = $gameSession->leaderboard()->take(10)->map(fn ($p) => [
            'uuid' => $p->uuid,
            'nickname' => $p->nickname,
            'score' => $p->score,
        ])->values()->toArray();

        event(new QuestionEnded($gameSession->uuid, $correctAnswer->id, $answerCounts, $leaderboard));

        if ($isLast) {
            $gameSession->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            event(new GameCompleted($gameSession->uuid, $leaderboard));

            return response()->json([
                'status' => 'completed',
                'current_question_index' => $gameSession->current_question_index,
                'is_last' => true,
            ]);
        }

        $gameSession->update([
            'current_question_index' => $nextIndex,
            'question_started_at' => now(),
        ]);

        $nextQuestion = $gameSession->currentQuestion()->load('answers');
        $nextQuestionData = [
            'id' => $nextQuestion->id,
            'body' => $nextQuestion->body,
            'media' => $nextQuestion->media,
            'answers' => $nextQuestion->answers->map(fn ($a) => ['id' => $a->id, 'body' => $a->body, 'order' => $a->order])->values()->toArray(),
        ];
        $nextIsLast = ($nextIndex + 1) >= $totalQuestions;

        event(new QuestionStarted($gameSession->uuid, $nextIndex, $nextQuestionData, $gameSession->time_per_question, $nextIsLast));

        return response()->json([
            'status' => 'in_progress',
            'current_question_index' => $nextIndex,
            'is_last' => $nextIsLast,
            'question' => $nextQuestionData,
            'time_per_question' => $gameSession->time_per_question,
        ]);
    }

    /**
     * Polling endpoint — returns the current state of the game.
     *
     * Used by both host and players. Answers are returned without is_correct
     * to prevent cheating on the client side.
     */
    public function getState(GameSession $gameSession): JsonResponse
    {
        $currentQuestion = null;
        $timeRemainingMs = null;
        $playersAnsweredCount = 0;

        if ($gameSession->isInProgress()) {
            $question = $gameSession->currentQuestion()?->load('answers');

            if ($question) {
                $currentQuestion = [
                    'id' => $question->id,
                    'body' => $question->body,
                    'media' => $question->media,
                    'answers' => $question->answers->map(fn ($a) => [
                        'id' => $a->id,
                        'body' => $a->body,
                        // is_correct intentionally omitted
                    ]),
                ];

                $elapsedMs = (int) ($gameSession->question_started_at
                    ? now()->diffInMilliseconds($gameSession->question_started_at)
                    : 0);

                $timeRemainingMs = max(0, ($gameSession->time_per_question * 1000) - $elapsedMs);

                $playersAnsweredCount = $gameSession->responses()
                    ->where('question_id', $question->id)
                    ->count();
            }
        }

        $leaderboard = $gameSession->leaderboard()
            ->take(5)
            ->values()
            ->map(fn ($p) => [
                'uuid' => $p->uuid,
                'nickname' => $p->nickname,
                'score' => $p->score,
            ]);

        return response()->json([
            'status' => $gameSession->status,
            'current_question_index' => $gameSession->current_question_index,
            'question' => $currentQuestion,
            'time_remaining_ms' => $timeRemainingMs,
            'players_count' => $gameSession->players()->count(),
            'players_answered_count' => $playersAnsweredCount,
            'leaderboard' => $leaderboard,
        ]);
    }
}
