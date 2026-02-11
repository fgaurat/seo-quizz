<?php

use App\Http\Controllers\Quiz\PublicQuizController;
use App\Http\Controllers\Quiz\EmbedScriptController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/q/{quiz:uuid}', [PublicQuizController::class, 'show'])->name('quiz.public.show');
Route::get('/embed.js', EmbedScriptController::class)->name('embed.script');

require __DIR__.'/settings.php';
require __DIR__.'/quizzes.php';
