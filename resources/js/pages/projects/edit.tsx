import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Project } from '@/types';

export default function ProjectsEdit({ project }: { project: Project }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projets', href: '/projects' },
        { title: project.name, href: `/projects/${project.uuid}` },
        { title: 'Modifier', href: `/projects/${project.uuid}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: project.name,
        url: project.url ?? '',
        description: project.description ?? '',
        custom_css: project.custom_css ?? '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/projects/${project.uuid}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier - ${project.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-2xl font-bold">Modifier le projet</h1>

                <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="url">URL du site web</Label>
                        <Input
                            id="url"
                            type="url"
                            value={data.url}
                            onChange={(e) => setData('url', e.target.value)}
                            placeholder="https://www.monsite.fr"
                        />
                        {errors.url && <p className="text-sm text-red-500">{errors.url}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="custom_css">CSS personnalisé</Label>
                        <p className="text-muted-foreground text-sm">Ce CSS s'applique à tous les quiz de ce projet.</p>
                        <textarea
                            id="custom_css"
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[160px] w-full rounded-md border px-3 py-2 font-mono text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            value={data.custom_css}
                            onChange={(e) => setData('custom_css', e.target.value)}
                            placeholder={`.quiz-card { }\n.quiz-title { }\n.quiz-description { }\n.quiz-btn-primary { }\n.quiz-btn-secondary { }\n.quiz-answer { }\n.quiz-answer-selected { }\n.quiz-question-text { }\n.quiz-progress-fill { }\n.quiz-result-correct { }\n.quiz-result-incorrect { }`}
                        />
                        {errors.custom_css && <p className="text-sm text-red-500">{errors.custom_css}</p>}
                    </div>

                    <Button type="submit" disabled={processing}>
                        Mettre à jour
                    </Button>
                </form>
            </div>
        </AppLayout>
    );
}
