/**
 * Système de thémisation dynamique.
 *
 * La palette effective d'une page est résolue selon une priorité :
 *   1. Préférences de l'utilisateur connecté (surcharge personnelle)
 *   2. Thème de l'espace courant (Super Admin / Company / Employé)
 *   3. Palette de marque par défaut (fallback ultime, toujours définie)
 *
 * Les valeurs résolues sont injectées comme variables CSS sur :root,
 * ce qui permet à tout le reste de l'UI (Tailwind `var(--color-…)`,
 * styles inline) de rester inchangé.
 */

export type ThemeColorKey = "primary" | "secondary" | "dark" | "success" | "warning" | "bgLight";

export type ThemePalette = Record<ThemeColorKey, string>;

/**
 * Palette de marque par défaut — appliquée dès qu'un espace ou un
 * utilisateur n'a pas défini de thème personnalisé.
 */
export const DEFAULT_PALETTE: ThemePalette = {
    dark:    "#1E293B", // Deep Slate    — sections sombres, mode premium, socle visuel
    primary: "#6366F1", // Electric Indigo — CTA et états actifs
    success: "#10B981", // Vert Émeraude — conformité / résultats positifs
    warning: "#F59E0B", // Ambre        — alertes budget, vigilance
    secondary: "#F59E0B", // alias historique de `warning` (compat avec --color-secondary)
    bgLight: "#F8FAFC", // Gris très clair — fond du contenu principal
};

// Mapping clé de palette → variables CSS injectées sur :root.
// Conserve les noms historiques (--color-primary, --color-bg, …) ET
// expose les nouveaux noms sémantiques `--color-brand-*` demandés.
const CSS_VAR_TARGETS: Record<ThemeColorKey, string[]> = {
    primary:   ["--color-brand-primary", "--color-primary"],
    secondary: ["--color-secondary"],
    dark:      ["--color-brand-dark"],
    success:   ["--color-brand-success"],
    warning:   ["--color-brand-warning"],
    bgLight:   ["--color-brand-bg-light", "--color-bg"],
};

/** Éclaircit une couleur hex d'un certain pourcentage */
export function lighten(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(2.55 * percent));
    const b = Math.min(255, (num & 0xff) + Math.round(2.55 * percent));
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/**
 * Injecte une palette résolue comme variables CSS sur :root.
 * Pure fonction d'application — ne fait aucune résolution de priorité.
 */
export function applyThemePalette(palette: ThemePalette): void {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    (Object.keys(palette) as ThemeColorKey[]).forEach((key) => {
        const value = palette[key];
        if (!value) return;
        for (const cssVar of CSS_VAR_TARGETS[key]) {
            root.style.setProperty(cssVar, value);
        }
    });

    // Dérivés pratiques pour la couleur primaire (hover / fond clair)
    root.style.setProperty("--color-primary-hover", lighten(palette.primary, 10));
    root.style.setProperty("--color-primary-light", lighten(palette.primary, 45));
}

/**
 * Fusionne plusieurs sources partielles avec la priorité :
 * user > space > DEFAULT_PALETTE (le premier argument défini gagne, par clé).
 */
export function resolveThemePalette(
    user?: Partial<ThemePalette> | null,
    space?: Partial<ThemePalette> | null
): ThemePalette {
    const result = { ...DEFAULT_PALETTE };
    (Object.keys(result) as ThemeColorKey[]).forEach((key) => {
        result[key] = user?.[key] || space?.[key] || DEFAULT_PALETTE[key];
    });
    return result;
}

/**
 * Résout puis applique en une seule étape — pratique pour les aperçus
 * en temps réel (ex : page de réglages Super Admin).
 */
export function applyTheme(colors: { primaryColor?: string; secondaryColor?: string }): void {
    applyThemePalette(
        resolveThemePalette(null, {
            primary: colors.primaryColor,
            secondary: colors.secondaryColor,
            warning: colors.secondaryColor,
        })
    );
}

/** Bascule dark/light mode */
export function applyDarkMode(dark: boolean): void {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", dark);
}
