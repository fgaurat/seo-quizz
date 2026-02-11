import AnswerOption from './answer-option';
import VideoEmbed from './video-embed';

type MediaItem = {
    url: string;
    type: 'image' | 'video';
};

type QuestionProps = {
    question: {
        id: number;
        body: string;
        media: MediaItem[] | null;
        answers: { id: number; body: string; order: number }[];
    };
    selectedAnswerId?: number;
    onSelectAnswer: (answerId: number) => void;
};

export default function QuestionDisplay({ question, selectedAnswerId, onSelectAnswer }: QuestionProps) {
    return (
        <div className="quiz-question">
            <h2 className="quiz-question-text">{question.body}</h2>
            {question.media?.map((m, index) => (
                <div key={index}>
                    {m.type === 'image' && (
                        <img src={m.url} alt="" className="quiz-question-image" />
                    )}
                    {m.type === 'video' && (
                        <VideoEmbed url={m.url} />
                    )}
                </div>
            ))}
            <div className="quiz-answers">
                {question.answers.map((answer) => (
                    <AnswerOption
                        key={answer.id}
                        answer={answer}
                        isSelected={selectedAnswerId === answer.id}
                        onSelect={() => onSelectAnswer(answer.id)}
                    />
                ))}
            </div>
        </div>
    );
}
