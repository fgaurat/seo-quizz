<?php

namespace App\Http\Requests\Quiz;

use Illuminate\Validation\Rule;

class UpdateQuizRequest extends StoreQuizRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('quizzes')->ignore($this->route('quiz'))],
        ]);
    }
}
