import { Pencil, Trash2, CheckCircle, XCircle, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Question } from '@/types';

export default function QuestionCard({ question, index, onEdit, onDelete }: { question: Question; index?: number; onEdit: () => void; onDelete: () => void }) {
    const imageCount = question.media?.filter((m) => m.type === 'image').length ?? 0;
    const videoCount = question.media?.filter((m) => m.type === 'video').length ?? 0;

    return (
        <div className="rounded-xl border p-4">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                        <span className="text-muted-foreground text-sm font-medium">Q{(index ?? question.order) + 1}</span>
                        {imageCount > 0 && (
                            <span className="bg-muted flex items-center gap-1 rounded px-2 py-0.5 text-xs">
                                <Image className="h-3 w-3" /> {imageCount}
                            </span>
                        )}
                        {videoCount > 0 && (
                            <span className="bg-muted flex items-center gap-1 rounded px-2 py-0.5 text-xs">
                                <Video className="h-3 w-3" /> {videoCount}
                            </span>
                        )}
                    </div>
                    <p className="font-medium">{question.body}</p>
                    {question.media?.some((m) => m.caption) && (
                        <div className="mt-1 space-y-0.5">
                            {question.media.filter((m) => m.caption).map((m, i) => (
                                <p key={i} className="text-muted-foreground text-xs italic">{m.caption}</p>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={onEdit}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onDelete}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </div>
            <div className="mt-3 space-y-1">
                {question.answers?.map((answer) => (
                    <div key={answer.id} className="flex items-center gap-2 text-sm">
                        {answer.is_correct ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                            <XCircle className="text-muted-foreground h-4 w-4" />
                        )}
                        <span className={answer.is_correct ? 'font-medium text-green-700 dark:text-green-400' : ''}>{answer.body}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
