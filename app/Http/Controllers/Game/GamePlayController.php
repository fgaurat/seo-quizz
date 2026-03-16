<?php

namespace App\Http\Controllers\Game;

use App\Http\Controllers\Controller;
use App\Models\GameSession;
use Inertia\Inertia;
use Inertia\Response;

class GamePlayController extends Controller
{
    /**
     * Join page — player enters a PIN to find a game.
     */
    public function join(): Response
    {
        return Inertia::render('games/join');
    }

    /**
     * Player game screen — shown to players throughout the game.
     *
     * Requires player_uuid in the session. Answers are returned without
     * is_correct to prevent client-side cheating.
     */
    public function play(GameSession $gameSession): Response
    {
        $playerUuid = session('player_uuid');

        if (! $playerUuid) {
            return Inertia::render('games/join', [
                'error' => 'Votre session a expiré. Veuillez rejoindre la partie à nouveau.',
            ]);
        }

        $player = $gameSession->players()->where('uuid', $playerUuid)->first();

        if (! $player) {
            return Inertia::render('games/join', [
                'error' => 'Joueur introuvable dans cette partie.',
            ]);
        }

        $currentQuestion = null;
        $timeRemainingMs = null;

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
            }
        }

        $alreadyAnswered = $currentQuestion
            ? $gameSession->responses()
                ->where('game_player_id', $player->id)
                ->where('question_id', $currentQuestion['id'])
                ->exists()
            : false;

        return Inertia::render('games/play', [
            'gameSession' => [
                'uuid' => $gameSession->uuid,
                'status' => $gameSession->status,
                'current_question_index' => $gameSession->current_question_index,
                'total_questions' => $gameSession->totalQuestions(),
                'time_per_question' => $gameSession->time_per_question,
                'question_started_at' => $gameSession->question_started_at?->toISOString(),
            ],
            'player' => [
                'uuid' => $player->uuid,
                'nickname' => $player->nickname,
                'score' => $player->score,
            ],
            'currentQuestion' => $currentQuestion,
            'time_remaining_ms' => $timeRemainingMs,
            'already_answered' => $alreadyAnswered,
        ]);
    }
}
