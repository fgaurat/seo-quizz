import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MediaType, Question } from '@/types';

type MediaForm = {
    url: string;
    type: MediaType;
    caption: string;
};

type AnswerForm = {
    id?: number;
    body: string;
    is_correct: boolean;
    explanation: string;
    order: number;
};

export default function QuestionFormDialog({
    open,
    onOpenChange,
    quizUuid,
    question,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quizUuid: string;
    question: Question | null;
}) {
    const initialData = {
        body: '',
        media: [] as MediaForm[],
        order: 0,
        answers: [
            { body: '', is_correct: true, explanation: '', order: 1 },
            { body: '', is_correct: false, explanation: '', order: 2 },
        ] as AnswerForm[],
    };

    const { data, setData, post, put, processing, errors, clearErrors } = useForm<{
        body: string;
        media: MediaForm[];
        order: number;
        answers: AnswerForm[];
    }>(initialData);

    useEffect(() => {
        if (!open) return;

        if (question) {
            setData({
                body: question.body,
                media: question.media?.map((m) => ({ url: m.url, type: m.type, caption: m.caption ?? '' })) ?? [],
                order: question.order,
                answers: question.answers.map((a) => ({
                    id: a.id,
                    body: a.body,
                    is_correct: a.is_correct,
                    explanation: a.explanation ?? '',
                    order: a.order,
                })),
            });
        } else {
            setData({
                body: '',
                media: [],
                order: 0,
                answers: [
                    { body: '', is_correct: true, explanation: '', order: 1 },
                    { body: '', is_correct: false, explanation: '', order: 2 },
                ],
            });
        }
        clearErrors();
    }, [question, open]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (question) {
            put(`/quizzes/${quizUuid}/questions/${question.id}`, {
                onSuccess: () => onOpenChange(false),
            });
        } else {
            post(`/quizzes/${quizUuid}/questions`, {
                onSuccess: () => onOpenChange(false),
            });
        }
    };

    const addAnswer = () => {
        setData('answers', [
            ...data.answers,
            { body: '', is_correct: false, explanation: '', order: data.answers.length + 1 },
        ]);
    };

    const removeAnswer = (index: number) => {
        if (data.answers.length <= 2) return;
        setData('answers', data.answers.filter((_, i) => i !== index));
    };

    const updateAnswer = (index: number, field: keyof AnswerForm, value: string | boolean | number) => {
        const updated = [...data.answers];
        updated[index] = { ...updated[index], [field]: value };
        setData('answers', updated);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{question ? 'Modifier la question' : 'Ajouter une question'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="body">Question</Label>
                        <textarea
                            id="body"
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                            placeholder="Votre question..."
                        />
                        {errors.body && <p className="text-sm text-red-500">{errors.body}</p>}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Médias</Label>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setData('media', [...data.media, { url: '', type: 'image', caption: '' }])}>
                                    <Plus className="mr-1 h-3 w-3" /> Image
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => setData('media', [...data.media, { url: '', type: 'video', caption: '' }])}>
                                    <Plus className="mr-1 h-3 w-3" /> Vidéo
                                </Button>
                            </div>
                        </div>
                        {data.media.map((m, index) => (
                            <div key={index} className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="bg-muted shrink-0 rounded px-2 py-1 text-xs font-medium">{m.type === 'image' ? 'Image' : 'Vidéo'}</span>
                                    <Input
                                        value={m.url}
                                        onChange={(e) => {
                                            const updated = [...data.media];
                                            updated[index] = { ...updated[index], url: e.target.value };
                                            setData('media', updated);
                                        }}
                                        placeholder="https://..."
                                        className="flex-1"
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => setData('media', data.media.filter((_, i) => i !== index))}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                                {errors[`media.${index}.url` as keyof typeof errors] && (
                                    <p className="text-sm text-red-500">{errors[`media.${index}.url` as keyof typeof errors]}</p>
                                )}
                                <Input
                                    value={m.caption}
                                    onChange={(e) => {
                                        const updated = [...data.media];
                                        updated[index] = { ...updated[index], caption: e.target.value };
                                        setData('media', updated);
                                    }}
                                    placeholder="Légende (optionnel)"
                                    className="text-sm"
                                />
                            </div>
                        ))}
                        {errors.media && <p className="text-sm text-red-500">{errors.media}</p>}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Réponses</Label>
                            {data.answers.length < 10 && (
                                <Button type="button" variant="outline" size="sm" onClick={addAnswer}>
                                    <Plus className="mr-1 h-3 w-3" />
                                    Ajouter
                                </Button>
                            )}
                        </div>
                        {errors.answers && <p className="text-sm text-red-500">{errors.answers}</p>}

                        {data.answers.map((answer, index) => (
                            <div key={index} className="space-y-2 rounded-lg border p-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={answer.is_correct}
                                        onChange={(e) => updateAnswer(index, 'is_correct', e.target.checked)}
                                    />
                                    <Input
                                        value={answer.body}
                                        onChange={(e) => updateAnswer(index, 'body', e.target.value)}
                                        placeholder={`Réponse ${index + 1}`}
                                        className="flex-1"
                                    />
                                    {data.answers.length > 2 && (
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeAnswer(index)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    )}
                                </div>
                                {errors[`answers.${index}.body` as keyof typeof errors] && (
                                    <p className="text-sm text-red-500">{errors[`answers.${index}.body` as keyof typeof errors]}</p>
                                )}
                                <Input
                                    value={answer.explanation}
                                    onChange={(e) => updateAnswer(index, 'explanation', e.target.value)}
                                    placeholder="Explication (optionnel)"
                                    className="text-sm"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="button" onClick={() => handleSubmit()} disabled={processing}>
                            {question ? 'Mettre à jour' : 'Ajouter'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
