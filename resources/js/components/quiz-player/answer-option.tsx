type AnswerOptionProps = {
    answer: { id: number; body: string };
    isSelected: boolean;
    onSelect: () => void;
};

export default function AnswerOption({ answer, isSelected, onSelect }: AnswerOptionProps) {
    return (
        <button
            className={`quiz-answer ${isSelected ? 'quiz-answer-selected' : ''}`}
            onClick={onSelect}
            type="button"
        >
            <span className="quiz-answer-radio">
                {isSelected && <span className="quiz-answer-radio-dot" />}
            </span>
            <span className="quiz-answer-text">{answer.body}</span>
        </button>
    );
}
