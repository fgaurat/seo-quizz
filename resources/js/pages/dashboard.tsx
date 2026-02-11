import { Head } from '@inertiajs/react';
import { BookOpen, FileQuestion, FolderOpen, Percent, Target, Users } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type DashboardStats = {
    projects_count: number;
    quizzes_count: number;
    published_quizzes_count: number;
    questions_count: number;
    attempts_count: number;
    average_score: number | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

function StatCard({ icon: Icon, label, value, description }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    description?: string;
}) {
    return (
        <div className="rounded-xl border border-sidebar-border/70 p-6 dark:border-sidebar-border">
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-sm">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                    {description && <p className="text-muted-foreground text-xs">{description}</p>}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({ stats }: { stats: DashboardStats }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <h1 className="text-2xl font-bold">Dashboard</h1>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        icon={FolderOpen}
                        label="Projets"
                        value={stats.projects_count}
                    />
                    <StatCard
                        icon={FileQuestion}
                        label="Quiz"
                        value={stats.quizzes_count}
                        description={`${stats.published_quizzes_count} publié${stats.published_quizzes_count > 1 ? 's' : ''}`}
                    />
                    <StatCard
                        icon={BookOpen}
                        label="Questions"
                        value={stats.questions_count}
                    />
                    <StatCard
                        icon={Users}
                        label="Tentatives"
                        value={stats.attempts_count}
                    />
                    <StatCard
                        icon={Percent}
                        label="Score moyen"
                        value={stats.average_score !== null ? `${stats.average_score}%` : '—'}
                    />
                    <StatCard
                        icon={Target}
                        label="Quiz publiés"
                        value={stats.published_quizzes_count}
                        description={stats.quizzes_count > 0
                            ? `${Math.round((stats.published_quizzes_count / stats.quizzes_count) * 100)}% du total`
                            : undefined}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
