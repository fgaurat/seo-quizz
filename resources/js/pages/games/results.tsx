import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Trophy, RotateCcw, Users, Clock, Target, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, GamePlayer } from '@/types';

type QuestionStat = {
    question_id: number;
    question_body: string;
    correct_answers: number;
    total_answers: number;
    correct_percentage: number;
    avg_response_time_ms: number;
    answers: { id: number; body: string; is_correct: boolean; count: number }[];
};

type GameSessionData = {
    uuid: string;
    pin: string;
    status: string;
    quiz_title: string;
    quiz_id?: number;
    started_at: string | null;
    completed_at: string | null;
};

interface GameResultsProps {
    gameSession: GameSessionData;
    leaderboard: GamePlayer[];
    per_question_stats: QuestionStat[];
}

const MEDAL_COLORS = {
    0: {
        gradient: 'from-yellow-400 to-amber-500',
        ring: 'ring-yellow-400',
        text: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-50 dark:bg-yellow-950/30',
        label: '#FFD700',
        height: 'h-40',
        zIndex: 'z-10',
        scale: 'scale-110',
    },
    1: {
        gradient: 'from-slate-300 to-slate-400',
        ring: 'ring-slate-400',
        text: 'text-slate-500 dark:text-slate-400',
        bg: 'bg-slate-50 dark:bg-slate-900/30',
        label: '#C0C0C0',
        height: 'h-28',
        zIndex: 'z-0',
        scale: 'scale-100',
    },
    2: {
        gradient: 'from-amber-600 to-amber-700',
        ring: 'ring-amber-600',
        text: 'text-amber-700 dark:text-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        label: '#CD7F32',
        height: 'h-24',
        zIndex: 'z-0',
        scale: 'scale-100',
    },
} as const;

const RANK_LABELS = ['1er', '2ème', '3ème'];
const MEDAL_ICONS = ['🥇', '🥈', '🥉'];

// Podium display order: 2nd on left, 1st in center, 3rd on right
const PODIUM_ORDER = [1, 0, 2] as const;

