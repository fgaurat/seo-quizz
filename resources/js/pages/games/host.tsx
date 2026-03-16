import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, Trophy, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, GameSession, GamePlayer, GameState, Question } from '@/types';

interface HostProps {
    gameSession: GameSession;
    currentQuestion: Question | null;
    leaderboard: GamePlayer[];
}

const ANSWER_COLORS = [
    { bg: 'bg-red-500', hover: 'hover:bg-red-600', border: 'border-red-600', text: 'text-white', label: 'A' },
    { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', border: 'border-blue-600', text: 'text-white', label: 'B' },
    { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', border: 'border-yellow-600', text: 'text-white', label: 'C' },
    { bg: 'bg-green-500', hover: 'hover:bg-green-600', border: 'border-green-600', text: 'text-white', label: 'D' },
] as const;

const MEDAL_ICONS = ['🥇', '🥈', '🥉'];

function getCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

export default function Host({ gameSession, currentQuestion: initialQuestion, leaderboard: initialLeaderboard }: HostProps) {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isAdvancing, setIsAdvancing] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasDoneCompletedRedirect = useRef(false);

    const totalQuestions = gameSession.quiz?.questions?.length ?? 0;
    const currentIndex = gameState?.current_question_index ?? gameSession.current_question_index;
    const questionNumber = currentIndex + 1;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quizzes', href: '/quizzes' },
        { title: gameSession.quiz?.title ?? 'Quiz', href: `/quizzes/${gameSession.quiz?.uuid ?? ''}` },
        { title: 'Partie en cours', href: '#' },
    ];

    // Derived state from polling
    const status = gameState?.status ?? gameSession.status;
    const timeRemainingMs = gameState?.time_remaining_ms ?? 0;
    const timeTotalMs = gameSession.time_per_question * 1000;
    const timerPercent = timeTotalMs > 0 ? Math.min(100, Math.max(0, (timeRemainingMs / timeTotalMs) * 100)) : 0;
    const playersCount = gameState?.players_count ?? (gameSession.players?.length ?? 0);
    const playersAnsweredCount = gameState?.players_answered_count ?? 0;

    // Decide whether to reveal correct answers:
    // reveal when timer <= 0 OR all players have answered, AND we have a question active
    const isQuestionPhaseOver = status === 'reviewing' || (timeRemainingMs <= 0 && status === 'in_progress') || (playersAnsweredCount >= playersCount && playersCount > 0 && status === 'in_progress');
    const shouldRevealAnswers = isQuestionPhaseOver;

    // Merge leaderboard: prefer polled data, fall back to prop
    const leaderboard = gameState?.leaderboard ?? initialLeaderboard.map(p => ({ uuid: p.uuid, nickname: p.nickname, score: p.score }));

    // Active question from state or prop
    const activeQuestion = gameState?.question
        ? {
            id: gameState.question.id,
            body: gameState.question.body,
            media: gameState.question.media,
            answers: gameState.question.answers.map(a => ({
                id: a.id,
                body: a.body,
                order: a.order,
                // is_correct is NOT in GameState.question.answers by design (hidden from players)
                // We get it from the initial question prop when revealing
            })),
        }
        : initialQuestion;

    // Map of answer id -> is_correct from the initial prop (available post-reveal)
    const correctAnswerIds = new Set(
        (initialQuestion?.answers ?? []).filter(a => a.is_correct).map(a => a.id)
    );

    // Response counts per answer id from leaderboard perspective not available in GameState,
    // but we can infer from players_answered_count. Backend doesn't expose per-answer counts
    // in GameState, so we track locally what we can — just show "X ont répondu" totals.

    const pollState = useCallback(async () => {
        try {
            const res = await fetch(`/api/game/${gameSession.uuid}/state`, {
                headers: { 'Accept': 'application/json' },
            });
            if (!res.ok) return;
            const data: GameState = await res.json();
            setGameState(data);
            setFetchError(null);

            if (data.status === 'completed' && !hasDoneCompletedRedirect.current) {
                hasDoneCompletedRedirect.current = true;
                router.visit(`/games/${gameSession.uuid}/results`);
            }
        } catch {
            setFetchError('Impossible de récupérer l\'état de la partie.');
        }
    }, [gameSession.uuid]);

    useEffect(() => {
        // Poll immediately, then every second
        pollState();
        pollingRef.current = setInterval(pollState, 1000);
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [pollState]);

    async function handleNextQuestion() {
        if (isAdvancing) return;
        setIsAdvancing(true);
        try {
            const res = await fetch(`/api/game/${gameSession.uuid}/next`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });
            if (res.ok) {
                // Poll immediately to get updated state
                await pollState();
            }
        } catch {
            // ignore, next poll will refresh
        } finally {
            setIsAdvancing(false);
        }
    }

    // Compute timer color based on remaining time
    const timerColor = timerPercent > 50 ? 'bg-green-500' : timerPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Partie — ${gameSession.quiz?.title ?? 'Quiz'}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">

                {/* Header bar: PIN, question count, players */}
                <div className="flex items-center justify-between rounded-xl border bg-card px-5 py-3 shadow-sm">
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">PIN</p>
                            <p className="font-mono text-2xl font-extrabold tracking-widest text-primary">{gameSession.pin}</p>
                        </div>
                        <div className="text-muted-foreground h-8 w-px bg-border" aria-hidden="true" />
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span>{playersCount} joueur{playersCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span>{Math.ceil(timeRemainingMs / 1000)}s</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {status !== 'completed' && (
                            <span className="text-muted-foreground text-sm font-medium">
                                Question {questionNumber} / {totalQuestions}
                            </span>
                        )}
                        {fetchError && (
                            <span className="text-sm text-red-500">{fetchError}</span>
                        )}
                    </div>
                </div>

                {/* Timer progress bar */}
                {status === 'in_progress' && (
                    <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700" role="progressbar" aria-valuenow={Math.ceil(timeRemainingMs / 1000)} aria-valuemax={gameSession.time_per_question} aria-label="Temps restant">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-linear ${timerColor}`}
                            style={{ width: `${timerPercent}%` }}
                        />
                    </div>
                )}

                {/* Main content area */}
                {status === 'waiting' && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-6">
                        <div className="text-center">
                            <p className="text-muted-foreground mb-2 text-lg">En attente de joueurs…</p>
                            <p className="font-mono text-6xl font-extrabold tracking-widest text-primary">{gameSession.pin}</p>
                            <p className="text-muted-foreground mt-2 text-sm">Rejoignez sur <span className="font-semibold">seo-quizz.com/join</span></p>
                        </div>
                        <div className="flex items-center gap-2 text-xl font-bold">
                            <Users className="h-6 w-6 text-blue-500" />
                            <span>{playersCount} joueur{playersCount !== 1 ? 's' : ''} connecté{playersCount !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                )}

                {(status === 'in_progress' || status === 'reviewing') && (
                    <div className="flex flex-1 flex-col gap-4">
                        {/* Question text */}
                        {activeQuestion ? (
                            <>
                                <div className="rounded-2xl border bg-card px-8 py-6 shadow-sm">
                                    <p className="text-center text-3xl font-extrabold leading-snug tracking-tight lg:text-4xl">
                                        {activeQuestion.body}
                                    </p>

                                    {/* Answer count indicator */}
                                    <div className="mt-4 flex items-center justify-center gap-2">
                                        <div className="flex h-2 w-48 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                            <div
                                                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                                                style={{ width: playersCount > 0 ? `${(playersAnsweredCount / playersCount) * 100}%` : '0%' }}
                                            />
                                        </div>
                                        <span className="text-muted-foreground text-sm font-medium">
                                            {playersAnsweredCount}/{playersCount} ont répondu
                                        </span>
                                    </div>
                                </div>

                                {/* Answer blocks — Kahoot style */}
                                <div className="grid flex-1 grid-cols-2 gap-3">
                                    {activeQuestion.answers.map((answer, index) => {
                                        const color = ANSWER_COLORS[index % ANSWER_COLORS.length];
                                        const isCorrect = correctAnswerIds.has(answer.id);
                                        const showCorrect = shouldRevealAnswers && isCorrect;
                                        const showWrong = shouldRevealAnswers && !isCorrect;

                                        return (
                                            <div
                                                key={answer.id}
                                                className={[
                                                    'relative flex min-h-24 items-center justify-center rounded-2xl border-b-4 px-6 py-4 transition-all duration-300',
                                                    color.bg,
                                                    color.border,
                                                    color.text,
                                                    showWrong ? 'opacity-40 scale-95' : 'opacity-100 scale-100',
                                                    showCorrect ? 'ring-4 ring-white ring-offset-2' : '',
                                                ].join(' ')}
                                            >
                                                {/* Letter label */}
                                                <span className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-black/20 text-sm font-bold">
                                                    {color.label}
                                                </span>

                                                {/* Correct indicator */}
                                                {showCorrect && (
                                                    <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-green-600 text-lg font-black shadow">
                                                        ✓
                                                    </span>
                                                )}

                                                <p className="text-center text-xl font-bold leading-snug lg:text-2xl">
                                                    {answer.body}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            /* Loading skeleton */
                            <div className="flex flex-1 flex-col gap-4 animate-pulse">
                                <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                                <div className="grid flex-1 grid-cols-2 gap-3">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className="min-h-24 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bottom row: leaderboard preview + next button */}
                        {shouldRevealAnswers && (
                            <div className="flex items-start gap-4">
                                {/* Top-5 leaderboard */}
                                <Card className="flex-1">
                                    <CardHeader className="pb-2 pt-4">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Trophy className="h-5 w-5 text-yellow-500" />
                                            Classement
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-4">
                                        {leaderboard.length === 0 ? (
                                            <p className="text-muted-foreground text-sm">Aucun joueur classé.</p>
                                        ) : (
                                            <ol className="space-y-2">
                                                {leaderboard.slice(0, 5).map((player, i) => (
                                                    <li key={player.uuid} className="flex items-center gap-3">
                                                        <span className="w-6 text-center text-lg" aria-hidden="true">
                                                            {MEDAL_ICONS[i] ?? `${i + 1}.`}
                                                        </span>
                                                        <span className="flex-1 truncate font-semibold">{player.nickname}</span>
                                                        <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                            {player.score.toLocaleString('fr-FR')} pts
                                                        </span>
                                                    </li>
                                                ))}
                                            </ol>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Next question / end game button */}
                                <div className="flex flex-col justify-center">
                                    <Button
                                        size="lg"
                                        onClick={handleNextQuestion}
                                        disabled={isAdvancing}
                                        className="h-14 gap-2 rounded-xl bg-indigo-600 px-8 text-lg font-bold text-white shadow-lg hover:bg-indigo-700 disabled:opacity-60"
                                    >
                                        {isAdvancing ? (
                                            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        ) : (
                                            <ChevronRight className="h-5 w-5" />
                                        )}
                                        {currentIndex + 1 >= totalQuestions ? 'Terminer la partie' : 'Question suivante'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Completed state (shown briefly before redirect) */}
                {status === 'completed' && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-6">
                        <Trophy className="h-16 w-16 text-yellow-500" />
                        <h2 className="text-3xl font-extrabold">Partie terminée !</h2>
                        <p className="text-muted-foreground">Redirection vers les résultats…</p>
                        <div className="animate-pulse">
                            <div className="h-2 w-48 rounded-full bg-indigo-300" />
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
