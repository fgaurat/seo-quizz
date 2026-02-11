<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $quiz->title }}</title>
    @viteReactRefresh
    @vite(['resources/css/quiz-player.css', 'resources/js/quiz-player.tsx'])
    @if($projectCss)
        <style id="project-css">{!! $projectCss !!}</style>
    @endif
    @if($quizCss)
        <style id="quiz-css">{!! $quizCss !!}</style>
    @endif
</head>
<body>
    <div
        id="quiz-root"
        data-quiz-id="{{ $quiz->uuid }}"
        data-quiz-title="{{ $quiz->title }}"
        data-quiz-description="{{ $quiz->description }}"
        data-quiz-questions="{{ json_encode($quiz->questions->map(function ($q) {
            return [
                'id' => $q->id,
                'body' => $q->body,
                'media' => $q->media,
                'order' => $q->order,
                'answers' => $q->answers->map(function ($a) {
                    return [
                        'id' => $a->id,
                        'body' => $a->body,
                        'order' => $a->order,
                    ];
                }),
            ];
        })) }}"
        data-api-url="{{ route('quiz.public.submit', $quiz) }}"
        data-csrf-token="{{ csrf_token() }}"
        data-settings="{{ json_encode($quiz->settings ?? new \stdClass()) }}"
    >Chargement du quiz...</div>
</body>
</html>
