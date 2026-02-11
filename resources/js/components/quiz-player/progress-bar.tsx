export default function ProgressBar({ current, total }: { current: number; total: number }) {
    const percentage = (current / total) * 100;

    return (
        <div className="quiz-progress">
            <div className="quiz-progress-info">
                <span>Question {current} / {total}</span>
            </div>
            <div className="quiz-progress-bar">
                <div className="quiz-progress-fill" style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}
