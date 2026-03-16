<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QuestionEnded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $gameSessionUuid,
        public int $correctAnswerId,
        public array $answerCounts,
        public array $leaderboard,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('game.'.$this->gameSessionUuid);
    }

    public function broadcastAs(): string
    {
        return 'question.ended';
    }
}
