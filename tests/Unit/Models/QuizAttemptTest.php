<?php

use App\Models\QuizAttempt;

test('score percentage is calculated correctly', function () {
    $attempt = QuizAttempt::factory()->create([
        'score' => 3,
        'total_questions' => 5,
    ]);

    expect($attempt->scorePercentage())->toBe(60.0);
});

test('score percentage handles zero questions', function () {
    $attempt = QuizAttempt::factory()->create([
        'score' => 0,
        'total_questions' => 0,
    ]);

    expect($attempt->scorePercentage())->toBe(0.0);
});

test('score percentage handles perfect score', function () {
    $attempt = QuizAttempt::factory()->create([
        'score' => 10,
        'total_questions' => 10,
    ]);

    expect($attempt->scorePercentage())->toBe(100.0);
});

test('quiz attempt generates uuid on creation', function () {
    $attempt = QuizAttempt::factory()->create();

    expect($attempt->uuid)->not->toBeNull();
    expect($attempt->uuid)->toMatch('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/');
});

test('quiz attempt casts dates correctly', function () {
    $attempt = QuizAttempt::factory()->create([
        'started_at' => '2026-01-01 10:00:00',
        'completed_at' => '2026-01-01 10:30:00',
    ]);

    expect($attempt->started_at)->toBeInstanceOf(\Carbon\CarbonImmutable::class);
    expect($attempt->completed_at)->toBeInstanceOf(\Carbon\CarbonImmutable::class);
});
