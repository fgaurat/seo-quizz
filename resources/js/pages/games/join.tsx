import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface JoinError {
    message: string;
    field?: 'pin' | 'nickname' | 'general';
}

export default function Join() {
    const [pin, setPin] = useState('');
    const [nickname, setNickname] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<JoinError | null>(null);

    function handlePinChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setPin(value);
        if (error?.field === 'pin') setError(null);
    }

    function handleNicknameChange(e: React.ChangeEvent<HTMLInputElement>) {
        setNickname(e.target.value.slice(0, 50));
        if (error?.field === 'nickname') setError(null);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (pin.length < 6) {
            setError({ message: 'Le PIN doit contenir 6 chiffres.', field: 'pin' });
            return;
        }

        if (nickname.trim().length === 0) {
            setError({ message: 'Choisis un pseudo pour rejoindre la partie.', field: 'nickname' });
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const csrfToken = decodeURIComponent(
                document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
            );

            const response = await fetch('/api/game/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ pin, nickname: nickname.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                const status = response.status;

                if (status === 404 || data.error === 'invalid_pin') {
                    setError({ message: 'PIN introuvable. Vérifie le code et réessaie.', field: 'pin' });
                } else if (data.error === 'game_not_waiting') {
                    setError({ message: 'Cette partie a déjà commencé ou est terminée.', field: 'general' });
                } else if (data.error === 'nickname_taken') {
                    setError({ message: 'Ce pseudo est déjà pris. Choisis-en un autre.', field: 'nickname' });
                } else {
                    setError({ message: data.message ?? 'Une erreur est survenue. Réessaie.', field: 'general' });
                }
                return;
            }

            sessionStorage.setItem('player_uuid', data.player.uuid);
            router.visit(`/play/${data.game_session_uuid}/play`);
        } catch {
            setError({ message: 'Impossible de se connecter. Vérifie ta connexion.', field: 'general' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const isFormValid = pin.length === 6 && nickname.trim().length > 0;

    return (
        <>
            <Head title="Rejoindre une partie" />

            <div className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex flex-col items-center justify-center p-4">

                {/* Branding */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 shadow-lg">
                        <span className="text-3xl" role="img" aria-label="quiz">🎯</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                        SEO Quizz
                    </h1>
                    <p className="text-white/80 mt-1 text-sm font-medium">
                        Entre le PIN pour rejoindre la partie
                    </p>
                </div>

                {/* Card */}
                <Card className="w-full max-w-sm bg-white shadow-2xl border-0 rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-center text-xl font-bold text-gray-800">
                            Rejoindre une partie
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

                            {/* PIN input */}
                            <div className="flex flex-col gap-2">
                                <Label
                                    htmlFor="pin"
                                    className="text-sm font-semibold text-gray-700 text-center"
                                >
                                    PIN de la partie
                                </Label>
                                <Input
                                    id="pin"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={pin}
                                    onChange={handlePinChange}
                                    autoComplete="off"
                                    autoFocus
                                    aria-invalid={error?.field === 'pin' ? true : undefined}
                                    className="text-center text-4xl font-bold tracking-[0.5em] h-16 rounded-xl border-2 border-gray-200 focus-visible:border-purple-500 placeholder:text-gray-300 placeholder:tracking-[0.5em]"
                                />
                                {error?.field === 'pin' && (
                                    <p className="text-sm text-red-500 text-center font-medium" role="alert">
                                        {error.message}
                                    </p>
                                )}
                            </div>

                            {/* Nickname input */}
                            <div className="flex flex-col gap-2">
                                <Label
                                    htmlFor="nickname"
                                    className="text-sm font-semibold text-gray-700 text-center"
                                >
                                    Ton pseudo
                                </Label>
                                <Input
                                    id="nickname"
                                    type="text"
                                    maxLength={50}
                                    placeholder="Ex: SuperSEO42"
                                    value={nickname}
                                    onChange={handleNicknameChange}
                                    autoComplete="nickname"
                                    aria-invalid={error?.field === 'nickname' ? true : undefined}
                                    className="text-center text-lg font-semibold h-12 rounded-xl border-2 border-gray-200 focus-visible:border-purple-500"
                                />
                                {error?.field === 'nickname' && (
                                    <p className="text-sm text-red-500 text-center font-medium" role="alert">
                                        {error.message}
                                    </p>
                                )}
                            </div>

                            {/* General error */}
                            {error?.field === 'general' && (
                                <div
                                    className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 text-center font-medium"
                                    role="alert"
                                >
                                    {error.message}
                                </div>
                            )}

                            {/* Submit button */}
                            <Button
                                type="submit"
                                disabled={isSubmitting || !isFormValid}
                                className="h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30 transition-all duration-200 disabled:opacity-40 disabled:shadow-none"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <svg
                                            className="animate-spin h-5 w-5"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                        Connexion...
                                    </span>
                                ) : (
                                    'Rejoindre'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer hint */}
                <p className="mt-6 text-white/60 text-xs text-center">
                    Le PIN est affiché sur l'écran de l'animateur
                </p>
            </div>
        </>
    );
}
