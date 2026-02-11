<?php

namespace Database\Seeders;

use App\Models\Answer;
use App\Models\Project;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => bcrypt('12345'),
        ]);

        $project = Project::create([
            'user_id' => $user->id,
            'name' => 'Mon Site SEO',
            'url' => 'https://www.monsiteseo.fr',
            'description' => 'Projet regroupant les quiz SEO de mon site principal.',
            'custom_css' => <<<'CSS'
.quiz-card {
    background: #1a1a2e;
    color: #e0e0e0;
    border-radius: 12px;
    font-family: 'Segoe UI', system-ui, sans-serif;
}
.quiz-title {
    color: #e94560;
}
.quiz-btn-primary {
    background: #0f3460;
    border: none;
    border-radius: 8px;
}
.quiz-btn-primary:hover {
    background: #16213e;
}
.quiz-answer {
    border-color: #0f3460;
}
.quiz-answer:hover {
    background: #16213e;
}
.quiz-progress-fill {
    background: #e94560;
}
CSS,
        ]);

        $quiz = Quiz::factory()->published()->create([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'title' => 'Quiz SEO Fondamentaux',
            'description' => 'Testez vos connaissances en SEO avec ce quiz de 5 questions.',
            'custom_css' => <<<'CSS'
.quiz-btn-primary {
    background: #e94560;
    border-radius: 20px;
}
.quiz-btn-primary:hover {
    background: #c81e45;
}
.quiz-answer-selected {
    border-color: #e94560;
    background: rgba(233, 69, 96, 0.15);
}
CSS,
        ]);

        $questions = [
            [
                'body' => 'Que signifie SEO ?',
                'answers' => [
                    ['body' => 'Search Engine Optimization', 'is_correct' => true, 'explanation' => 'SEO signifie Search Engine Optimization, ou optimisation pour les moteurs de recherche.'],
                    ['body' => 'Social Engine Optimization', 'is_correct' => false, 'explanation' => null],
                    ['body' => 'Search Email Optimization', 'is_correct' => false, 'explanation' => null],
                    ['body' => 'Site Engine Operation', 'is_correct' => false, 'explanation' => null],
                ],
            ],
            [
                'body' => 'Quel est le moteur de recherche le plus utilisé au monde ?',
                'answers' => [
                    ['body' => 'Google', 'is_correct' => true, 'explanation' => 'Google détient plus de 90% des parts de marché mondiales.'],
                    ['body' => 'Bing', 'is_correct' => false, 'explanation' => null],
                    ['body' => 'Yahoo', 'is_correct' => false, 'explanation' => null],
                    ['body' => 'DuckDuckGo', 'is_correct' => false, 'explanation' => null],
                ],
            ],
            [
                'body' => 'Qu\'est-ce qu\'un backlink ?',
                'answers' => [
                    ['body' => 'Un lien entrant provenant d\'un autre site', 'is_correct' => true, 'explanation' => 'Un backlink est un lien hypertexte pointant vers votre site depuis un site externe.'],
                    ['body' => 'Un lien interne du site', 'is_correct' => false, 'explanation' => null],
                    ['body' => 'Un lien vers la page d\'accueil', 'is_correct' => false, 'explanation' => null],
                    ['body' => 'Un lien cassé', 'is_correct' => false, 'explanation' => null],
                ],
            ],
            [
                'body' => 'Quelle balise HTML est la plus importante pour le SEO on-page ?',
                'answers' => [
                    ['body' => 'La balise <title>', 'is_correct' => true, 'explanation' => 'La balise title est l\'un des facteurs on-page les plus importants pour le référencement.'],
                    ['body' => 'La balise <div>', 'is_correct' => false, 'explanation' => null],
                    ['body' => 'La balise <span>', 'is_correct' => false, 'explanation' => null],
                    ['body' => 'La balise <br>', 'is_correct' => false, 'explanation' => null],
                ],
            ],
            [
                'body' => 'Que signifie SERP ?',
                'answers' => [
                    ['body' => 'Search Engine Results Page', 'is_correct' => true, 'explanation' => 'SERP désigne la page de résultats d\'un moteur de recherche.'],
                    ['body' => 'Search Engine Ranking Position', 'is_correct' => false, 'explanation' => null],
                    ['body' => 'Site Engagement Rate Protocol', 'is_correct' => false, 'explanation' => null],
                    ['body' => 'Social Engine Response Page', 'is_correct' => false, 'explanation' => null],
                ],
            ],
        ];

        foreach ($questions as $index => $questionData) {
            $question = Question::create([
                'quiz_id' => $quiz->id,
                'body' => $questionData['body'],
                'order' => $index + 1,
            ]);

            foreach ($questionData['answers'] as $answerIndex => $answerData) {
                Answer::create([
                    'question_id' => $question->id,
                    'body' => $answerData['body'],
                    'is_correct' => $answerData['is_correct'],
                    'explanation' => $answerData['explanation'],
                    'order' => $answerIndex + 1,
                ]);
            }
        }
    }
}
