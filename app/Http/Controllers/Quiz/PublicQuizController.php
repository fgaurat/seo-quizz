<?php

namespace App\Http\Controllers\Quiz;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class PublicQuizController extends Controller
{
    public function show(Quiz $quiz): View|Response
    {
        $isOwner = Auth::check() && Auth::id() === $quiz->user_id;

        if (! $quiz->isPublished() && ! $isOwner) {
            abort(404);
        }

        $quiz->load(['project', 'questions.answers' => function ($query) {
            $query->select('id', 'question_id', 'body', 'order');
        }]);

        return view('quiz.player', [
            'quiz' => $quiz,
            'projectCss' => $quiz->project?->custom_css ?? '',
            'quizCss' => $quiz->custom_css ?? '',
        ]);
    }
}
