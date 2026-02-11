import { Head, Link, router } from '@inertiajs/react';
import { ExternalLink, FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, PaginatedData, Project } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projets', href: '/projects' },
];

export default function ProjectsIndex({ projects }: { projects: PaginatedData<Project> }) {
    const handleDelete = (project: Project) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Les quiz associés ne seront pas supprimés.')) {
            router.delete(`/projects/${project.uuid}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projets" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Mes Projets</h1>
                    <Button asChild>
                        <Link href="/projects/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Créer un projet
                        </Link>
                    </Button>
                </div>

                {projects.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12">
                        <FolderOpen className="text-muted-foreground mb-4 h-12 w-12" />
                        <h3 className="mb-2 text-lg font-semibold">Aucun projet</h3>
                        <p className="text-muted-foreground mb-4">Commencez par créer votre premier projet.</p>
                        <Button asChild>
                            <Link href="/projects/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Créer un projet
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-xl border">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="p-4 font-medium">Nom</th>
                                        <th className="p-4 font-medium">URL</th>
                                        <th className="p-4 font-medium">Quiz</th>
                                        <th className="p-4 font-medium">Tentatives</th>
                                        <th className="p-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.data.map((project) => (
                                        <tr key={project.id} className="border-b last:border-0">
                                            <td className="p-4 font-medium">
                                                <Link href={`/projects/${project.uuid}`} className="hover:underline">
                                                    {project.name}
                                                </Link>
                                            </td>
                                            <td className="p-4">
                                                {project.url ? (
                                                    <a
                                                        href={project.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                                                    >
                                                        {new URL(project.url).hostname}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="p-4">{project.quizzes_count ?? 0}</td>
                                            <td className="p-4">{project.quiz_attempts_count ?? 0}</td>
                                            <td className="p-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/projects/${project.uuid}`}>
                                                            <FolderOpen className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/projects/${project.uuid}/edit`}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(project)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {projects.last_page > 1 && (
                            <div className="flex justify-center gap-2">
                                {projects.links.map((link, i) => (
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
