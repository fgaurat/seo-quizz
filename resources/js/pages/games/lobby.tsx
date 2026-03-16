import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Play, Users, ArrowLeft, Wifi, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import echo from '@/echo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, GameSession, GamePlayer } from '@/types';

interface LobbyProps {
    gameSession: GameSession;
}

function formatPin(pin: string): string {
    // Insert a space in the middle for readability: "482917" → "482 917"
    const mid = Math.ceil(pin.length / 2);
    return `${pin.slice(0, mid)} ${pin.slice(mid)}`;
}

function PlayerCard({ player, isNew }: { player: GamePlayer; isNew: boolean }) {
    const initials = player.nickname.slice(0, 2).toUpperCase();

    // Pick a deterministic color based on the player id
    const colors = [
        'bg-blue-500',
        'bg-emerald-500',
        'bg-violet-500',
        'bg-amber-500',
        'bg-rose-500',
        'bg-cyan-500',
        'bg-pink-500',
        'bg-indigo-500',
    ];
    const color = colors[player.id % colors.length];

    return (
        <div
            className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm transition-all duration-500 ${
                isNew ? 'animate-in fade-in slide-in-from-bottom-2' : ''
            }`}
        >
            <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${color} text-sm font-bold text-white`}
            >
                {initials}
            </div>
            <span className="truncate font-medium">{player.nickname}</span>
            <Wifi className="text-muted-foreground ml-auto h-3.5 w-3.5 shrink-0" />
        </div>
    );
}

