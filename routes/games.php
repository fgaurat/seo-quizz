<?php

use App\Http\Controllers\Api\GameApiController;
use App\Http\Controllers\Game\GamePlayController;
use App\Http\Controllers\Game\GameSessionController;
use Illuminate\Support\Facades\Route;

// Authenticated host routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/games', [GameSessionController::class, 'index'])->name('games.index');
    Route::post('/games', [GameSessionController::class, 'store'])->name('games.store');
    Route::get('/games/{gameSession}/lobby', [GameSessionController::class, 'lobby'])->name('games.lobby');
    Route::get('/games/{gameSession}/host', [GameSessionController::class, 'host'])->name('games.host');
    Route::get('/games/{gameSession}/results', [GameSessionController::class, 'results'])->name('games.results');
    Route::delete('/games/{gameSession}', [GameSessionController::class, 'destroy'])->name('games.destroy');
});

// Public player routes (no auth required)
Route::get('/play', [GamePlayController::class, 'join'])->name('games.join');
Route::get('/play/{gameSession}/play', [GamePlayController::class, 'play'])->name('games.play');

// JSON API routes
Route::post('/api/game/join', [GameApiController::class, 'joinGame'])->name('api.game.join');
Route::post('/api/game/{gameSession}/start', [GameApiController::class, 'startGame'])->middleware(['auth'])->name('api.game.start');
Route::post('/api/game/{gameSession}/answer', [GameApiController::class, 'submitAnswer'])->name('api.game.answer');
Route::post('/api/game/{gameSession}/next', [GameApiController::class, 'nextQuestion'])->middleware(['auth'])->name('api.game.next');
Route::get('/api/game/{gameSession}/state', [GameApiController::class, 'getState'])->name('api.game.state');
