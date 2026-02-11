<?php

namespace App\Http\Requests\Project;

use Illuminate\Validation\Rule;

class UpdateProjectRequest extends StoreProjectRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('projects')->ignore($this->route('project'))],
        ]);
    }
}
