import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, PaginatedData, Quiz, QuizAttempt } from '@/types';

type Stats = {
    total_attempts: number;
    average_score: number;
    total_questions: number;
    completion_rate: number;
};

export default function QuizzesResults({ quiz, attempts, stats }: { quiz: Quiz; attempts: PaginatedData<QuizAttempt>; stats: Stats }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quizzes', href: '/quizzes' },
        { title: quiz.title, href: `/quizzes/${quiz.uuid}/edit` },
        { title: 'Résultats', href: `/quizzes/${quiz.uuid}/results` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Résultats - ${quiz.title}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <h1 className="text-2xl font-bold">Résultats</h1>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-xl border p-4">
                        <p className="text-muted-foreground text-sm">Total tentatives</p>
                        <p className="text-3xl font-bold">{stats.total_attempts}</p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-muted-foreground text-sm">Score moyen</p>
                        <p className="text-3xl font-bold">{stats.average_score}/{stats.total_questions}</p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-muted-foreground text-sm">Taux de complétion</p>
                        <p className="text-3xl font-bold">{stats.completion_rate}%</p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-muted-foreground text-sm">Questions</p>
                        <p className="text-3xl font-bold">{stats.total_questions}</p>
                    </div>
                </div>

                <div className="rounded-xl border">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="p-4 font-medium">Participant</th>
                                <th className="p-4 font-medium">Email</th>
                                <th className="p-4 font-medium">Score</th>
                                <th className="p-4 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attempts.data.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-muted-foreground p-8 text-center">
                                        Aucune tentative pour le moment.
                                    </td>
                                </tr>
                            ) : (
                                attempts.data.map((attempt) => (
                                    <tr key={attempt.id} className="border-b last:border-0">
                                        <td className="p-4">{attempt.participant_name ?? 'Anonyme'}</td>
                                        <td className="p-4">{attempt.participant_email ?? '-'}</td>
                                        <td className="p-4">
                                            {attempt.score}/{attempt.total_questions}
                                            <span className="text-muted-foreground ml-2 text-sm">
                                                ({attempt.total_questions > 0 ? Math.round((attempt.score / attempt.total_questions) * 100) : 0}%)
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
