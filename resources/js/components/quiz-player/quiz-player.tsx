import { useState } from 'react';
import type { QuizSubmissionResult } from '@/types';
import ProgressBar from './progress-bar';
import QuestionDisplay from './question-display';
import ResultsDisplay from './results-display';

type PlayerQuestion = {
    id: number;
    body: string;
    media: { url: string; type: 'image' | 'video' }[] | null;
    order: number;
    answers: { id: number; body: string; order: number }[];
};

type QuizPlayerProps = {
    quizId: string;
    title: string;
    description: string;
    questions: PlayerQuestion[];
    apiUrl: string;
    settings: Record<string, unknown>;
};

type Step = 'start' | 'playing' | 'results';

export default function QuizPlayer({ quizId, title, description, questions, apiUrl, settings }: QuizPlayerProps) {
    const [step, setStep] = useState<Step>('start');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [results, setResults] = useState<QuizSubmissionResult | null>(null);
    const [loading, setLoading] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];

    const handleStart = () => {
        setStep('playing');
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setResults(null);
        sendResize();
    };

    const handleSelectAnswer = (questionId: number, answerId: number) => {
        setSelectedAnswers((prev) => ({ ...prev, [questionId]: answerId }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
            sendResize();
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
            sendResize();
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                answers: Object.entries(selectedAnswers).map(([questionId, answerId]) => ({
                    question_id: Number(questionId),
                    answer_id: answerId,
                })),
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            setResults(data);
            setStep('results');

            window.parent.postMessage({ type: 'quizCompleted', quizId, score: data.score, total: data.total_questions }, '*');
            sendResize();
        } catch {
            alert('Erreur lors de la soumission du quiz.');
        } finally {
            setLoading(false);
        }
    };

    const sendResize = () => {
        setTimeout(() => {
            const height = document.getElementById('quiz-root')?.scrollHeight ?? 600;
            window.parent.postMessage({ type: 'quiz-resize', height }, '*');
        }, 100);
    };

    if (step === 'start') {
        return (
            <div className="quiz-card">
                <h1 className="quiz-title">{title}</h1>
                {description && <p className="quiz-description">{description}</p>}
                <p className="quiz-meta">{questions.length} question{questions.length > 1 ? 's' : ''}</p>
                <button className="quiz-btn quiz-btn-primary" onClick={handleStart}>
                    Commencer le quiz
                </button>
            </div>
        );
    }

    if (step === 'results' && results) {
        return (
            <ResultsDisplay results={results} onRestart={handleStart} />
        );
    }

    return (
        <div className="quiz-card">
            <ProgressBar current={currentQuestionIndex + 1} total={questions.length} />
            <QuestionDisplay
                question={currentQuestion}
                selectedAnswerId={selectedAnswers[currentQuestion.id]}
                onSelectAnswer={(answerId) => handleSelectAnswer(currentQuestion.id, answerId)}
            />
            <div className="quiz-nav">
                <button
                    className="quiz-btn quiz-btn-secondary"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                >
                    Précédent
                </button>
                {currentQuestionIndex < questions.length - 1 ? (
                    <button
                        className="quiz-btn quiz-btn-primary"
                        onClick={handleNext}
                        disabled={!selectedAnswers[currentQuestion.id]}
                    >
                        Suivant
                    </button>
                ) : (
                    <button
                        className="quiz-btn quiz-btn-primary"
                        onClick={handleSubmit}
                        disabled={!selectedAnswers[currentQuestion.id] || loading}
                    >
                        {loading ? 'Envoi...' : 'Terminer'}
                    </button>
                )}
            </div>
        </div>
    );
}
