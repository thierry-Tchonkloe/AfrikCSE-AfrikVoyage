import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
    locales: ["fr", "en"],
    defaultLocale: "fr",
    localePrefix: "always",
    // hreflang/canonical sont déclarés dans le <head> par generateMetadata (src/i18n/seo.ts, URLs absolues) :
    // on coupe les en-têtes HTTP `Link` du middleware, dérivés du Host, pour n'avoir qu'une seule source.
    alternateLinks: false,
    // Même durée (1 an) que l'ancien cookie posé par le sélecteur de langue.
    localeCookie: { maxAge: 365 * 24 * 60 * 60 },
});

export type Locale = (typeof routing.locales)[number];