export default function GameResults({ gameSession, leaderboard, per_question_stats }: GameResultsProps) {
    const [isRelaunching, setIsRelaunching] = useState(false);

    const quizTitle = gameSession.quiz_title;
    const totalPlayers = leaderboard.length;
    const totalQuestions = per_question_stats.length;
    const averageScore =
        totalPlayers > 0
            ? Math.round(leaderboard.reduce((sum, p) => sum + p.score, 0) / totalPlayers)
            : 0;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quizzes', href: '/quizzes' },
        { title: quizTitle, href: '/quizzes' },
        { title: 'Résultats live', href: '#' },
    ];

    const podiumPlayers = leaderboard.slice(0, 3);

    function handleRelaunch() {
        if (!gameSession.quiz_id || isRelaunching) return;
        setIsRelaunching(true);
        router.post(
            '/games',
            { quiz_id: gameSession.quiz_id },
            {
                onFinish: () => setIsRelaunching(false),
            },
        );
    }

    const completedAt = gameSession.completed_at
        ? new Date(gameSession.completed_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Résultats live — ${quizTitle}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">

                {/* Page header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Trophy className="h-7 w-7 text-yellow-500" />
                            <h1 className="text-2xl font-extrabold">Résultats de la partie</h1>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {quizTitle}
                            {completedAt && (
                                <span className="ml-2">— terminée le {completedAt}</span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/quizzes">
                            <Button variant="outline" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Retour aux quizzes
                            </Button>
                        </Link>
                        <Button
                            onClick={handleRelaunch}
                            disabled={isRelaunching || !gameSession.quiz_id}
                            className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {isRelaunching ? (
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : (
                                <RotateCcw className="h-4 w-4" />
                            )}
                            Relancer une partie
                        </Button>
                    </div>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            <p className="text-muted-foreground text-sm font-medium">Joueurs</p>
                        </div>
                        <p className="mt-1 text-3xl font-extrabold">{totalPlayers}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-green-500" />
                            <p className="text-muted-foreground text-sm font-medium">Questions</p>
                        </div>
                        <p className="mt-1 text-3xl font-extrabold">{totalQuestions}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <p className="text-muted-foreground text-sm font-medium">Score moyen</p>
                        </div>
                        <p className="mt-1 text-3xl font-extrabold">{averageScore.toLocaleString('fr-FR')} pts</p>
                    </div>
                </div>

                {/* Podium */}
                {podiumPlayers.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                Podium
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-center gap-3 pb-4 pt-6">
                                {PODIUM_ORDER.map((playerIndex) => {
                                    const player = podiumPlayers[playerIndex];
                                    if (!player) return <div key={playerIndex} className="w-28" />;

                                    const medal = MEDAL_COLORS[playerIndex as keyof typeof MEDAL_COLORS];
                                    const rankLabel = RANK_LABELS[playerIndex];
                                    const medalIcon = MEDAL_ICONS[playerIndex];

                                    return (
                                        <div
                                            key={player.id}
                                            className={`flex flex-col items-center ${medal.zIndex} ${medal.scale} transition-transform`}
                                        >
                                            {/* Avatar / medal icon */}
                                            <div
                                                className={`mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${medal.gradient} ring-4 ${medal.ring} shadow-lg text-2xl`}
                                                aria-hidden="true"
                                            >
                                                {medalIcon}
                                            </div>

                                            {/* Nickname */}
                                            <p className="mb-1 max-w-[7rem] truncate text-center text-sm font-bold leading-tight">
                                                {player.nickname}
                                            </p>

                                            {/* Score */}
                                            <p className={`mb-2 text-xs font-semibold ${medal.text}`}>
                                                {player.score.toLocaleString('fr-FR')} pts
                                            </p>

                                            {/* Podium block */}
                                            <div
                                                className={`flex w-28 ${medal.height} items-center justify-center rounded-t-xl bg-gradient-to-b ${medal.gradient} shadow-md`}
                                            >
                                                <span className={`text-lg font-extrabold ${medal.bg} rounded-full px-3 py-0.5 text-sm`}>
                                                    {rankLabel}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Full leaderboard */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Classement complet
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {leaderboard.length === 0 ? (
                            <p className="text-muted-foreground px-6 py-8 text-center text-sm">
                                Aucun joueur n'a participé à cette partie.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="px-6 py-3 text-sm font-medium text-muted-foreground">Rang</th>
                                            <th className="px-6 py-3 text-sm font-medium text-muted-foreground">Joueur</th>
                                            <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Score</th>
                                            <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Bonnes réponses</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.map((player, index) => {
                                            const rank = index + 1;
                                            const medalIcon = MEDAL_ICONS[index] ?? null;
                                            const isTopThree = index < 3;

                                            return (
                                                <tr
                                                    key={player.id}
                                                    className={[
                                                        'border-b last:border-0 transition-colors',
                                                        isTopThree ? 'bg-accent/30' : 'hover:bg-muted/40',
                                                    ].join(' ')}
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className="flex items-center gap-2 font-mono text-sm font-bold">
                                                            {medalIcon ? (
                                                                <span className="text-lg" aria-label={`${rank}e place`}>
                                                                    {medalIcon}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground w-7 text-center">
                                                                    {rank}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-semibold">{player.nickname}</span>
                                                        {!player.is_connected && (
                                                            <span className="text-muted-foreground ml-2 text-xs">(déconnecté)</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                        {player.score.toLocaleString('fr-FR')} pts
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                                                        —
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Per-question stats */}
                {per_question_stats.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-green-500" />
                                Statistiques par question
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {per_question_stats.map((stat, index) => {
                                const successRate =
                                    stat.total_answers > 0
                                        ? Math.round((stat.correct_answers / stat.total_answers) * 100)
                                        : 0;
                                const avgSeconds = stat.avg_response_time_ms > 0
                                    ? (stat.avg_response_time_ms / 1000).toFixed(1)
                                    : null;

                                const barColor =
                                    successRate >= 70
                                        ? 'bg-green-500'
                                        : successRate >= 40
                                          ? 'bg-yellow-500'
                                          : 'bg-red-500';

                                return (
                                    <div key={stat.question_id} className="rounded-xl border bg-card p-4 shadow-sm">
                                        <div className="mb-3 flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                                    {index + 1}
                                                </span>
                                                <p className="text-sm font-semibold leading-snug">
                                                    {stat.question_body}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-4 text-right">
                                                <div>
                                                    <p className="text-lg font-extrabold text-foreground">{successRate}%</p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {stat.correct_answers}/{stat.total_answers} correct
                                                        {stat.total_answers !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                                {avgSeconds && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-muted-foreground text-sm font-medium">
                                                            {avgSeconds}s moy.
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Success rate progress bar */}
                                        <div
                                            className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                                            role="progressbar"
                                            aria-valuenow={successRate}
                                            aria-valuemax={100}
                                            aria-label={`Taux de réussite question ${index + 1}`}
                                        >
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                                                style={{ width: `${successRate}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                {/* Bottom action bar */}
                <div className="flex items-center justify-between rounded-xl border bg-card px-6 py-4 shadow-sm">
                    <p className="text-muted-foreground text-sm">
                        Partie PIN <span className="font-mono font-bold text-foreground">{gameSession.pin}</span>
                        {completedAt && <span className="ml-2">— terminée le {completedAt}</span>}
                    </p>
                    <div className="flex items-center gap-3">
                        <Link href="/quizzes">
                            <Button variant="outline" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Retour aux quizzes
                            </Button>
                        </Link>
                        <Button
                            onClick={handleRelaunch}
                            disabled={isRelaunching || !gameSession.quiz_id}
                            className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {isRelaunching ? (
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : (
                                <RotateCcw className="h-4 w-4" />
                            )}
                            Relancer une partie
                        </Button>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
