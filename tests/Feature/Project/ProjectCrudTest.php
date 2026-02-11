<?php

use App\Models\Project;
use App\Models\Quiz;
use App\Models\User;

test('guest cannot access projects', function () {
    $this->get('/projects')->assertRedirect('/login');
});

test('user can view projects index', function () {
    $user = User::factory()->create();
    Project::factory(3)->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get('/projects')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('projects/index')
            ->has('projects.data', 3)
        );
});

test('user can view create project page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/projects/create')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('projects/create'));
});

test('user can create a project', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/projects', [
            'name' => 'Mon Projet',
            'url' => 'https://www.example.com',
            'description' => 'Description du projet',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('projects', [
        'name' => 'Mon Projet',
        'user_id' => $user->id,
    ]);
});

test('user can view their project', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get("/projects/{$project->uuid}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('projects/show')
            ->has('project')
            ->has('quizzes')
        );
});

test('user can edit their project', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get("/projects/{$project->uuid}/edit")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('projects/edit')
            ->has('project')
        );
});

test('user can update their project', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->put("/projects/{$project->uuid}", [
            'name' => 'Projet Modifié',
            'url' => 'https://www.nouveau.com',
            'description' => 'Nouvelle description',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('projects', [
        'id' => $project->id,
        'name' => 'Projet Modifié',
    ]);
});

test('user can delete their project', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->delete("/projects/{$project->uuid}")
        ->assertRedirect('/projects');

    $this->assertDatabaseMissing('projects', ['id' => $project->id]);
});

test('user cannot view another user project', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $other->id]);

    $this->actingAs($user)
        ->get("/projects/{$project->uuid}")
        ->assertForbidden();
});

test('user cannot edit another user project', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $other->id]);

    $this->actingAs($user)
        ->get("/projects/{$project->uuid}/edit")
        ->assertForbidden();
});

test('user cannot update another user project', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $other->id]);

    $this->actingAs($user)
        ->put("/projects/{$project->uuid}", [
            'name' => 'Hack',
        ])
        ->assertForbidden();
});

test('user cannot delete another user project', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $other->id]);

    $this->actingAs($user)
        ->delete("/projects/{$project->uuid}")
        ->assertForbidden();
});

test('deleting project sets quiz project_id to null', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);
    $quiz = Quiz::factory()->create([
        'user_id' => $user->id,
        'project_id' => $project->id,
    ]);

    $this->actingAs($user)
        ->delete("/projects/{$project->uuid}");

    $quiz->refresh();
    expect($quiz->project_id)->toBeNull();
});
