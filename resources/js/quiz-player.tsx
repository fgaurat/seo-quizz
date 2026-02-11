import { createRoot } from 'react-dom/client';
import QuizPlayer from './components/quiz-player/quiz-player';

const root = document.getElementById('quiz-root');

if (root) {
    const quizId = root.dataset.quizId!;
    const title = root.dataset.quizTitle!;
    const description = root.dataset.quizDescription ?? '';
    const questions = JSON.parse(root.dataset.quizQuestions!);
    const apiUrl = root.dataset.apiUrl!;
    const csrfToken = root.dataset.csrfToken!;
    const settings = JSON.parse(root.dataset.settings || '{}');

    createRoot(root).render(
        <QuizPlayer
            quizId={quizId}
            title={title}
            description={description}
            questions={questions}
            apiUrl={apiUrl}
            csrfToken={csrfToken}
            settings={settings}
        />
    );
}
