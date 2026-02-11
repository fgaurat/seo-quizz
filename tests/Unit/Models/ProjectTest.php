<?php

use App\Models\Project;
use App\Models\User;

test('project generates uuid on creation', function () {
    $project = Project::factory()->create();

    expect($project->uuid)->not->toBeNull();
    expect($project->uuid)->toMatch('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/');
});

test('project generates slug on creation', function () {
    $project = Project::factory()->create(['name' => 'Mon Premier Projet']);

    expect($project->slug)->not->toBeNull();
    expect($project->slug)->toContain('mon-premier-projet');
});

test('project uses uuid as route key', function () {
    $project = new Project;

    expect($project->getRouteKeyName())->toBe('uuid');
});

test('project belongs to user', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $user->id]);

    expect($project->user->id)->toBe($user->id);
});
