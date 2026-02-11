<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quiz\SubmitQuizRequest;
use App\Models\Quiz;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class QuizApiController extends Controller
{
    public function submit(SubmitQuizRequest $request, Quiz $quiz): JsonResponse
    {
        $isOwner = Auth::check() && Auth::id() === $quiz->user_id;

        if (! $quiz->isPublished() && ! $isOwner) {
            return response()->json(['message' => 'Ce quiz n\'est pas disponible.'], 404);
        }

        $quiz->load('questions.answers');

        $submittedAnswers = collect($request->input('answers'));
        $score = 0;
        $results = [];

        foreach ($quiz->questions as $question) {
            $submitted = $submittedAnswers->firstWhere('question_id', $question->id);
            $selectedAnswerId = $submitted ? $submitted['answer_id'] : null;
            $correctAnswer = $question->answers->firstWhere('is_correct', true);
            $isCorrect = $correctAnswer && $selectedAnswerId == $correctAnswer->id;

            if ($isCorrect) {
                $score++;
            }

            $results[] = [
                'question_id' => $question->id,
                'question_body' => $question->body,
                'selected_answer_id' => $selectedAnswerId,
                'correct_answer_id' => $correctAnswer?->id,
                'is_correct' => $isCorrect,
                'explanation' => $correctAnswer?->explanation,
            ];
        }

        $totalQuestions = $quiz->questions->count();

        $attempt = $quiz->quizAttempts()->create([
            'participant_name' => $request->input('participant_name'),
            'participant_email' => $request->input('participant_email'),
            'score' => $score,
            'total_questions' => $totalQuestions,
            'started_at' => now(),
            'completed_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referrer_url' => $request->header('Referer'),
        ]);

        foreach ($results as $result) {
            $attempt->attemptAnswers()->create([
                'question_id' => $result['question_id'],
                'answer_id' => $result['selected_answer_id'],
                'is_correct' => $result['is_correct'],
            ]);
        }

        return response()->json([
            'score' => $score,
            'total_questions' => $totalQuestions,
            'percentage' => $totalQuestions > 0 ? round(($score / $totalQuestions) * 100, 1) : 0,
            'results' => $results,
        ]);
    }
}
