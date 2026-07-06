"use client";

import { useState, useEffect, useTransition } from "react";
import { Globe } from "lucide-react";

const LOCALES = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English",  flag: "🇬🇧" },
] as const;

type Locale = (typeof LOCALES)[number]["code"];

function getCookieLocale(): Locale {
    if (typeof document === "undefined") return "fr";
    const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
    const val = match?.[1];
    return val === "en" ? "en" : "fr";
}

function setLocale(locale: Locale) {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${365 * 24 * 3600}; SameSite=Lax`;
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
    const [locale, setLocaleState] = useState<Locale>("fr");
    const [open, setOpen]           = useState(false);
    const [, startTransition]       = useTransition();

    useEffect(() => { setLocaleState(getCookieLocale()); }, []);

    function handleSelect(code: Locale) {
        setLocale(code);
        setLocaleState(code);
        setOpen(false);
        startTransition(() => { window.location.reload(); });
    }

    const current = LOCALES.find(l => l.code === locale) ?? LOCALES[0];

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                title="Changer la langue"
            >
                <Globe size={14} />
                {!compact && <span>{current.flag} {current.code.toUpperCase()}</span>}
                {compact && <span>{current.flag}</span>}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border z-50 overflow-hidden min-w-[130px]">
                        {LOCALES.map(l => (
                            <button
                                key={l.code}
                                onClick={() => handleSelect(l.code)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${l.code === locale ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}
                            >
                                <span>{l.flag}</span>
                                <span>{l.label}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
