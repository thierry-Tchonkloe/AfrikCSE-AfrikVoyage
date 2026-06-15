"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: "var(--color-bg)" }}
        >
            <div
                className="max-w-md w-full text-center rounded-2xl border p-8"
                style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
                <div
                    className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "#fef3c7", color: "#d97706" }}
                >
                    <AlertTriangle size={32} />
                </div>

                <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                    Une erreur est survenue
                </h1>
                <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                    Quelque chose s&apos;est mal passé. Vous pouvez réessayer ou revenir à l&apos;accueil.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={() => reset()}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: "var(--color-primary)" }}
                    >
                        Réessayer
                    </button>
                    <a
                        href="/"
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center border transition-colors hover:bg-gray-50"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                        Accueil
                    </a>
                </div>
            </div>
        </div>
    );
}
