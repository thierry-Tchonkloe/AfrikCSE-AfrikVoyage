"use client";

import { useLocale } from "next-intl";

const BCP47: Record<string, string> = { fr: "fr-FR", en: "en-GB" };

export function useDateLocale(): string {
    const locale = useLocale();
    return BCP47[locale] ?? locale;
}
