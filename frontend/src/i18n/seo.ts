import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export type LocaleParams = { params: Promise<{ locale: string }> };

export const SITE_NAME = "AfrikCSE & AfrikVoyage";

// Chemins (sans préfixe de langue) des pages qui déclarent canonical + hreflang.
// Chaque clé correspond à une entrée `metadata.<clé>` dans messages/*.json.
export const SEO_PAGES = {
    home: "/infos",
    solutions: "/infos/solutions",
    about: "/infos/about",
    contact: "/infos/contact",
    demo: "/infos/demo",
    howItWorks: "/infos/how-it-works",
    joinUs: "/infos/join-us",
    legal: "/infos/legal",
    pricing: "/infos/pricing",
    privacy: "/infos/privacy",
    login: "/login",
    register: "/register",
    activate: "/activate",
} as const;

export type SeoPage = keyof typeof SEO_PAGES;

// og:locale attend le format ll_CC.
const OG_LOCALES: Record<Locale, string> = { fr: "fr_FR", en: "en_GB" };

export function getOgLocales(locale: Locale) {
    return {
        locale: OG_LOCALES[locale],
        alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALES[l]),
    };
}

let warnedMissingSiteUrl = false;

/**
 * URL publique du site : requise pour que canonical / hreflang soient des URLs absolues.
 * Définir NEXT_PUBLIC_SITE_URL au build (sur Vercel, VERCEL_PROJECT_PRODUCTION_URL sert de repli).
 */
export function getSiteUrl(): URL {
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    const raw = configured || (vercel ? `https://${vercel}` : "");
    if (raw) {
        try {
            return new URL(raw);
        } catch {
            console.error(`[seo] URL de site invalide : "${raw}" — repli sur http://localhost:3000`);
        }
    } else if (process.env.NODE_ENV === "production" && !warnedMissingSiteUrl) {
        warnedMissingSiteUrl = true;
        console.warn("[seo] NEXT_PUBLIC_SITE_URL n'est pas défini : canonical/hreflang pointeront vers http://localhost:3000.");
    }
    return new URL("http://localhost:3000");
}

/**
 * Balises SEO internationales d'une page : canonical propre à la langue courante,
 * hreflang vers chaque version linguistique (+ x-default = langue par défaut) et og:locale.
 */
export function getInternationalTags({
    locale,
    page,
    title,
    description,
}: {
    locale: Locale;
    page: SeoPage;
    title: string;
    description: string;
}): Pick<Metadata, "alternates" | "openGraph"> {
    const href = SEO_PAGES[page];
    const urls = Object.fromEntries(
        routing.locales.map((l) => [l, getPathname({ locale: l, href })])
    ) as Record<Locale, string>;
    const canonical = urls[locale];

    return {
        alternates: {
            canonical,
            languages: { ...urls, "x-default": urls[routing.defaultLocale] },
        },
        openGraph: {
            type: "website",
            siteName: SITE_NAME,
            title,
            description,
            url: canonical,
            ...getOgLocales(locale),
        },
    };
}
