import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Trophy, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import echo from '@/echo';
import type { BreadcrumbItem, GameSession, GamePlayer, GameSessionStatus, Question } from '@/types';

interface HostProps {
    gameSession: GameSession;
    currentQuestion: Question | null;
    leaderboard: GamePlayer[];
}

type AnswerCount = { answer_id: number; count: number };
type LeaderboardEntry = { uuid: string; nickname: string; score: number };

type QuestionStartedQuestion = {
    id: number;
    body: string;
    media: Question['media'];
    answers: { id: number; body: string; order: number }[];
};

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

/** Compute initial time remaining in ms from a question_started_at timestamp and time_per_question (seconds). */
function computeInitialTimeRemaining(questionStartedAt: string | null, timePerQuestion: number): number {
    if (!questionStartedAt) return timePerQuestion * 1000;
    const elapsedMs = Date.now() - new Date(questionStartedAt).getTime();
    return Math.max(0, timePerQuestion * 1000 - elapsedMs);
}

export default function Host({ gameSession, currentQuestion: initialQuestion, leaderboard: initialLeaderboard }: HostProps) {
    const [status, setStatus] = useState<GameSessionStatus>(gameSession.status);
    const [currentIndex, setCurrentIndex] = useState(gameSession.current_question_index);
    const [isLastQuestion, setIsLastQuestion] = useState(false);

    // Active question — starts from Inertia prop, updated on question.started events
    const [activeQuestion, setActiveQuestion] = useState<QuestionStartedQuestion | null>(
        initialQuestion
            ? {
                id: initialQuestion.id,
                body: initialQuestion.body,
                media: initialQuestion.media,
                answers: initialQuestion.answers.map(a => ({ id: a.id, body: a.body, order: a.order })),
            }
            : null,
    );

    // Players state — updated on answer.submitted events
    const [playersCount, setPlayersCount] = useState(gameSession.players?.length ?? 0);
    const [playersAnsweredCount, setPlayersAnsweredCount] = useState(0);

    // Leaderboard — updated on question.ended events
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(
        initialLeaderboard.map(p => ({ uuid: p.uuid, nickname: p.nickname, score: p.score })),
    );

    // Correct answer reveal — updated on question.ended events
    const [correctAnswerId, setCorrectAnswerId] = useState<number | null>(null);
    const [answerCounts, setAnswerCounts] = useState<AnswerCount[]>([]);

    // Phase-over flag — set by question.ended event; reset on question.started
    const [isQuestionPhaseOver, setIsQuestionPhaseOver] = useState(false);

    // Countdown timer in ms
    const [timeRemainingMs, setTimeRemainingMs] = useState(() =>
        gameSession.status === 'in_progress'
            ? computeInitialTimeRemaining(gameSession.question_started_at, gameSession.time_per_question)
            : 0,
    );

    const [isAdvancing, setIsAdvancing] = useState(false);

    const totalQuestions = gameSession.quiz?.questions?.length ?? 0;
    const questionNumber = currentIndex + 1;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quizzes', href: '/quizzes' },
        { title: gameSession.quiz?.title ?? 'Quiz', href: `/quizzes/${gameSession.quiz?.uuid ?? ''}` },
        { title: 'Partie en cours', href: '#' },
    ];

    const hasRedirectedRef = useRef(false);

    // Echo channel subscriptions
    useEffect(() => {
        const channel = echo.channel(`game.${gameSession.uuid}`);

        channel.listen('.answer.submitted', (data: { playersAnsweredCount: number; playersCount: number }) => {
            setPlayersAnsweredCount(data.playersAnsweredCount);
            setPlayersCount(data.playersCount);
        });

        channel.listen('.question.ended', (data: { correctAnswerId: number; answerCounts: AnswerCount[]; leaderboard: LeaderboardEntry[] }) => {
            setCorrectAnswerId(data.correctAnswerId);
            setAnswerCounts(data.answerCounts);
            setLeaderboard(data.leaderboard);
            setIsQuestionPhaseOver(true);
            setStatus('reviewing');
        });

        channel.listen('.question.started', (data: { questionIndex: number; question: QuestionStartedQuestion; timePerQuestion: number; isLast: boolean }) => {
            setActiveQuestion(data.question);
            setCurrentIndex(data.questionIndex);
            setTimeRemainingMs(data.timePerQuestion * 1000);
            setIsQuestionPhaseOver(false);
            setCorrectAnswerId(null);
            setAnswerCounts([]);
            setPlayersAnsweredCount(0);
            setIsLastQuestion(data.isLast);
            setStatus('in_progress');
        });

        channel.listen('.game.completed', () => {
            if (hasRedirectedRef.current) return;
            hasRedirectedRef.current = true;
            setStatus('completed');
            router.visit(`/games/${gameSession.uuid}/results`);
        });

        return () => {
            echo.leaveChannel(`game.${gameSession.uuid}`);
        };
    }, [gameSession.uuid]);

    // Countdown timer: decrements every 100ms when a question is active and not yet over
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (status === 'in_progress' && !isQuestionPhaseOver && timeRemainingMs > 0) {
            timerRef.current = setInterval(() => {
                setTimeRemainingMs(prev => {
                    const next = prev - 100;
                    if (next <= 0) {
                        if (timerRef.current) {
                            clearInterval(timerRef.current);
                            timerRef.current = null;
                        }
                        return 0;
                    }
                    return next;
                });
            }, 100);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [status, isQuestionPhaseOver]);

    // Derived display values
    const timeTotalMs = gameSession.time_per_question * 1000;
    const timerPercent = timeTotalMs > 0 ? Math.min(100, Math.max(0, (timeRemainingMs / timeTotalMs) * 100)) : 0;
    const timerColor = timerPercent > 50 ? 'bg-green-500' : timerPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

    // Reveal answers when the server confirmed phase-over OR timer ran out locally
    const shouldRevealAnswers = isQuestionPhaseOver || timeRemainingMs <= 0;

    // Correct answer IDs: from question.ended event if available, otherwise fall back to the initial prop
    const correctAnswerIdsFromEvent = correctAnswerId !== null ? new Set([correctAnswerId]) : null;
    const correctAnswerIdsFromProp = new Set(
        (initialQuestion?.answers ?? []).filter(a => a.is_correct).map(a => a.id),
    );
    const correctAnswerIds = correctAnswerIdsFromEvent ?? correctAnswerIdsFromProp;

    async function handleNextQuestion() {
        if (isAdvancing || hasRedirectedRef.current) return;
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
                const data = await res.json();
                if (data.status === 'completed' && !hasRedirectedRef.current) {
                    hasRedirectedRef.current = true;
                    setStatus('completed');
                    router.visit(`/games/${gameSession.uuid}/results`);
                    return;
                }
            }
        } catch {
            // ignore — the Echo event will update state if the request succeeds server-side
        } finally {
            if (!hasRedirectedRef.current) {
                setIsAdvancing(false);
            }
        }
    }

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
                    </div>
                </div>

                {/* Timer progress bar */}
                {status === 'in_progress' && (
                    <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700" role="progressbar" aria-valuenow={Math.ceil(timeRemainingMs / 1000)} aria-valuemax={gameSession.time_per_question} aria-label="Temps restant">
                        <div
                            className={`h-full rounded-full transition-all duration-100 ease-linear ${timerColor}`}
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

                                        // Answer count for this answer (if available from event)
                                        const answerCount = answerCounts.find(ac => ac.answer_id === answer.id)?.count ?? 0;

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

                                                {/* Answer count badge (shown after reveal) */}
                                                {shouldRevealAnswers && answerCounts.length > 0 && (
                                                    <span className="absolute bottom-3 right-4 rounded-full bg-black/20 px-2 py-0.5 text-xs font-semibold">
                                                        {answerCount}
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
                                        {isLastQuestion || currentIndex + 1 >= totalQuestions ? 'Terminer la partie' : 'Question suivante'}
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
