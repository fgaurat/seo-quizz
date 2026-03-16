import { Head, Link } from '@inertiajs/react';
import { Monitor, Play, Radio, Trophy, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, PaginatedData } from '@/types';

type GameSessionRow = {
    id: number;
    uuid: string;
    pin: string;
    status: 'waiting' | 'in_progress' | 'reviewing' | 'completed';
    time_per_question: number;
    players_count: number;
    responses_count: number;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
    quiz?: { id: number; uuid: string; title: string } | null;
};

type Props = {
    sessions: PaginatedData<GameSessionRow>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Parties live', href: '/games' },
];

const statusConfig: Record<GameSessionRow['status'], { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    waiting: { label: 'En attente', variant: 'secondary' },
    in_progress: { label: 'En cours', variant: 'default' },
    reviewing: { label: 'Résultats', variant: 'outline' },
    completed: { label: 'Terminée', variant: 'outline' },
};

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function GamesIndex({ sessions }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Parties live" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Historique des parties</h1>
                </div>

                {sessions.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12">
                        <Radio className="text-muted-foreground mb-4 h-12 w-12" />
                        <h3 className="mb-2 text-lg font-semibold">Aucune partie</h3>
                        <p className="text-muted-foreground mb-4">
                            Lancez votre premier live depuis la page Quizzes.
                        </p>
                        <Button asChild>
                            <Link href="/quizzes">
                                <Users className="mr-2 h-4 w-4" />
                                Voir mes quizzes
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-xl border">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="p-4 font-medium">Quiz</th>
                                        <th className="p-4 font-medium">PIN</th>
                                        <th className="p-4 font-medium">Statut</th>
                                        <th className="p-4 font-medium">Joueurs</th>
                                        <th className="p-4 font-medium">Réponses</th>
                                        <th className="p-4 font-medium">Date</th>
                                        <th className="p-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.data.map((session) => {
                                        const { label, variant } = statusConfig[session.status];
                                        const dateString = session.started_at ?? session.created_at;

                                        return (
                                            <tr key={session.id} className="border-b last:border-0">
                                                <td className="p-4 font-medium">
                                                    {session.quiz ? (
                                                        <Link
                                                            href={`/quizzes/${session.quiz.uuid}/edit`}
                                                            className="hover:underline"
                                                        >
                                                            {session.quiz.title}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-mono text-sm">{session.pin}</span>
                                                </td>
                                                <td className="p-4">
                                                    <Badge
                                                        variant={variant}
                                                        className={session.status === 'in_progress' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : undefined}
                                                    >
                                                        {label}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">{session.players_count}</td>
                                                <td className="p-4">{session.responses_count}</td>
                                                <td className="p-4 text-sm">{formatDate(dateString)}</td>
                                                <td className="p-4">
                                                    <div className="flex justify-end gap-2">
                                                        {session.status === 'completed' && (
                                                            <Button variant="ghost" size="icon" asChild title="Voir les résultats">
                                                                <Link href={`/games/${session.uuid}/results`}>
                                                                    <Trophy className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {session.status === 'waiting' && (
                                                            <Button variant="ghost" size="icon" asChild title="Ouvrir le lobby">
                                                                <Link href={`/games/${session.uuid}/lobby`}>
                                                                    <Play className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {session.status === 'in_progress' && (
                                                            <Button variant="ghost" size="icon" asChild title="Rejoindre la partie">
                                                                <Link href={`/games/${session.uuid}/host`}>
                                                                    <Monitor className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {session.status === 'reviewing' && (
                                                            <Button variant="ghost" size="icon" asChild title="Voir les résultats">
                                                                <Link href={`/games/${session.uuid}/results`}>
                                                                    <Trophy className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {sessions.last_page > 1 && (
                            <div className="flex justify-center gap-2">
                                {sessions.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        asChild={!!link.url}
                                    >
                                        {link.url ? (
                                            <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
