import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem, QuizStatus } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Quizzes', href: '/quizzes' },
    { title: 'Créer', href: '/quizzes/create' },
];

export default function QuizzesCreate() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        status: 'draft' as QuizStatus,
        settings: {
            show_results: true,
            randomize_questions: false,
            randomize_answers: false,
            time_limit: null as number | null,
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/quizzes');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Créer un quiz" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-2xl font-bold">Créer un quiz</h1>

                <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titre</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Mon quiz..."
                        />
                        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Description du quiz..."
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Statut</Label>
                        <select
                            id="status"
                            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value as QuizStatus)}
                        >
                            <option value="draft">Brouillon</option>
                            <option value="published">Publié</option>
                            <option value="archived">Archivé</option>
                        </select>
                    </div>

                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="font-semibold">Paramètres</h3>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="show_results"
                                checked={data.settings.show_results}
                                onChange={(e) => setData('settings', { ...data.settings, show_results: e.target.checked })}
                            />
                            <Label htmlFor="show_results">Afficher les résultats après le quiz</Label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="randomize_questions"
                                checked={data.settings.randomize_questions}
                                onChange={(e) => setData('settings', { ...data.settings, randomize_questions: e.target.checked })}
                            />
                            <Label htmlFor="randomize_questions">Mélanger les questions</Label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="randomize_answers"
                                checked={data.settings.randomize_answers}
                                onChange={(e) => setData('settings', { ...data.settings, randomize_answers: e.target.checked })}
                            />
                            <Label htmlFor="randomize_answers">Mélanger les réponses</Label>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button type="submit" disabled={processing}>
                            Créer le quiz
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
