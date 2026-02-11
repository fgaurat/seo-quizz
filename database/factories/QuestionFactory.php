<?php

namespace Database\Factories;

use App\Models\Quiz;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuestionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'body' => fake()->sentence() . '?',
            'media' => null,
            'order' => 0,
        ];
    }

    public function withImages(int $count = 1): static
    {
        return $this->state(fn (array $attributes) => [
            'media' => collect(range(1, $count))->map(fn () => [
                'url' => fake()->imageUrl(),
                'type' => 'image',
            ])->all(),
        ]);
    }

    public function withVideos(int $count = 1): static
    {
        return $this->state(fn (array $attributes) => [
            'media' => collect(range(1, $count))->map(fn () => [
                'url' => 'https://www.youtube.com/watch?v=' . fake()->regexify('[A-Za-z0-9]{11}'),
                'type' => 'video',
            ])->all(),
        ]);
    }
}
