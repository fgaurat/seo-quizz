<?php

namespace App\Http\Requests\Quiz;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string'],
            'media' => ['nullable', 'array'],
            'media.*.url' => ['required', 'url', 'max:2048'],
            'media.*.type' => ['required', Rule::in(['image', 'video'])],
            'media.*.caption' => ['nullable', 'string', 'max:500'],
            'order' => ['nullable', 'integer', 'min:0'],
            'answers' => ['required', 'array', 'min:2', 'max:10'],
            'answers.*.body' => ['required', 'string'],
            'answers.*.is_correct' => ['required', 'boolean'],
            'answers.*.explanation' => ['nullable', 'string'],
            'answers.*.order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $answers = $this->input('answers', []);
            $hasCorrect = collect($answers)->contains(fn ($a) => ! empty($a['is_correct']));
            if (! $hasCorrect) {
                $validator->errors()->add('answers', 'Au moins une réponse doit être marquée comme correcte.');
            }
        });
    }
}
