import { Head } from '@inertiajs/react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem, Quiz } from '@/types';

export default function QuizzesEmbed({ quiz }: { quiz: Quiz }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quizzes', href: '/quizzes' },
        { title: quiz.title, href: `/quizzes/${quiz.uuid}/edit` },
        { title: 'Intégration', href: `/quizzes/${quiz.uuid}/embed` },
    ];

    const [copiedInline, setCopiedInline] = useState(false);
    const [copiedModal, setCopiedModal] = useState(false);

    const appUrl = window.location.origin;

    const inlineSnippet = `<div id="quiz-${quiz.uuid}"></div>
<script src="${appUrl}/embed.js"></script>
<script>
  new QuizEmbed({
    quizId: '${quiz.uuid}',
    mode: 'inline',
    containerId: 'quiz-${quiz.uuid}'
  });
</script>`;

    const modalSnippet = `<script src="${appUrl}/embed.js"></script>
<script>
  new QuizEmbed({
    quizId: '${quiz.uuid}',
    mode: 'modal',
    buttonText: 'Lancer le quiz'
  });
</script>`;

    const copyToClipboard = (text: string, type: 'inline' | 'modal') => {
        navigator.clipboard.writeText(text);
        if (type === 'inline') {
            setCopiedInline(true);
            setTimeout(() => setCopiedInline(false), 2000);
        } else {
            setCopiedModal(true);
            setTimeout(() => setCopiedModal(false), 2000);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Intégration - ${quiz.title}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <h1 className="text-2xl font-bold">Code d'intégration</h1>
                <p className="text-muted-foreground">Intégrez ce quiz sur votre site web en copiant l'un des codes ci-dessous.</p>

                <div className="max-w-3xl space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Aperçu</h3>
                        <div className="overflow-hidden rounded-lg border">
                            <iframe
                                src={`${appUrl}/q/${quiz.uuid}`}
                                className="h-[600px] w-full border-0"
                                title={quiz.title}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Mode Inline</h3>
                            <Button variant="outline" size="sm" onClick={() => copyToClipboard(inlineSnippet, 'inline')}>
                                {copiedInline ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                {copiedInline ? 'Copié !' : 'Copier'}
                            </Button>
                        </div>
                        <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
                            <code>{inlineSnippet}</code>
                        </pre>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Mode Modal</h3>
                            <Button variant="outline" size="sm" onClick={() => copyToClipboard(modalSnippet, 'modal')}>
                                {copiedModal ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                {copiedModal ? 'Copié !' : 'Copier'}
                            </Button>
                        </div>
                        <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
                            <code>{modalSnippet}</code>
                        </pre>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
