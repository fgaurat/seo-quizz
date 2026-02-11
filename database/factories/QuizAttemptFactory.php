<?php

namespace Database\Factories;

use App\Models\Quiz;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuizAttemptFactory extends Factory
{
    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'participant_name' => fake()->name(),
            'participant_email' => fake()->safeEmail(),
            'score' => fake()->numberBetween(0, 5),
            'total_questions' => 5,
            'started_at' => now()->subMinutes(10),
            'completed_at' => now(),
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
            'referrer_url' => fake()->url(),
        ];
    }
}
