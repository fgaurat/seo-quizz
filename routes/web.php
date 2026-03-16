<?php

use App\Http\Controllers\Api\QuizApiController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Quiz\EmbedScriptController;
use App\Http\Controllers\Quiz\PublicQuizController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', DashboardController::class)->middleware(['auth', 'verified'])->name('dashboard');

Route::get('guide', function () {
    return Inertia::render('guide');
})->middleware(['auth', 'verified'])->name('guide');

Route::get('/q/{quiz:uuid}', [PublicQuizController::class, 'show'])->name('quiz.public.show');
Route::post('/q/{quiz:uuid}/submit', [QuizApiController::class, 'submit'])->name('quiz.public.submit');
Route::get('/quiz-widget.js', EmbedScriptController::class)->name('embed.script');

require __DIR__.'/settings.php';
require __DIR__.'/projects.php';
require __DIR__.'/quizzes.php';
require __DIR__.'/games.php';
