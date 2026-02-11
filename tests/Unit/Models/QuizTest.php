<?php

use App\Models\Quiz;
use App\Models\User;

test('quiz generates uuid on creation', function () {
    $quiz = Quiz::factory()->create();

    expect($quiz->uuid)->not->toBeNull();
    expect($quiz->uuid)->toMatch('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/');
});

test('quiz generates slug on creation', function () {
    $quiz = Quiz::factory()->create(['title' => 'Mon Premier Quiz']);

    expect($quiz->slug)->not->toBeNull();
    expect($quiz->slug)->toContain('mon-premier-quiz');
});

test('quiz uses uuid as route key', function () {
    $quiz = new Quiz();

    expect($quiz->getRouteKeyName())->toBe('uuid');
});

test('quiz isPublished returns correct value', function () {
    $published = Quiz::factory()->published()->create();
    $draft = Quiz::factory()->create(['status' => 'draft']);

    expect($published->isPublished())->toBeTrue();
    expect($draft->isPublished())->toBeFalse();
});

test('quiz published scope works', function () {
    Quiz::factory()->published()->create();
    Quiz::factory()->create(['status' => 'draft']);
    Quiz::factory()->archived()->create();

    expect(Quiz::published()->count())->toBe(1);
});

test('quiz belongs to user', function () {
    $user = User::factory()->create();
    $quiz = Quiz::factory()->create(['user_id' => $user->id]);

    expect($quiz->user->id)->toBe($user->id);
});

test('quiz casts settings to array', function () {
    $quiz = Quiz::factory()->create([
        'settings' => ['show_results' => true, 'randomize_questions' => false],
    ]);

    $quiz->refresh();

    expect($quiz->settings)->toBeArray();
    expect($quiz->settings['show_results'])->toBeTrue();
});
