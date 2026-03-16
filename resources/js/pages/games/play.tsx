import { Head } from '@inertiajs/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameSession, GamePlayer } from '@/types';
import echo from '@/echo';

interface PlayProps {
    gameSession: GameSession;
    player: GamePlayer;
}

type AnswerResult = {
    isCorrect: boolean;
    pointsEarned: number;
};

type Phase =
    | 'loading'
    | 'no_session'
    | 'waiting'
    | 'playing'
    | 'answered'
    | 'reviewing'
    | 'completed';

type QuestionData = {
    id: number;
    body: string;
    media: unknown[] | null;
    answers: { id: number; body: string; order: number }[];
};

type LeaderboardEntry = {
    uuid: string;
    nickname: string;
    score: number;
};

const ANSWER_COLORS = [
    { bg: 'bg-red-500', hover: 'hover:bg-red-600', active: 'active:bg-red-700', label: 'Rouge' },
    { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', active: 'active:bg-blue-700', label: 'Bleu' },
    { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', active: 'active:bg-yellow-700', label: 'Jaune' },
    { bg: 'bg-green-500', hover: 'hover:bg-green-600', active: 'active:bg-green-700', label: 'Vert' },
] as const;

const ANSWER_SHAPES = ['▲', '◆', '●', '■'] as const;

function SpinnerIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    );
}

function PulsingDots() {
    return (
        <div className="flex items-center justify-center gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="w-3 h-3 rounded-full bg-white/70"
                    style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                />
            ))}
        </div>
    );
}

