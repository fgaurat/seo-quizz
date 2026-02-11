<?php

use App\Http\Controllers\Api\QuizApiController;
use Illuminate\Support\Facades\Route;

Route::post('/quizzes/{quiz:uuid}/submit', [QuizApiController::class, 'submit'])->name('api.quiz.submit');
