import { Head, Link } from '@inertiajs/react';
import { Monitor, PlayCircle, Radio, Smartphone, Target, Timer, Trophy, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Guide',
        href: '/guide',
    },
];

function SectionNumber({ number }: { number: number }) {
    return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            {number}
        </span>
    );
}

function StepList({ steps }: { steps: string[] }) {
    return (
        <ol className="space-y-2">
            {steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {index + 1}
                    </span>
                    <span className="text-sm leading-relaxed">{step}</span>
                </li>
            ))}
        </ol>
    );
}

function BulletList({ items }: { items: (string | React.ReactNode)[] }) {
    return (
        <ul className="space-y-2">
            {items.map((item, index) => (
                <li key={index} className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                    <span className="text-sm leading-relaxed">{item}</span>
                </li>
            ))}
        </ul>
    );
}

export default function Guide() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Guide — Mode Live" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                        <Radio className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Guide — Mode Live</h1>
                        <p className="text-muted-foreground text-sm">
                            Tout ce qu'il faut savoir pour animer une session interactive
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Section 1 — Qu'est-ce que le mode Live ? */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-base">
                                <SectionNumber number={1} />
                                <span className="flex items-center gap-2">
                                    <Radio className="h-4 w-4 text-indigo-600" />
                                    Qu'est-ce que le mode Live ?
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed">
                                Le mode Live transforme n'importe quel quiz en une session interactive de type Kahoot.
                                L'hôte projette les questions sur un grand écran, et les joueurs rejoignent depuis leur
                                téléphone en saisissant un code PIN à 6 chiffres. Tout le monde répond en temps réel,
                                et les points sont attribués selon la rapidité — plus vite vous répondez, plus vous
                                marquez. Idéal pour animer des formations, des cours ou des événements.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Section 2 — Créer une partie */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-base">
                                <SectionNumber number={2} />
                                <span className="flex items-center gap-2">
                                    <PlayCircle className="h-4 w-4 text-indigo-600" />
                                    Créer une partie
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StepList
                                steps={[
                                    'Créer un quiz avec au moins 1 question et le publier (statut "Publié").',
                                    'Depuis la liste des quiz ou la page d\'édition, cliquer sur le bouton "Lancer un live" (icône antenne).',
                                    'Vous êtes redirigé vers le lobby avec un code PIN à 6 chiffres affiché à l\'écran.',
                                ]}
                            />
                        </CardContent>
                    </Card>

                    {/* Section 3 — Rejoindre une partie */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-base">
                                <SectionNumber number={3} />
                                <span className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-indigo-600" />
                                    Rejoindre une partie (joueurs)
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StepList
                                steps={[
                                    'Les joueurs se rendent sur /play (ou l\'URL affichée sur l\'écran du lobby).',
                                    'Ils saisissent le code PIN à 6 chiffres.',
                                    'Ils choisissent un pseudo unique dans la partie.',
                                    'Ils apparaissent instantanément dans le lobby de l\'hôte.',
                                ]}
                            />
                        </CardContent>
                    </Card>

                    {/* Section 4 — Déroulement d'une partie */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-base">
                                <SectionNumber number={4} />
                                <span className="flex items-center gap-2">
                                    <Monitor className="h-4 w-4 text-indigo-600" />
                                    Déroulement d'une partie
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <BulletList
                                items={[
                                    "L'hôte clique \"Lancer la partie\" quand tous les joueurs sont connectés.",
                                    'Chaque question est affichée sur l\'écran de l\'hôte — à projeter sur un grand écran.',
                                    <span key="players-note">
                                        Les joueurs voient{' '}
                                        <span className="font-medium">4 boutons colorés</span> sur leur téléphone mais
                                        ne voient pas le texte de la question — il faut projeter l'écran hôte.
                                    </span>,
                                    'Un compte à rebours démarre (30 secondes par défaut).',
                                    'Les joueurs répondent le plus vite possible pour maximiser leurs points.',
                                    'Après chaque question, le classement intermédiaire est affiché.',
                                ]}
                            />
                        </CardContent>
                    </Card>

                    {/* Section 5 — Système de points */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-base">
                                <SectionNumber number={5} />
                                <span className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-indigo-600" />
                                    Système de points
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <BulletList
                                items={[
                                    'Chaque bonne réponse rapporte jusqu\'à 1 000 points.',
                                    'Plus la réponse est rapide, plus les points sont élevés.',
                                    'Une mauvaise réponse rapporte 0 point.',
                                    'Le classement final est basé sur le score cumulé sur toutes les questions.',
                                ]}
                            />
                            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-900 dark:bg-indigo-950/40">
                                <p className="font-mono text-xs text-indigo-700 dark:text-indigo-300">
                                    points = 1000 × (1 − temps_écoulé / temps_total)
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 6 — Écran des résultats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-base">
                                <SectionNumber number={6} />
                                <span className="flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-indigo-600" />
                                    Écran des résultats
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <BulletList
                                items={[
                                    'À la fin de la partie, un podium affiche les 3 premiers.',
                                    'Le classement complet est disponible avec tous les scores.',
                                    'Les statistiques par question montrent le taux de réussite et le temps de réponse moyen.',
                                    'Vous pouvez relancer une nouvelle partie avec le même quiz.',
                                ]}
                            />
                        </CardContent>
                    </Card>

                    {/* Section 7 — Conseils */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-base">
                                <SectionNumber number={7} />
                                <span className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-indigo-600" />
                                    Conseils pour une bonne session
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="flex gap-3 rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border">
                                    <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                                    <p className="text-sm leading-relaxed">
                                        Projetez l'écran hôte sur un vidéoprojecteur ou partagez-le via un outil de
                                        visioconférence.
                                    </p>
                                </div>
                                <div className="flex gap-3 rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border">
                                    <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                                    <p className="text-sm leading-relaxed">
                                        Dites aux joueurs de préparer leur téléphone à l'avance et d'ouvrir le
                                        navigateur avant de commencer.
                                    </p>
                                </div>
                                <div className="flex gap-3 rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border">
                                    <Timer className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                                    <p className="text-sm leading-relaxed">
                                        Ajustez le temps par question selon la difficulté — de 10 secondes pour des
                                        questions faciles à 120 secondes pour les plus complexes.
                                    </p>
                                </div>
                                <div className="flex gap-3 rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border">
                                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                                    <p className="text-sm leading-relaxed">
                                        Les joueurs doivent garder leur navigateur ouvert pendant toute la partie —
                                        fermer l'onglet les déconnecte.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* CTA */}
                <div className="flex justify-center pb-2">
                    <Link href="/quizzes">
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Radio className="h-4 w-4" />
                            Voir mes quizzes
                        </Button>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
