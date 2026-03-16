import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import { Play, Users, ArrowLeft, Wifi } from 'lucide-react';
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

    const pollState = useCallback(async () => {
        try {
            const response = await fetch(`/api/game/${gameSession.uuid}/state`, {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) return;

            const data = await response.json();

            // If the game has started, redirect the host to the control page
            if (data.status === 'in_progress' || data.status === 'reviewing') {
                router.visit(`/games/${gameSession.uuid}/host`);
                return;
            }

            if (Array.isArray(data.players)) {
                const incoming: GamePlayer[] = data.players;
                const incomingIds = new Set(incoming.map((p: GamePlayer) => p.id));

                // Find newly joined players
                const freshIds = new Set<number>();
                incomingIds.forEach((id) => {
                    if (!knownPlayerIds.has(id)) {
                        freshIds.add(id);
                    }
                });

                if (freshIds.size > 0) {
                    setNewPlayerIds(freshIds);
                    setKnownPlayerIds(incomingIds);

                    // Clear the "new" highlight after the animation completes
                    setTimeout(() => setNewPlayerIds(new Set()), 600);
                }

                setPlayers(incoming);
            }
        } catch {
            // Silently ignore transient network errors during polling
        }
    }, [gameSession.uuid, knownPlayerIds]);

    useEffect(() => {
        const intervalId = setInterval(pollState, 2000);
        return () => clearInterval(intervalId);
    }, [pollState]);

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

                            <div className="mt-2 flex flex-col items-center gap-1">
                                <p className="text-muted-foreground text-sm">
                                    Les joueurs rejoignent sur
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
