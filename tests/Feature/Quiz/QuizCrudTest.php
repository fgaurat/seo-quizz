<?php

use App\Models\Quiz;
use App\Models\User;

test('guest cannot access quizzes', function () {
    $this->get('/quizzes')->assertRedirect('/login');
});

test('user can view quizzes index', function () {
    $user = User::factory()->create();
    Quiz::factory(3)->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get('/quizzes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('quizzes/index')
            ->has('quizzes.data', 3)
        );
});

test('user can create a quiz', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/quizzes', [
            'title' => 'Mon Quiz',
            'description' => 'Description du quiz',
            'status' => 'draft',
            'settings' => ['show_results' => true],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('quizzes', [
        'title' => 'Mon Quiz',
        'user_id' => $user->id,
    ]);
});

test('user can view create quiz page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/quizzes/create')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('quizzes/create'));
});

test('user can edit their quiz', function () {
    $user = User::factory()->create();
    $quiz = Quiz::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get("/quizzes/{$quiz->uuid}/edit")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('quizzes/edit')
            ->has('quiz')
        );
});

test('user can update their quiz', function () {
    $user = User::factory()->create();
    $quiz = Quiz::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->put("/quizzes/{$quiz->uuid}", [
            'title' => 'Titre modifie',
            'description' => 'Nouvelle description',
            'status' => 'published',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('quizzes', [
        'id' => $quiz->id,
        'title' => 'Titre modifie',
        'status' => 'published',
    ]);
});

test('user can delete their quiz', function () {
    $user = User::factory()->create();
    $quiz = Quiz::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->delete("/quizzes/{$quiz->uuid}")
        ->assertRedirect('/quizzes');

    $this->assertDatabaseMissing('quizzes', ['id' => $quiz->id]);
});

test('user cannot edit another user quiz', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $quiz = Quiz::factory()->create(['user_id' => $other->id]);

    $this->actingAs($user)
        ->get("/quizzes/{$quiz->uuid}/edit")
        ->assertForbidden();
});

test('user cannot update another user quiz', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $quiz = Quiz::factory()->create(['user_id' => $other->id]);

    $this->actingAs($user)
        ->put("/quizzes/{$quiz->uuid}", [
            'title' => 'Hack',
            'status' => 'draft',
        ])
        ->assertForbidden();
});

test('user cannot delete another user quiz', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $quiz = Quiz::factory()->create(['user_id' => $other->id]);

    $this->actingAs($user)
        ->delete("/quizzes/{$quiz->uuid}")
        ->assertForbidden();
});
