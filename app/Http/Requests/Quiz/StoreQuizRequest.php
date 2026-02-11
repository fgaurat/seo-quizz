<?php

namespace App\Http\Requests\Quiz;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
            'project_id' => ['nullable', 'integer', Rule::exists('projects', 'id')],
            'custom_css' => ['nullable', 'string', 'max:50000'],
            'settings' => ['nullable', 'array'],
            'settings.show_results' => ['nullable', 'boolean'],
            'settings.randomize_questions' => ['nullable', 'boolean'],
            'settings.randomize_answers' => ['nullable', 'boolean'],
            'settings.time_limit' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