function TimerBar({ timeRemainingMs, totalMs }: { timeRemainingMs: number; totalMs: number }) {
    const percent = totalMs > 0 ? Math.max(0, Math.min(100, (timeRemainingMs / totalMs) * 100)) : 0;
    const seconds = Math.ceil(timeRemainingMs / 1000);
    const isUrgent = seconds <= 5;

    return (
        <div className="w-full px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm font-semibold uppercase tracking-wide">Temps</span>
                <span
                    className={`text-3xl font-extrabold tabular-nums transition-colors ${
                        isUrgent ? 'text-red-300' : 'text-white'
                    }`}
                    aria-live="polite"
                    aria-label={`${seconds} secondes restantes`}
                >
                    {seconds}
                </span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${
                        isUrgent ? 'bg-red-400' : 'bg-white'
                    }`}
                    style={{ width: `${percent}%` }}
                    role="progressbar"
                    aria-valuenow={seconds}
                    aria-valuemin={0}
                    aria-valuemax={Math.ceil(totalMs / 1000)}
                />
            </div>
        </div>
    );
}

export default function Play({ gameSession, player }: PlayProps) {
    const [phase, setPhase] = useState<Phase>('loading');
    const [question, setQuestion] = useState<QuestionData | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
    const [playersCount, setPlayersCount] = useState<number>(0);
    const [playersAnsweredCount, setPlayersAnsweredCount] = useState<number>(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [timeRemainingMs, setTimeRemainingMs] = useState<number>(0);
    const [timePerQuestion, setTimePerQuestion] = useState<number>(gameSession.time_per_question);
    const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
    const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
    const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
    const [networkError, setNetworkError] = useState<string | null>(null);
    const [playerScore, setPlayerScore] = useState(player.score);
    const [leaderboardPosition, setLeaderboardPosition] = useState<number | null>(null);

    const playerUuidRef = useRef<string | null>(null);
    const isMountedRef = useRef(true);

    // Read player_uuid from sessionStorage on mount
    useEffect(() => {
        const uuid = sessionStorage.getItem('player_uuid');
        if (!uuid) {
            setPhase('no_session');
            return;
        }
        playerUuidRef.current = uuid;

        // If the game is already in progress when the player (re)connects, compute
        // the elapsed time to seed the local countdown timer correctly.
        if (gameSession.status === 'in_progress' && gameSession.question_started_at) {
            const elapsed = Date.now() - new Date(gameSession.question_started_at).getTime();
            const remaining = Math.max(0, gameSession.time_per_question * 1000 - elapsed);
            setTimeRemainingMs(remaining);
            setTimePerQuestion(gameSession.time_per_question);
            setCurrentQuestionIndex(gameSession.current_question_index);
            setPhase('playing');
        } else if (gameSession.status === 'completed') {
            setPhase('completed');
        } else {
            setPhase('waiting');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const getCsrfToken = useCallback(() => {
        return decodeURIComponent(
            document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
        );
    }, []);

    // Subscribe to Echo channel events
    useEffect(() => {
        if (phase === 'no_session') return;

        const channel = echo.channel(`game.${gameSession.uuid}`);

        channel.listen('.game.started', () => {
            // Server will immediately broadcast question.started next
            setPhase('waiting');
        });

        channel.listen('.question.started', (data: {
            questionIndex: number;
            question: QuestionData;
            timePerQuestion: number;
            isLast: boolean;
        }) => {
            setQuestion(data.question);
            setCurrentQuestionIndex(data.questionIndex);
            setTimeRemainingMs(data.timePerQuestion * 1000);
            setTimePerQuestion(data.timePerQuestion);
            setPlayersAnsweredCount(0);
            setSelectedAnswerId(null);
            setAnswerResult(null);
            setNetworkError(null);
            setPhase('playing');
        });

        channel.listen('.answer.submitted', (data: {
            playersAnsweredCount: number;
            playersCount: number;
        }) => {
            setPlayersCount(data.playersCount);
            setPlayersAnsweredCount(data.playersAnsweredCount);
        });

        channel.listen('.question.ended', (data: {
            correctAnswerId: number;
            leaderboard: LeaderboardEntry[];
        }) => {
            const position = data.leaderboard.findIndex(
                (p) => p.uuid === playerUuidRef.current,
            );
            if (position !== -1) {
                setLeaderboardPosition(position + 1);
                setPlayerScore(data.leaderboard[position].score);
            }
            setLeaderboard(data.leaderboard);
            setPhase('reviewing');
        });

        channel.listen('.game.completed', (data: { leaderboard: LeaderboardEntry[] }) => {
            const position = data.leaderboard.findIndex(
                (p) => p.uuid === playerUuidRef.current,
            );
            if (position !== -1) {
                setLeaderboardPosition(position + 1);
                setPlayerScore(data.leaderboard[position].score);
            }
            setLeaderboard(data.leaderboard);
            setPhase('completed');
        });

        return () => {
            echo.leaveChannel(`game.${gameSession.uuid}`);
        };
    }, [gameSession.uuid, phase === 'no_session']); // eslint-disable-line react-hooks/exhaustive-deps

    // Local countdown timer — ticks every 100 ms while in playing phase
    useEffect(() => {
        if (phase !== 'playing') return;

        const interval = setInterval(() => {
            setTimeRemainingMs((prev) => Math.max(0, prev - 100));
        }, 100);

        return () => clearInterval(interval);
    }, [phase]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const handleAnswer = useCallback(async (answerId: number) => {
        if (isSubmittingAnswer || selectedAnswerId !== null) return;

        const uuid = playerUuidRef.current;
        if (!uuid) return;

        setIsSubmittingAnswer(true);
        setSelectedAnswerId(answerId);

        try {
            const response = await fetch(`/api/game/${gameSession.uuid}/answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ answer_id: answerId, player_uuid: uuid }),
            });

            if (!isMountedRef.current) return;

            if (response.ok) {
                const data = await response.json();
                setAnswerResult({
                    isCorrect: data.is_correct ?? false,
                    pointsEarned: data.points_earned ?? 0,
                });
                setPhase('answered');
            } else {
                // Server rejected — unselect so player can try again
                setSelectedAnswerId(null);
                setNetworkError('Réponse non envoyée. Réessaie !');
            }
        } catch {
            if (isMountedRef.current) {
                setSelectedAnswerId(null);
                setNetworkError('Réponse non envoyée. Vérifie ta connexion.');
            }
        } finally {
            if (isMountedRef.current) {
                setIsSubmittingAnswer(false);
            }
        }
    }, [gameSession.uuid, getCsrfToken, isSubmittingAnswer, selectedAnswerId]);

    // ── Render helpers ────────────────────────────────────────────────

    if (phase === 'loading') {
        return (
            <>
                <Head title="Chargement..." />
                <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center">
                    <SpinnerIcon className="animate-spin h-12 w-12 text-white" />
                </div>
            </>
        );
    }

    if (phase === 'no_session') {
        return (
            <>
                <Head title="Session expirée" />
                <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex flex-col items-center justify-center p-6 text-center">
                    <div className="text-6xl mb-6" role="img" aria-label="erreur">😅</div>
                    <h1 className="text-2xl font-extrabold text-white mb-3">Session introuvable</h1>
                    <p className="text-white/80 mb-8 max-w-xs">
                        Ta session a expiré ou tu as accédé à cette page directement. Rejoins la partie depuis le début.
                    </p>
                    <a
                        href="/play"
                        className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-purple-700 font-bold text-lg shadow-lg hover:bg-white/90 transition-colors"
                    >
                        Rejoindre une partie
                    </a>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`Jouer — ${player.nickname}`} />

            <div className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex flex-col select-none">

                {/* Network error banner */}
                {networkError && (
                    <div
                        className="bg-red-500/90 text-white text-sm font-semibold text-center px-4 py-2"
                        role="alert"
                        aria-live="assertive"
                    >
                        {networkError}
                    </div>
                )}

                {/* Waiting state */}
                {phase === 'waiting' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                            <span className="text-4xl" role="img" aria-label="quiz">🎯</span>
                        </div>

                        <div>
                            <h1 className="text-3xl font-extrabold text-white drop-shadow-md mb-2">
                                Tu es prêt !
                            </h1>
                            <p className="text-white/80 text-lg font-medium">
                                En attente du lancement...
                            </p>
                        </div>

                        {/* Player badge */}
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-5 shadow-lg">
                            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                                Ton pseudo
                            </p>
                            <p className="text-white text-3xl font-extrabold tracking-tight">
                                {player.nickname}
                            </p>
                        </div>

                        {/* Players count */}
                        {playersCount > 0 && (
                            <p className="text-white/60 text-sm font-medium">
                                {playersCount} joueur{playersCount > 1 ? 's' : ''} connecté{playersCount > 1 ? 's' : ''}
                            </p>
                        )}

                        <PulsingDots />

                        <style>{`
                            @keyframes pulse {
                                0%, 100% { opacity: 0.3; transform: scale(0.8); }
                                50% { opacity: 1; transform: scale(1.2); }
                            }
                        `}</style>
                    </div>
                )}

                {/* Playing state */}
                {phase === 'playing' && question && (
                    <div className="flex-1 flex flex-col">
                        <TimerBar
                            timeRemainingMs={timeRemainingMs}
                            totalMs={timePerQuestion * 1000}
                        />

                        {/* Progress indicator */}
                        <div className="px-4 pb-3 flex items-center justify-between">
                            <span className="text-white/70 text-sm font-semibold">
                                Question {currentQuestionIndex + 1}
                            </span>
                            <span className="text-white/70 text-sm font-semibold">
                                {playersAnsweredCount}/{playersCount} ont répondu
                            </span>
                        </div>

                        {/* Answer buttons grid */}
                        <div className="flex-1 grid grid-cols-2 gap-3 p-4 pb-6">
                            {question.answers.slice(0, 4).map((answer, index) => {
                                const color = ANSWER_COLORS[index % ANSWER_COLORS.length];
                                const shape = ANSWER_SHAPES[index % ANSWER_SHAPES.length];

                                return (
                                    <button
                                        key={answer.id}
                                        onClick={() => handleAnswer(answer.id)}
                                        disabled={isSubmittingAnswer}
                                        aria-label={`Répondre : ${answer.body}`}
                                        className={[
                                            'flex flex-col items-center justify-center gap-2 rounded-2xl h-28 shadow-lg shadow-black/20',
                                            'font-extrabold text-white transition-transform duration-100',
                                            'active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50',
                                            color.bg,
                                            color.hover,
                                            color.active,
                                            isSubmittingAnswer ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer',
                                        ].join(' ')}
                                    >
                                        <span className="text-3xl leading-none" aria-hidden="true">
                                            {shape}
                                        </span>
                                        <span className="text-base font-bold leading-tight text-center px-2 line-clamp-2">
                                            {answer.body}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Answered state */}
                {phase === 'answered' && answerResult && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6">
                        <div
                            className={`inline-flex items-center justify-center w-24 h-24 rounded-full shadow-xl ${
                                answerResult.isCorrect ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            aria-hidden="true"
                        >
                            <span className="text-5xl">
                                {answerResult.isCorrect ? '✓' : '✗'}
                            </span>
                        </div>

                        <div>
                            <h2 className="text-3xl font-extrabold text-white drop-shadow-md mb-2">
                                {answerResult.isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse'}
                            </h2>
                            <p className="text-white/80 text-lg font-medium">
                                Réponse envoyée
                            </p>
                        </div>

                        {answerResult.isCorrect && answerResult.pointsEarned > 0 && (
                            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-lg">
                                <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                                    Points gagnés
                                </p>
                                <p className="text-white text-4xl font-extrabold">
                                    +{answerResult.pointsEarned}
                                </p>
                            </div>
                        )}

                        <p className="text-white/60 text-sm font-medium">
                            En attente de la prochaine question...
                        </p>

                        <PulsingDots />

                        <style>{`
                            @keyframes pulse {
                                0%, 100% { opacity: 0.3; transform: scale(0.8); }
                                50% { opacity: 1; transform: scale(1.2); }
                            }
                        `}</style>
                    </div>
                )}

                {/* Answered state without result (edge case: answer submitted but no server response yet) */}
                {phase === 'answered' && !answerResult && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6">
                        <SpinnerIcon className="animate-spin h-12 w-12 text-white" />
                        <p className="text-white font-bold text-xl">Réponse envoyée !</p>
                        <p className="text-white/70 text-sm">En attente du résultat...</p>
                    </div>
                )}

                {/* Reviewing state (between questions) */}
                {phase === 'reviewing' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6">
                        <div className="text-5xl" role="img" aria-label="classement">🏆</div>

                        <div>
                            <h2 className="text-3xl font-extrabold text-white drop-shadow-md mb-2">
                                Résultats
                            </h2>
                            {answerResult && (
                                <p className={`text-lg font-semibold ${answerResult.isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                                    {answerResult.isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse'}
                                </p>
                            )}
                        </div>

                        {/* Score card */}
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-5 shadow-lg w-full max-w-xs">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">
                                        Ton score
                                    </p>
                                    <p className="text-white text-4xl font-extrabold tabular-nums">
                                        {playerScore.toLocaleString('fr-FR')}
                                    </p>
                                </div>
                                {leaderboardPosition !== null && (
                                    <div className="text-right">
                                        <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">
                                            Position
                                        </p>
                                        <p className="text-white text-4xl font-extrabold">
                                            #{leaderboardPosition}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mini leaderboard */}
                        {leaderboard.length > 0 && (
                            <div className="w-full max-w-xs">
                                <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-3 text-center">
                                    Top joueurs
                                </p>
                                <ol className="flex flex-col gap-2">
                                    {leaderboard.slice(0, 3).map((p, i) => {
                                        const isCurrentPlayer = p.uuid === playerUuidRef.current;
                                        return (
                                            <li
                                                key={p.uuid}
                                                className={`flex items-center justify-between rounded-xl px-4 py-2 ${
                                                    isCurrentPlayer
                                                        ? 'bg-white/30 font-extrabold'
                                                        : 'bg-white/10 font-semibold'
                                                }`}
                                            >
                                                <span className="text-white/80 text-sm w-6">
                                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                                                </span>
                                                <span className="text-white text-sm flex-1 text-left pl-2 truncate">
                                                    {p.nickname}
                                                    {isCurrentPlayer && (
                                                        <span className="text-white/60 text-xs ml-1">(toi)</span>
                                                    )}
                                                </span>
                                                <span className="text-white text-sm tabular-nums">
                                                    {p.score.toLocaleString('fr-FR')}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                        )}

                        <p className="text-white/60 text-sm font-medium">
                            Prépare-toi pour la prochaine question...
                        </p>

                        <PulsingDots />

                        <style>{`
                            @keyframes pulse {
                                0%, 100% { opacity: 0.3; transform: scale(0.8); }
                                50% { opacity: 1; transform: scale(1.2); }
                            }
                        `}</style>
                    </div>
                )}

                {/* Completed state */}
                {phase === 'completed' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6">
                        <div className="text-6xl" role="img" aria-label="fin de partie">
                            {leaderboardPosition === 1 ? '🏆' : leaderboardPosition === 2 ? '🥈' : leaderboardPosition === 3 ? '🥉' : '🎉'}
                        </div>

                        <div>
                            <h1 className="text-3xl font-extrabold text-white drop-shadow-md mb-2">
                                Partie terminée !
                            </h1>
                            <p className="text-white/80 text-lg font-medium">
                                Bravo, {player.nickname} !
                            </p>
                        </div>

                        {/* Final score card */}
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg w-full max-w-xs">
                            {leaderboardPosition !== null && (
                                <div className="mb-4">
                                    <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                                        Classement final
                                    </p>
                                    <p className="text-white text-5xl font-extrabold">
                                        #{leaderboardPosition}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                                    Score final
                                </p>
                                <p className="text-white text-4xl font-extrabold tabular-nums">
                                    {playerScore.toLocaleString('fr-FR')}
                                </p>
                                <p className="text-white/60 text-xs mt-1">points</p>
                            </div>
                        </div>

                        {/* Full leaderboard */}
                        {leaderboard.length > 0 && (
                            <div className="w-full max-w-xs">
                                <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-3 text-center">
                                    Classement final
                                </p>
                                <ol className="flex flex-col gap-2">
                                    {leaderboard.slice(0, 5).map((p, i) => {
                                        const isCurrentPlayer = p.uuid === playerUuidRef.current;
                                        const medals = ['🥇', '🥈', '🥉'];
                                        return (
                                            <li
                                                key={p.uuid}
                                                className={`flex items-center justify-between rounded-xl px-4 py-3 transition-all ${
                                                    isCurrentPlayer
                                                        ? 'bg-white/30 ring-2 ring-white/50 font-extrabold scale-105'
                                                        : 'bg-white/10 font-semibold'
                                                }`}
                                            >
                                                <span className="text-white/80 text-sm w-8 shrink-0">
                                                    {medals[i] ?? `${i + 1}.`}
                                                </span>
                                                <span className="text-white text-sm flex-1 text-left pl-1 truncate">
                                                    {p.nickname}
                                                    {isCurrentPlayer && (
                                                        <span className="text-white/60 text-xs ml-1">(toi)</span>
                                                    )}
                                                </span>
                                                <span className="text-white text-sm tabular-nums">
                                                    {p.score.toLocaleString('fr-FR')}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                        )}

                        <a
                            href="/play"
                            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-purple-700 font-bold text-lg shadow-lg hover:bg-white/90 transition-colors mt-2"
                        >
                            Rejouer
                        </a>
                    </div>
                )}

                {/* Player nickname footer (always visible during play) */}
                {(phase === 'playing' || phase === 'answered' || phase === 'reviewing') && (
                    <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-white/10">
                        <span className="text-white/60 text-xs font-medium truncate max-w-[120px]">
                            {player.nickname}
                        </span>
                        <span className="text-white/80 text-sm font-bold tabular-nums">
                            {playerScore.toLocaleString('fr-FR')} pts
                        </span>
                    </div>
                )}
            </div>
        </>
    );
}
