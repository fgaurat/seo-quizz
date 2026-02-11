<?php

namespace App\Http\Controllers\Project;

use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function index(): Response
    {
        $projects = Auth::user()->projects()
            ->withCount(['quizzes', 'quizAttempts'])
            ->latest()
            ->paginate(10);

        return Inertia::render('projects/index', [
            'projects' => $projects,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('projects/create');
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $project = Auth::user()->projects()->create($request->validated());

        return redirect()->route('projects.show', $project)
            ->with('success', 'Projet créé avec succès.');
    }

    public function show(Project $project): Response
    {
        Gate::authorize('view', $project);

        $quizzes = $project->quizzes()
            ->withCount(['questions', 'quizAttempts'])
            ->latest()
            ->paginate(10);

        return Inertia::render('projects/show', [
            'project' => $project,
            'quizzes' => $quizzes,
        ]);
    }

    public function edit(Project $project): Response
    {
        Gate::authorize('update', $project);

        return Inertia::render('projects/edit', [
            'project' => $project,
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        Gate::authorize('update', $project);

        $project->update($request->validated());

        return redirect()->route('projects.show', $project)
            ->with('success', 'Projet mis à jour avec succès.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        Gate::authorize('delete', $project);

        $project->delete();

        return redirect()->route('projects.index')
            ->with('success', 'Projet supprimé avec succès.');
    }
}
