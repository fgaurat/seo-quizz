<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class GameSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_id',
        'host_user_id',
        'pin',
        'status',
        'current_question_index',
        'question_started_at',
        'time_per_question',
        'settings',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'question_started_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function (GameSession $session) {
            $session->uuid = (string) Str::uuid();

            do {
                $pin = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
                $exists = static::query()
                    ->where('pin', $pin)
                    ->where('status', '!=', 'completed')
                    ->exists();
            } while ($exists);

            $session->pin = $pin;
        });
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_user_id');
    }

    public function players(): HasMany
    {
        return $this->hasMany(GamePlayer::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(GameResponse::class);
    }

    public function isWaiting(): bool
    {
        return $this->status === 'waiting';
    }

    public function isInProgress(): bool
    {
        return $this->status === 'in_progress';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Returns the Question model at the current question index,
     * based on the quiz's ordered questions.
     */
    public function currentQuestion(): ?Question
    {
        return $this->quiz
            ->questions()
            ->orderBy('order')
            ->skip($this->current_question_index)
            ->first();
    }

    public function totalQuestions(): int
    {
        return $this->quiz->questions()->count();
    }

    /**
     * Returns players ordered by score descending.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, GamePlayer>
     */
    public function leaderboard()
    {
        return $this->players()->orderByDesc('score')->get();
    }
}
