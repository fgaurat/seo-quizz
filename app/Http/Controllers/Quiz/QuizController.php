<?php

namespace App\Http\Controllers\Quiz;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quiz\StoreQuizRequest;
use App\Http\Requests\Quiz\UpdateQuizRequest;
use App\Models\Quiz;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class QuizController extends Controller
{
    public function index(): Response
    {
        $quizzes = Auth::user()->quizzes()
            ->withCount(['questions', 'quizAttempts'])
            ->latest()
            ->paginate(10);

        return Inertia::render('quizzes/index', [
            'quizzes' => $quizzes,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('quizzes/create');
    }

    public function store(StoreQuizRequest $request): RedirectResponse
    {
        $quiz = Auth::user()->quizzes()->create($request->validated());

        return redirect()->route('quizzes.edit', $quiz)
            ->with('success', 'Quiz créé avec succès.');
    }

    public function edit(Quiz $quiz): Response
    {
        Gate::authorize('update', $quiz);

        $quiz->load(['questions.answers']);

        return Inertia::render('quizzes/edit', [
            'quiz' => $quiz,
        ]);
    }

    public function update(UpdateQuizRequest $request, Quiz $quiz): RedirectResponse
    {
        Gate::authorize('update', $quiz);

        $quiz->update($request->validated());

        return redirect()->route('quizzes.edit', $quiz)
            ->with('success', 'Quiz mis à jour avec succès.');
    }

    public function destroy(Quiz $quiz): RedirectResponse
    {
        Gate::authorize('delete', $quiz);

        $quiz->delete();

        return redirect()->route('quizzes.index')
            ->with('success', 'Quiz supprimé avec succès.');
    }

    public function embed(Quiz $quiz): Response
    {
        Gate::authorize('view', $quiz);

        return Inertia::render('quizzes/embed', [
            'quiz' => $quiz,
        ]);
    }

    public function results(Quiz $quiz): Response
    {
        Gate::authorize('view', $quiz);

        $attempts = $quiz->quizAttempts()
            ->latest()
            ->paginate(20);

        $stats = [
            'total_attempts' => $quiz->quizAttempts()->count(),
            'average_score' => round($quiz->quizAttempts()->avg('score') ?? 0, 1),
            'total_questions' => $quiz->questions()->count(),
            'completion_rate' => $quiz->quizAttempts()->count() > 0
                ? round($quiz->quizAttempts()->whereNotNull('completed_at')->count() / $quiz->quizAttempts()->count() * 100, 1)
                : 0,
        ];

        return Inertia::render('quizzes/results', [
            'quiz' => $quiz,
            'attempts' => $attempts,
            'stats' => $stats,
        ]);
    }
}
