"use client";

import { useEffect, useState } from "react";
import "./globals.css";

// global-error remplace le layout racine : pas de provider next-intl ici, la langue est déduite de l'URL (/fr, /en).
const COPY = {
    fr: {
        title: "Une erreur critique est survenue",
        description: "L'application a rencontré un problème inattendu. Veuillez recharger la page.",
        reload: "Recharger",
    },
    en: {
        title: "A critical error occurred",
        description: "The application ran into an unexpected problem. Please reload the page.",
        reload: "Reload",
    },
} as const;

export default function GlobalError({
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [lang, setLang] = useState<keyof typeof COPY>("fr");

    useEffect(() => {
        if (/^\/en(\/|$)/.test(window.location.pathname)) setLang("en");
    }, []);

    const copy = COPY[lang];

    return (
        <html lang={lang}>
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
                            {copy.title}
                        </h1>
                        <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                            {copy.description}
                        </p>
                        <button
                            onClick={() => reset()}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ background: "var(--color-primary)" }}
                        >
                            {copy.reload}
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
