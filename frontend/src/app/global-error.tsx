"use client";

import "./globals.css";

export default function GlobalError({
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="fr">
            <body>
                <div
                    className="min-h-screen flex items-center justify-center px-4"
                    style={{ background: "var(--color-bg)" }}
                >
                    <div
                        className="max-w-md w-full text-center rounded-2xl border p-8"
                        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
                    >
                        <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                            Une erreur critique est survenue
                        </h1>
                        <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                            L&apos;application a rencontré un problème inattendu. Veuillez recharger la page.
                        </p>
                        <button
                            onClick={() => reset()}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ background: "var(--color-primary)" }}
                        >
                            Recharger
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
