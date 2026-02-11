<?php

namespace App\Http\Controllers\Quiz;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;

class EmbedScriptController extends Controller
{
    public function __invoke(): Response
    {
        $host = config('app.url');

        $js = file_get_contents(public_path('js/quiz-embed.js'));
        $js = str_replace('__QUIZ_HOST__', $host, $js);

        return response($js, 200, [
            'Content-Type' => 'application/javascript',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