export default function GamesLobby({ gameSession }: LobbyProps) {
    const [players, setPlayers] = useState<GamePlayer[]>(gameSession.players ?? []);
    const [knownPlayerIds, setKnownPlayerIds] = useState<Set<number>>(
        new Set((gameSession.players ?? []).map((p) => p.id)),
    );
    const [newPlayerIds, setNewPlayerIds] = useState<Set<number>>(new Set());
    const [isStarting, setIsStarting] = useState(false);
    const [startError, setStartError] = useState<string | null>(null);
    const [timePerQuestion, setTimePerQuestion] = useState(gameSession.time_per_question);
    const [autoAdvance, setAutoAdvance] = useState(false);
    const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(5);

    const playUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/play`
            : '/play';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quizzes', href: '/quizzes' },
        {
            title: gameSession.quiz?.title ?? 'Quiz',
            href: `/quizzes/${gameSession.quiz?.uuid ?? ''}`,
        },
        { title: 'Salle d\'attente', href: `/games/${gameSession.uuid}/lobby` },
    ];

    useEffect(() => {
        const channel = echo.channel(`game.${gameSession.uuid}`);

        channel.listen(
            '.player.joined',
            (data: {
                player: { uuid: string; nickname: string; score: number; id?: number };
                playersCount: number;
            }) => {
                const playerId = data.player.id ?? Date.now();

                setPlayers((prev) => {
                    // Avoid duplicates
                    if (prev.some((p) => p.uuid === data.player.uuid)) return prev;

                    const newPlayer: GamePlayer = {
                        ...data.player,
                        id: playerId,
                        is_connected: true,
                        avatar: null,
                        created_at: '',
                        updated_at: '',
                        game_session_id: 0,
                    };
                    return [...prev, newPlayer];
                });

                // Mark as new for the entry animation, then clear after it completes
                setKnownPlayerIds((prev) => new Set([...prev, playerId]));
                setNewPlayerIds((prev) => new Set([...prev, playerId]));
                setTimeout(() => {
                    setNewPlayerIds((prev) => {
                        const next = new Set(prev);
                        next.delete(playerId);
                        return next;
                    });
                }, 600);
            },
        );

        channel.listen('.game.started', () => {
            router.visit(`/games/${gameSession.uuid}/host`);
        });

        return () => {
            echo.leaveChannel(`game.${gameSession.uuid}`);
        };
    }, [gameSession.uuid]);

    const handleStart = async () => {
        if (players.length < 1 || isStarting) return;

        setIsStarting(true);
        setStartError(null);

        const csrfToken =
            document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

        try {
            const response = await fetch(`/api/game/${gameSession.uuid}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    time_per_question: timePerQuestion,
                    auto_advance: autoAdvance,
                    auto_advance_delay: autoAdvanceDelay,
                }),
            });

            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                setStartError(body.message ?? 'Impossible de lancer la partie.');
                setIsStarting(false);
                return;
            }

            router.visit(`/games/${gameSession.uuid}/host`);
        } catch {
            setStartError('Erreur réseau. Veuillez réessayer.');
            setIsStarting(false);
        }
    };

    const connectedPlayers = players.filter((p) => p.is_connected);
    const playerCount = connectedPlayers.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Salle d'attente — ${gameSession.quiz?.title ?? 'Quiz'}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header row */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/quizzes">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>

                    <Badge variant="secondary" className="text-sm">
                        {gameSession.quiz?.title ?? 'Quiz'}
                    </Badge>
                </div>

                {/* Main content */}
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                    {/* PIN card — designed to be readable from across a room */}
                    <Card className="overflow-hidden">
                        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                            <p className="text-muted-foreground text-sm font-semibold uppercase tracking-widest">
                                Code PIN de la partie
                            </p>

                            <div
                                className="select-all font-mono text-7xl font-black tracking-tight tabular-nums md:text-8xl"
                                aria-label={`PIN : ${gameSession.pin}`}
                            >
                                {formatPin(gameSession.pin)}
                            </div>

                            <div className="mt-4 flex flex-col items-center gap-3">
                                <div className="rounded-xl bg-white p-3 shadow-sm">
                                    <QRCodeSVG
                                        value={`${playUrl}?pin=${gameSession.pin}`}
                                        size={160}
                                        level="M"
                                    />
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    Scannez le QR code ou rejoignez sur
                                </p>
                                <span className="rounded-md bg-muted px-3 py-1 font-mono text-base font-semibold">
                                    {playUrl}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Players card */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users className="h-5 w-5" />
                                Joueurs connectés
                                <Badge
                                    variant={playerCount > 0 ? 'default' : 'secondary'}
                                    className="ml-auto tabular-nums"
                                >
                                    {playerCount}
                                </Badge>
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            {playerCount === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                                    <Users className="text-muted-foreground h-10 w-10" />
                                    <p className="text-muted-foreground text-sm">
                                        En attente des joueurs…
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        Partagez le PIN ou l'URL ci-dessus.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {connectedPlayers.map((player) => (
                                        <PlayerCard
                                            key={player.id}
                                            player={player}
                                            isNew={newPlayerIds.has(player.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Game settings */}
                    <Card>
                        <CardContent className="flex flex-col gap-4 py-4">
                            <div className="flex items-center gap-3">
                                <label htmlFor="time" className="text-sm font-medium whitespace-nowrap">
                                    Temps par question
                                </label>
                                <input
                                    id="time"
                                    type="range"
                                    min={5}
                                    max={120}
                                    step={5}
                                    value={timePerQuestion}
                                    onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-sm font-semibold tabular-nums w-10 text-right">{timePerQuestion}s</span>
                            </div>

                            <div className="border-t" />

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Passage automatique</p>
                                    <p className="text-muted-foreground text-xs">
                                        Passer à la question suivante automatiquement après le timer
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={autoAdvance}
                                    onClick={() => setAutoAdvance(!autoAdvance)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                                        autoAdvance ? 'bg-primary' : 'bg-input'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform ${
                                            autoAdvance ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                            {autoAdvance && (
                                <div className="flex items-center gap-3">
                                    <label htmlFor="delay" className="text-sm text-muted-foreground whitespace-nowrap">
                                        Délai d'affichage des résultats
                                    </label>
                                    <input
                                        id="delay"
                                        type="range"
                                        min={2}
                                        max={15}
                                        value={autoAdvanceDelay}
                                        onChange={(e) => setAutoAdvanceDelay(Number(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className="text-sm font-semibold tabular-nums w-8 text-right">{autoAdvanceDelay}s</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Start action */}
                    <div className="flex flex-col items-center gap-3">
                        {startError && (
                            <p className="text-sm text-destructive">{startError}</p>
                        )}

                        <Button
                            size="lg"
                            className="h-14 w-full max-w-sm text-lg font-bold"
                            disabled={playerCount < 1 || isStarting}
                            onClick={handleStart}
                        >
                            {isStarting ? (
                                <>
                                    <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Lancement…
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-5 w-5" />
                                    Lancer la partie
                                </>
                            )}
                        </Button>

                        {playerCount < 1 && (
                            <p className="text-muted-foreground text-sm">
                                Au moins un joueur est requis pour démarrer.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
