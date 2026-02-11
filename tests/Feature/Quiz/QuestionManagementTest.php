<?php

use App\Models\Question;
use App\Models\Quiz;
use App\Models\User;

test('user can add a question to their quiz', function () {
    $user = User::factory()->create();
    $quiz = Quiz::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->post("/quizzes/{$quiz->uuid}/questions", [
            'body' => 'Quelle est la capitale de la France ?',

            'answers' => [
                ['body' => 'Paris', 'is_correct' => true, 'explanation' => 'Paris est la capitale.'],
                ['body' => 'Lyon', 'is_correct' => false, 'explanation' => null],
                ['body' => 'Marseille', 'is_correct' => false, 'explanation' => null],
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('questions', [
        'quiz_id' => $quiz->id,
        'body' => 'Quelle est la capitale de la France ?',
    ]);

    expect($quiz->questions()->first()->answers)->toHaveCount(3);
});

test('question requires at least one correct answer', function () {
    $user = User::factory()->create();
    $quiz = Quiz::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->post("/quizzes/{$quiz->uuid}/questions", [
            'body' => 'Question sans bonne reponse',

            'answers' => [
                ['body' => 'Reponse A', 'is_correct' => false, 'explanation' => null],
                ['body' => 'Reponse B', 'is_correct' => false, 'explanation' => null],
            ],
        ])
        ->assertSessionHasErrors('answers');
});

test('question requires at least 2 answers', function () {
    $user = User::factory()->create();
    $quiz = Quiz::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->post("/quizzes/{$quiz->uuid}/questions", [
            'body' => 'Question avec une seule reponse',

            'answers' => [
                ['body' => 'Seule reponse', 'is_correct' => true, 'explanation' => null],
            ],
        ])
        ->assertSessionHasErrors('answers');
});

test('user can delete a question', function () {
    $user = User::factory()->create();
    $quiz = Quiz::factory()->create(['user_id' => $user->id]);
    $question = Question::factory()->create(['quiz_id' => $quiz->id]);

    $this->actingAs($user)
        ->delete("/quizzes/{$quiz->uuid}/questions/{$question->id}")
        ->assertRedirect();

    $this->assertDatabaseMissing('questions', ['id' => $question->id]);
});

test('user can update a question', function () {
    $user = User::factory()->create();
    $quiz = Quiz::factory()->create(['user_id' => $user->id]);
    $question = Question::factory()->create(['quiz_id' => $quiz->id]);

    $this->actingAs($user)
        ->put("/quizzes/{$quiz->uuid}/questions/{$question->id}", [
            'body' => 'Question mise a jour',

            'answers' => [
                ['body' => 'Reponse A', 'is_correct' => true, 'explanation' => null],
                ['body' => 'Reponse B', 'is_correct' => false, 'explanation' => null],
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('questions', [
        'id' => $question->id,
        'body' => 'Question mise a jour',
    ]);
});
