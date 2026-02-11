<?php

namespace App\Http\Controllers\Quiz;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quiz\StoreQuestionRequest;
use App\Http\Requests\Quiz\UpdateQuestionRequest;
use App\Models\Answer;
use App\Models\Question;
use App\Models\Quiz;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class QuestionController extends Controller
{
    public function store(StoreQuestionRequest $request, Quiz $quiz): RedirectResponse
    {
        Gate::authorize('update', $quiz);

        $data = $request->validated();
        $answers = $data['answers'];
        unset($data['answers']);

        $data['order'] = $data['order'] ?? $quiz->questions()->count() + 1;

        $question = $quiz->questions()->create($data);

        foreach ($answers as $index => $answerData) {
            $question->answers()->create([
                'body' => $answerData['body'],
                'is_correct' => $answerData['is_correct'],
                'explanation' => $answerData['explanation'] ?? null,
                'order' => $answerData['order'] ?? $index + 1,
            ]);
        }

        return redirect()->route('quizzes.edit', $quiz)
            ->with('success', 'Question ajoutée avec succès.');
    }

    public function update(UpdateQuestionRequest $request, Quiz $quiz, Question $question): RedirectResponse
    {
        Gate::authorize('update', $quiz);

        $data = $request->validated();
        $answers = $data['answers'] ?? null;
        unset($data['answers']);

        $question->update($data);

        if ($answers !== null) {
            $existingIds = [];

            foreach ($answers as $index => $answerData) {
                if (!empty($answerData['id'])) {
                    $answer = Answer::find($answerData['id']);
                    if ($answer && $answer->question_id === $question->id) {
                        $answer->update([
                            'body' => $answerData['body'],
                            'is_correct' => $answerData['is_correct'],
                            'explanation' => $answerData['explanation'] ?? null,
                            'order' => $answerData['order'] ?? $index + 1,
                        ]);
                        $existingIds[] = $answer->id;
                    }
                } else {
                    $newAnswer = $question->answers()->create([
                        'body' => $answerData['body'],
                        'is_correct' => $answerData['is_correct'],
                        'explanation' => $answerData['explanation'] ?? null,
                        'order' => $answerData['order'] ?? $index + 1,
                    ]);
                    $existingIds[] = $newAnswer->id;
                }
            }

            $question->answers()->whereNotIn('id', $existingIds)->delete();
        }

        return redirect()->route('quizzes.edit', $quiz)
            ->with('success', 'Question mise à jour avec succès.');
    }

    public function destroy(Quiz $quiz, Question $question): RedirectResponse
    {
        Gate::authorize('update', $quiz);

        $question->delete();

        return redirect()->route('quizzes.edit', $quiz)
            ->with('success', 'Question supprimée avec succès.');
    }

    public function reorder(Request $request, Quiz $quiz): RedirectResponse
    {
        Gate::authorize('update', $quiz);

        $request->validate([
            'questions' => ['required', 'array'],
            'questions.*.id' => ['required', 'integer', 'exists:questions,id'],
            'questions.*.order' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($request->input('questions') as $item) {
            Question::where('id', $item['id'])
                ->where('quiz_id', $quiz->id)
                ->update(['order' => $item['order']]);
        }

        return redirect()->route('quizzes.edit', $quiz)
            ->with('success', 'Ordre des questions mis à jour.');
    }
}
