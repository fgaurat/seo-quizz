import { Head, router, useForm } from '@inertiajs/react';
import { Eye, Plus, Radio } from 'lucide-react';
import { useState } from 'react';
import QuestionCard from '@/components/quiz/question-card';
import QuestionFormDialog from '@/components/quiz/question-form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Project, Quiz, QuizStatus } from '@/types';

export default function QuizzesEdit({ quiz, projects }: { quiz: Quiz; projects: Pick<Project, 'id' | 'uuid' | 'name'>[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quizzes', href: '/quizzes' },
        { title: quiz.title, href: `/quizzes/${quiz.uuid}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        title: quiz.title,
        description: quiz.description ?? '',
        status: quiz.status as QuizStatus,
        project_id: quiz.project_id ?? ('' as number | ''),
        custom_css: quiz.custom_css ?? '',
        settings: quiz.settings ?? {
            show_results: true,
            randomize_questions: false,
            randomize_answers: false,
            time_limit: null,
        },
    });

    const [showQuestionDialog, setShowQuestionDialog] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Quiz['questions'][0] | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/quizzes/${quiz.uuid}`);
    };

    const handleDeleteQuestion = (questionId: number) => {
        if (confirm('Supprimer cette question ?')) {
            router.delete(`/quizzes/${quiz.uuid}/questions/${questionId}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Éditer - ${quiz.title}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Éditer le quiz</h1>
                    <div className="flex items-center gap-2">
                        {quiz.status === 'published' && (quiz.questions?.length ?? 0) >= 1 && (
                            <Button onClick={() => router.post('/games', { quiz_id: quiz.id })}>
                                <Radio className="mr-2 h-4 w-4" />
                                Lancer un live
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <a href={`/q/${quiz.uuid}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="mr-2 h-4 w-4" />
                                Visualiser
                            </a>
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titre</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="project_id">Projet (optionnel)</Label>
                        <select
                            id="project_id"
                            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                            value={data.project_id}
                            onChange={(e) => setData('project_id', e.target.value ? Number(e.target.value) : '')}
                        >
                            <option value="">Aucun projet</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
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

                    <div className="space-y-2">
                        <Label htmlFor="custom_css">CSS personnalisé</Label>
                        <p className="text-muted-foreground text-sm">Ce CSS s'applique uniquement à ce quiz et surcharge le CSS du projet.</p>
                        <textarea
                            id="custom_css"
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[160px] w-full rounded-md border px-3 py-2 font-mono text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                            value={data.custom_css}
                            onChange={(e) => setData('custom_css', e.target.value)}
                            placeholder={`.quiz-card { }\n.quiz-title { }\n.quiz-description { }\n.quiz-btn-primary { }\n.quiz-btn-secondary { }\n.quiz-answer { }\n.quiz-answer-selected { }\n.quiz-question-text { }\n.quiz-progress-fill { }\n.quiz-result-correct { }\n.quiz-result-incorrect { }`}
                        />
                        {errors.custom_css && <p className="text-sm text-red-500">{errors.custom_css}</p>}
                    </div>

                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="font-semibold">Paramètres</h3>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="show_results"
                                checked={data.settings?.show_results ?? true}
                                onChange={(e) => setData('settings', { ...data.settings, show_results: e.target.checked })}
                            />
                            <Label htmlFor="show_results">Afficher les résultats</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="randomize_questions"
                                checked={data.settings?.randomize_questions ?? false}
                                onChange={(e) => setData('settings', { ...data.settings, randomize_questions: e.target.checked })}
                            />
                            <Label htmlFor="randomize_questions">Mélanger les questions</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="randomize_answers"
                                checked={data.settings?.randomize_answers ?? false}
                                onChange={(e) => setData('settings', { ...data.settings, randomize_answers: e.target.checked })}
                            />
                            <Label htmlFor="randomize_answers">Mélanger les réponses</Label>
                        </div>
                    </div>

                    <Button type="submit" disabled={processing}>
                        Mettre à jour
                    </Button>
                </form>

                <div className="max-w-2xl space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Questions ({quiz.questions?.length ?? 0})</h2>
                        <Button onClick={() => { setEditingQuestion(null); setShowQuestionDialog(true); }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter une question
                        </Button>
                    </div>

                    {quiz.questions?.map((question) => (
                        <QuestionCard
                            key={question.id}
                            question={question}
                            onEdit={() => { setEditingQuestion(question); setShowQuestionDialog(true); }}
                            onDelete={() => handleDeleteQuestion(question.id)}
                        />
                    ))}

                    {(!quiz.questions || quiz.questions.length === 0) && (
                        <div className="rounded-xl border border-dashed p-8 text-center">
                            <p className="text-muted-foreground">Aucune question. Ajoutez votre première question.</p>
                        </div>
                    )}
                </div>

                <QuestionFormDialog
                    open={showQuestionDialog}
                    onOpenChange={setShowQuestionDialog}
                    quizUuid={quiz.uuid}
                    question={editingQuestion}
                />
            </div>
        </AppLayout>
    );
}
