import { routing, type Locale } from "./routing";

/**
 * Sépare le préfixe de langue d'un chemin d'URL brut (`/fr/employes/x` → `/employes/x`).
 * Pour le code hors React (middleware, intercepteur axios, hooks) qui compare
 * `pathname` à des chemins non préfixés.
 */
export function splitLocalePath(pathname: string): { locale: Locale | null; path: string } {
    for (const locale of routing.locales) {
        if (pathname === `/${locale}`) return { locale, path: "/" };
        if (pathname.startsWith(`/${locale}/`)) return { locale, path: pathname.slice(locale.length + 1) };
    }
    return { locale: null, path: pathname };
}
