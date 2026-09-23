"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

// Noms de langue affichés dans leur propre langue (jamais traduits).
const LOCALE_META: Record<Locale, { label: string; flag: string }> = {
    fr: { label: "Français", flag: "🇫🇷" },
    en: { label: "English",  flag: "🇬🇧" },
};

function useSwitchLocale() {
    const locale   = useLocale() as Locale;
    const pathname = usePathname();
    const router   = useRouter();
    const [isPending, startTransition] = useTransition();

    function switchTo(next: Locale) {
        if (next === locale) return;
        // Le pathname next-intl n'inclut ni la requête ni l'ancre : on les conserve.
        const target = `${pathname}${window.location.search}${window.location.hash}`;
        startTransition(() => router.replace(target, { locale: next }));
    }

    return { locale, switchTo, isPending };
}

type LanguageSwitcherProps = {
    /** N'affiche que le drapeau (barres d'outils étroites). */
    compact?: boolean;
    /** `dropdown` (liste déroulante) ou `pills` (boutons côte à côte, menus mobiles). */
    variant?: "dropdown" | "pills";
    /** `dark` pour les fonds sombres. */
    tone?: "light" | "dark";
};

export function LanguageSwitcher({ compact = false, variant = "dropdown", tone = "light" }: LanguageSwitcherProps) {
    const t = useTranslations("language");
    const { locale, switchTo, isPending } = useSwitchLocale();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open]);

    if (variant === "pills") {
        return (
            <div role="group" aria-label={t("change")} className="flex gap-2">
                {routing.locales.map((code) => (
                    <button
                        key={code}
                        type="button"
                        aria-pressed={code === locale}
                        disabled={isPending}
                        onClick={() => switchTo(code)}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 ${
                            code === locale ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300"
                        }`}
                    >
                        {LOCALE_META[code].label.toUpperCase()}
                    </button>
                ))}
            </div>
        );
    }

    const current = LOCALE_META[locale];
    const triggerTone = tone === "dark"
        ? "border-slate-700 text-slate-200 hover:bg-slate-800"
        : "border-gray-200 text-gray-600 hover:bg-gray-50";

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={t("change")}
                title={t("change")}
                disabled={isPending}
                className={`flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${triggerTone}`}
            >
                <Globe size={14} />
                {compact
                    ? <span>{current.flag}</span>
                    : <span>{current.flag} {locale.toUpperCase()}</span>}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div
                        role="listbox"
                        aria-label={t("label")}
                        className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border z-50 overflow-hidden min-w-32.5"
                    >
                        {routing.locales.map((code) => {
                            const meta = LOCALE_META[code];
                            const selected = code === locale;
                            return (
                                <button
                                    key={code}
                                    type="button"
                                    role="option"
                                    aria-selected={selected}
                                    onClick={() => { setOpen(false); switchTo(code); }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                                        selected ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                                    }`}
                                >
                                    <span>{meta.flag}</span>
                                    <span>{meta.label}</span>
                                    {selected && <Check size={14} className="ml-auto" />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
