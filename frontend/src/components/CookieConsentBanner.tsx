"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_STORAGE_KEY = "afrikcse:cookie-consent";

export default function CookieConsentBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!window.localStorage.getItem(CONSENT_STORAGE_KEY)) {
            setVisible(true);
        }
    }, []);

    const choose = (value: "accepted" | "essential") => {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6">
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <p className="text-sm text-gray-600 dark:text-slate-300 flex-1">
                    Nous utilisons des cookies essentiels au fonctionnement de la
                    plateforme (authentification, préférences) et, avec votre accord,
                    des cookies analytiques pour améliorer le service. Consultez notre{" "}
                    <Link href="/infos/privacy" className="underline font-medium text-[var(--color-primary)]">
                        politique de confidentialité
                    </Link>{" "}
                    pour en savoir plus.
                </p>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={() => choose("essential")}
                        className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Essentiels uniquement
                    </button>
                    <button
                        onClick={() => choose("accepted")}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
                    >
                        Tout accepter
                    </button>
                </div>
            </div>
        </div>
    );
}
