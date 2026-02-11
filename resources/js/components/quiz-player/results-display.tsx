import type { QuizSubmissionResult } from '@/types';

export default function ResultsDisplay({ results, onRestart }: { results: QuizSubmissionResult; onRestart: () => void }) {
    return (
        <div className="quiz-card">
            <div className="quiz-results-header">
                <h2 className="quiz-title">Résultats</h2>
                <div className="quiz-score">
                    <span className="quiz-score-value">{results.score}/{results.total_questions}</span>
                    <span className="quiz-score-percentage">{results.percentage}%</span>
                </div>
            </div>

            <div className="quiz-results-list">
                {results.results.map((result, index) => (
                    <div key={result.question_id} className={`quiz-result-item ${result.is_correct ? 'quiz-result-correct' : 'quiz-result-incorrect'}`}>
                        <div className="quiz-result-header">
                            <span className="quiz-result-icon">{result.is_correct ? '✓' : '✗'}</span>
                            <span className="quiz-result-number">Q{index + 1}</span>
                        </div>
                        <p className="quiz-result-question">{result.question_body}</p>
                        {result.explanation && (
                            <p className="quiz-result-explanation">{result.explanation}</p>
                        )}
                    </div>
                ))}
            </div>

            <button className="quiz-btn quiz-btn-primary" onClick={onRestart}>
                Recommencer
            </button>
        </div>
    );
}
