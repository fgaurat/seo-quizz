<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class GamePlayer extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_session_id',
        'nickname',
        'avatar',
        'score',
        'is_connected',
    ];

    protected function casts(): array
    {
        return [
            'is_connected' => 'boolean',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function (GamePlayer $player) {
            $player->uuid = (string) Str::uuid();
        });
    }

    public function gameSession(): BelongsTo
    {
        return $this->belongsTo(GameSession::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(GameResponse::class);
    }
}
