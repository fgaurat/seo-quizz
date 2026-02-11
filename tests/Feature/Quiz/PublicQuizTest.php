<?php

use App\Models\Answer;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\User;

test('published quiz is accessible publicly', function () {
    $quiz = Quiz::factory()->published()->create();
    $question = Question::factory()->create(['quiz_id' => $quiz->id]);
    Answer::factory()->correct()->create(['question_id' => $question->id]);
    Answer::factory()->create(['question_id' => $question->id]);

    $this->get("/q/{$quiz->uuid}")
        ->assertOk()
        ->assertViewIs('quiz.player');
});

test('draft quiz returns 404', function () {
    $quiz = Quiz::factory()->create(['status' => 'draft']);

    $this->get("/q/{$quiz->uuid}")
        ->assertNotFound();
});

test('archived quiz returns 404', function () {
    $quiz = Quiz::factory()->archived()->create();

    $this->get("/q/{$quiz->uuid}")
        ->assertNotFound();
});

test('quiz submission via API works correctly', function () {
    $quiz = Quiz::factory()->published()->create();

    $q1 = Question::factory()->create(['quiz_id' => $quiz->id, 'order' => 1]);
    $correct1 = Answer::factory()->correct()->create(['question_id' => $q1->id]);
    Answer::factory()->create(['question_id' => $q1->id]);

    $q2 = Question::factory()->create(['quiz_id' => $quiz->id, 'order' => 2]);
    Answer::factory()->create(['question_id' => $q2->id]);
    $correct2 = Answer::factory()->correct()->create(['question_id' => $q2->id]);

    $response = $this->postJson("/api/quizzes/{$quiz->uuid}/submit", [
        'answers' => [
            ['question_id' => $q1->id, 'answer_id' => $correct1->id],
            ['question_id' => $q2->id, 'answer_id' => $correct2->id],
        ],
    ]);

    $response->assertOk()
        ->assertJson([
            'score' => 2,
            'total_questions' => 2,
            'percentage' => 100,
        ]);

    $this->assertDatabaseHas('quiz_attempts', [
        'quiz_id' => $quiz->id,
        'score' => 2,
        'total_questions' => 2,
    ]);
});

test('quiz submission with wrong answers scores correctly', function () {
    $quiz = Quiz::factory()->published()->create();

    $q1 = Question::factory()->create(['quiz_id' => $quiz->id]);
    $correct1 = Answer::factory()->correct()->create(['question_id' => $q1->id]);
    $wrong1 = Answer::factory()->create(['question_id' => $q1->id]);

    $response = $this->postJson("/api/quizzes/{$quiz->uuid}/submit", [
        'answers' => [
            ['question_id' => $q1->id, 'answer_id' => $wrong1->id],
        ],
    ]);

    $response->assertOk()
        ->assertJson([
            'score' => 0,
            'total_questions' => 1,
        ]);
});

test('submit to draft quiz returns 404', function () {
    $quiz = Quiz::factory()->create(['status' => 'draft']);
    $question = Question::factory()->create(['quiz_id' => $quiz->id]);
    $answer = Answer::factory()->correct()->create(['question_id' => $question->id]);

    $this->postJson("/api/quizzes/{$quiz->uuid}/submit", [
        'answers' => [
            ['question_id' => $question->id, 'answer_id' => $answer->id],
        ],
    ])->assertStatus(404);
});

test('embed script is accessible', function () {
    $this->get('/embed.js')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/javascript');
});
