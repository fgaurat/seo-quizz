import { Head, Link, router } from '@inertiajs/react';
import { FileQuestion, Plus, Code, BarChart3, Pencil, Radio, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, PaginatedData, Quiz } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Quizzes', href: '/quizzes' },
];

const statusVariant = (status: string) => {
    switch (status) {
        case 'published': return 'default';
        case 'draft': return 'secondary';
        case 'archived': return 'outline';
        default: return 'secondary';
    }
};

export default function QuizzesIndex({ quizzes }: { quizzes: PaginatedData<Quiz> }) {
    const handleLaunchLive = (quiz: Quiz) => {
        router.post('/games', { quiz_id: quiz.id });
    };

    const handleDelete = (quiz: Quiz) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
            router.delete(`/quizzes/${quiz.uuid}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Quizzes" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Mes Quizzes</h1>
                    <Button asChild>
                        <Link href="/quizzes/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Créer un quiz
                        </Link>
                    </Button>
                </div>

                {quizzes.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12">
                        <FileQuestion className="text-muted-foreground mb-4 h-12 w-12" />
                        <h3 className="mb-2 text-lg font-semibold">Aucun quiz</h3>
                        <p className="text-muted-foreground mb-4">Commencez par créer votre premier quiz.</p>
                        <Button asChild>
                            <Link href="/quizzes/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Créer un quiz
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-xl border">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="p-4 font-medium">Titre</th>
                                        <th className="p-4 font-medium">Projet</th>
                                        <th className="p-4 font-medium">Statut</th>
                                        <th className="p-4 font-medium">Questions</th>
                                        <th className="p-4 font-medium">Tentatives</th>
                                        <th className="p-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quizzes.data.map((quiz) => (
                                        <tr key={quiz.id} className="border-b last:border-0">
                                            <td className="p-4 font-medium">{quiz.title}</td>
                                            <td className="p-4">
                                                {quiz.project ? (
                                                    <Link href={`/projects/${quiz.project.uuid}`} className="text-sm hover:underline">
                                                        {quiz.project.name}
                                                    </Link>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">—</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={statusVariant(quiz.status)}>{quiz.status}</Badge>
                                            </td>
                                            <td className="p-4">{quiz.questions_count ?? 0}</td>
                                            <td className="p-4">{quiz.quiz_attempts_count ?? 0}</td>
                                            <td className="p-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/quizzes/${quiz.uuid}/edit`}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    {quiz.status === 'published' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleLaunchLive(quiz)}
                                                            title="Lancer un live"
                                                        >
                                                            <Radio className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/quizzes/${quiz.uuid}/embed`}>
                                                            <Code className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/quizzes/${quiz.uuid}/results`}>
                                                            <BarChart3 className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(quiz)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {quizzes.last_page > 1 && (
                            <div className="flex justify-center gap-2">
                                {quizzes.links.map((link, i) => (
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
