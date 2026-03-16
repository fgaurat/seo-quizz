<?php

namespace App\Http\Controllers\Game;

use App\Http\Controllers\Controller;
use App\Models\GameSession;
use App\Models\Quiz;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class GameSessionController extends Controller
{
    /**
     * List all game sessions hosted by the authenticated user.
     */
    public function index(): Response
    {
        $sessions = GameSession::where('host_user_id', Auth::id())
            ->with('quiz:id,uuid,title')
            ->withCount(['players', 'responses'])
            ->latest()
            ->paginate(20);

        return Inertia::render('games/index', [
            'sessions' => $sessions,
        ]);
    }

    /**
     * Create a new game session from a quiz and redirect to the lobby.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'quiz_id' => ['required', 'integer', 'exists:quizzes,id'],
            'time_per_question' => ['sometimes', 'integer', 'min:10', 'max:120'],
        ]);

        $quiz = Quiz::findOrFail($validated['quiz_id']);

        if (Auth::id() !== $quiz->user_id) {
            abort(403);
        }

        $gameSession = GameSession::create([
            'quiz_id' => $quiz->id,
            'host_user_id' => Auth::id(),
            'status' => 'waiting',
            'time_per_question' => $validated['time_per_question'] ?? 30,
            'current_question_index' => 0,
        ]);

        return redirect()->route('games.lobby', $gameSession);
    }

    /**
     * Host lobby — waiting for players to join.
     */
    public function lobby(GameSession $gameSession): Response
    {
        if (Auth::id() !== $gameSession->host_user_id) {
            abort(403);
        }

        $gameSession->load(['players', 'quiz:id,uuid,title']);

        return Inertia::render('games/lobby', [
            'gameSession' => [
                'uuid' => $gameSession->uuid,
                'pin' => $gameSession->pin,
                'status' => $gameSession->status,
                'time_per_question' => $gameSession->time_per_question,
                'quiz_title' => $gameSession->quiz->title,
                'players' => $gameSession->players,
            ],
        ]);
    }

    /**
     * Host control screen while the game is in progress.
     */
    public function host(GameSession $gameSession): Response
    {
        if (Auth::id() !== $gameSession->host_user_id) {
            abort(403);
        }

        $gameSession->load(['quiz.questions.answers', 'players']);

        $currentQuestion = $gameSession->currentQuestion()?->load('answers');
        $totalQuestions = $gameSession->totalQuestions();

        $answeredCount = $currentQuestion
            ? $gameSession->responses()
                ->where('question_id', $currentQuestion->id)
                ->count()
            : 0;

        return Inertia::render('games/host', [
            'gameSession' => [
                'uuid' => $gameSession->uuid,
                'pin' => $gameSession->pin,
                'status' => $gameSession->status,
                'current_question_index' => $gameSession->current_question_index,
                'total_questions' => $totalQuestions,
                'time_per_question' => $gameSession->time_per_question,
                'question_started_at' => $gameSession->question_started_at?->toISOString(),
                'quiz_title' => $gameSession->quiz->title,
            ],
            'currentQuestion' => $currentQuestion,
            'players' => $gameSession->players,
            'players_answered_count' => $answeredCount,
            'leaderboard' => $gameSession->leaderboard()->take(10)->values(),
        ]);
    }

    /**
     * Final results screen after the game is completed.
     */
    public function results(GameSession $gameSession): Response
    {
        if (Auth::id() !== $gameSession->host_user_id) {
            abort(403);
        }

        $gameSession->load(['quiz.questions.answers', 'players']);

        $perQuestionStats = $gameSession->quiz->questions->map(function ($question) use ($gameSession) {
            $responses = $gameSession->responses()->where('question_id', $question->id)->get();
            $total = $responses->count();
            $correct = $responses->where('is_correct', true)->count();

            return [
                'question_id' => $question->id,
                'question_body' => $question->body,
                'total_answers' => $total,
                'correct_answers' => $correct,
                'correct_percentage' => $total > 0 ? round(($correct / $total) * 100, 1) : 0,
                'avg_response_time_ms' => $total > 0 ? round($responses->avg('response_time_ms') ?? 0) : 0,
                'answers' => $question->answers->map(fn ($a) => [
                    'id' => $a->id,
                    'body' => $a->body,
                    'is_correct' => $a->is_correct,
                    'count' => $responses->where('answer_id', $a->id)->count(),
                ]),
            ];
        });

        return Inertia::render('games/results', [
            'gameSession' => [
                'uuid' => $gameSession->uuid,
                'pin' => $gameSession->pin,
                'status' => $gameSession->status,
                'quiz_id' => $gameSession->quiz_id,
                'quiz_title' => $gameSession->quiz->title,
                'started_at' => $gameSession->started_at?->toISOString(),
                'completed_at' => $gameSession->completed_at?->toISOString(),
            ],
            'leaderboard' => $gameSession->leaderboard()->values(),
            'per_question_stats' => $perQuestionStats,
        ]);
    }
}
