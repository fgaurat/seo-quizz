<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $userId = Auth::id();

        $projectsCount = Project::where('user_id', $userId)->count();
        $quizzesCount = Quiz::where('user_id', $userId)->count();
        $publishedQuizzesCount = Quiz::where('user_id', $userId)->where('status', 'published')->count();
        $questionsCount = Question::whereIn('quiz_id', Quiz::where('user_id', $userId)->select('id'))->count();

        $quizIds = Quiz::where('user_id', $userId)->pluck('id');
        $attemptsCount = QuizAttempt::whereIn('quiz_id', $quizIds)->count();

        $averageScore = null;
        if ($attemptsCount > 0) {
            $averageScore = round(
                QuizAttempt::whereIn('quiz_id', $quizIds)
                    ->where('total_questions', '>', 0)
                    ->selectRaw('AVG(score * 100.0 / total_questions) as avg_score')
                    ->value('avg_score'),
                1
            );
        }

        return Inertia::render('dashboard', [
            'stats' => [
                'projects_count' => $projectsCount,
                'quizzes_count' => $quizzesCount,
                'published_quizzes_count' => $publishedQuizzesCount,
                'questions_count' => $questionsCount,
                'attempts_count' => $attemptsCount,
                'average_score' => $averageScore,
            ],
        ]);
    }
}
