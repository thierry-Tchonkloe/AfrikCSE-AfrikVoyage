"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { adminService } from "@/services/admin/admin.service";
import {
    DEFAULT_PALETTE,
    ThemePalette,
    applyDarkMode,
    applyThemePalette,
    resolveThemePalette,
} from "@/lib/theme";

export type ThemeSpace = "super-admin" | "company" | "employee" | "public";

/** Déduit l'espace courant à partir du chemin — détermine quel thème d'espace charger */
function spaceFromPathname(pathname: string): ThemeSpace {
    if (pathname.startsWith("/admin")) return "super-admin";
    if (pathname.startsWith("/companies")) return "company";
    if (pathname.startsWith("/employes") || pathname.startsWith("/hub")) return "employee";
    return "public";
}

const USER_THEME_STORAGE_PREFIX = "afrikcse:user-theme:";
const DARK_MODE_STORAGE_KEY = "afrikcse:dark-mode";

function loadUserPalette(userId?: string): Partial<ThemePalette> | null {
    if (!userId || typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(USER_THEME_STORAGE_PREFIX + userId);
        return raw ? (JSON.parse(raw) as Partial<ThemePalette>) : null;
    } catch {
        return null;
    }
}

function saveUserPalette(userId: string, palette: Partial<ThemePalette> | null): void {
    if (typeof window === "undefined") return;
    const key = USER_THEME_STORAGE_PREFIX + userId;
    if (!palette) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(palette));
}

interface ThemeContextValue {
    /** Espace courant déduit de l'URL (super-admin / company / employee / public) */
    space: ThemeSpace;
    /** Palette finale résolue et actuellement appliquée à :root */
    colors: ThemePalette;
    /** Palette de marque par défaut (fallback ultime) */
    defaultColors: ThemePalette;
    /** Définit (ou efface avec `null`) la surcharge personnelle de l'utilisateur connecté */
    setUserColors: (colors: Partial<ThemePalette> | null) => void;
    /** Mode sombre actif — partagé et persisté entre tous les espaces */
    darkMode: boolean;
    /** Active/désactive le mode sombre et persiste la préférence */
    setDarkMode: (dark: boolean) => void;
    /** Message de bienvenue personnalisé de l'organisation (null si non défini) */
    welcomeMessage: string | null;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Fournit le thème dynamique de l'application en résolvant, par ordre de
 * priorité : préférences utilisateur > thème de l'espace courant > palette
 * de marque par défaut. Le résultat est injecté en variables CSS sur :root,
 * donc consommable partout via `var(--color-…)` sans changement ailleurs.
 *
 * À monter une seule fois, au niveau du layout racine.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuth();
    const space = useMemo(() => spaceFromPathname(pathname ?? ""), [pathname]);

    // Thème de l'espace courant — résolu et appliqué uniquement depuis les
    // données effectivement récupérées (jamais d'écriture d'état synchrone
    // dans le corps de l'effet : on stocke le couple espace+réglages reçu,
    // et on dérive la palette qui le concerne via useMemo ci-dessous).
    const [fetchedSpaceSettings, setFetchedSpaceSettings] = useState<{
        space: ThemeSpace;
        palette: Partial<ThemePalette>;
    } | null>(null);

    // Aujourd'hui, seul l'espace Super Admin expose une configuration
    // persistée (PlatformSettings.primaryColor / secondaryColor). Les
    // espaces Company/Employé n'ont pas encore de thème propre côté
    // organisation : ils retombent donc naturellement sur la palette
    // par défaut, conformément au comportement attendu.
    useEffect(() => {
        if (space !== "super-admin" || !user) return;
        let cancelled = false;

        adminService
            .getSettings()
            .then((settings: { primaryColor?: string; secondaryColor?: string }) => {
                if (cancelled) return;
                setFetchedSpaceSettings({
                    space,
                    palette: {
                        primary: settings.primaryColor,
                        secondary: settings.secondaryColor,
                        warning: settings.secondaryColor,
                    },
                });
            })
            .catch(() => {});

        return () => { cancelled = true; };
    }, [space, user]);

    // Espaces Company/Employé : la palette de l'organisation (logo/couleurs)
    // est déjà incluse dans `user.organization` (réponse de /auth/me), donc
    // aucun appel réseau supplémentaire n'est nécessaire ici.
    const orgPalette = useMemo<Partial<ThemePalette> | null>(() => {
        if (space !== "company" && space !== "employee") return null;
        const org = user?.organization;
        if (!org || (!org.primaryColor && !org.secondaryColor)) return null;
        return {
            primary:   org.primaryColor   ?? undefined,
            secondary: org.secondaryColor ?? undefined,
            warning:   org.secondaryColor ?? undefined,
        };
    }, [space, user]);

    // Branding étendu : accent color, fond personnalisé, favicon dynamique
    useEffect(() => {
        if (space !== "company" && space !== "employee") return;
        const org = user?.organization;
        if (!org) return;
        if (typeof document === "undefined") return;
        const root = document.documentElement;
        if (org.accentColor)     root.style.setProperty("--color-accent", org.accentColor);
        if (org.backgroundColor) root.style.setProperty("--color-bg-org", org.backgroundColor);
        if (org.faviconUrl) {
            let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
            if (!link) {
                link = document.createElement("link");
                link.rel = "icon";
                document.head.appendChild(link);
            }
            link.href = org.faviconUrl;
        }
    }, [space, user]);

    // Ne retient le résultat récupéré que s'il correspond à l'espace courant
    // (évite d'appliquer un thème "Super Admin" résiduel après avoir changé d'espace).
    const spacePalette = useMemo(() => {
        if (space === "super-admin") {
            return fetchedSpaceSettings && fetchedSpaceSettings.space === space ? fetchedSpaceSettings.palette : null;
        }
        return orgPalette;
    }, [fetchedSpaceSettings, space, orgPalette]);

    // Préférences personnelles de l'utilisateur connecté — surcharge la plus prioritaire.
    // Persistées côté client (le backend n'expose pas encore de thème par utilisateur) ;
    // la résolution reste compatible avec un futur champ serveur (ex: user.themeColors).
    // `version` ne sert qu'à invalider le useMemo après écriture explicite (setUserColors) ;
    // la lecture elle-même reste une dérivation pure de `user.id` (pas d'état dupliqué).
    const [userPaletteVersion, setUserPaletteVersion] = useState(0);
    const userPalette = useMemo(
        () => loadUserPalette(user?.id),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- userPaletteVersion force la relecture du localStorage après setUserColors
        [user?.id, userPaletteVersion]
    );

    const setUserColors = useCallback(
        (colors: Partial<ThemePalette> | null) => {
            if (!user) return;
            saveUserPalette(user.id, colors);
            setUserPaletteVersion((v) => v + 1);
        },
        [user]
    );

    const colors = useMemo(
        () => resolveThemePalette(userPalette, spacePalette),
        [userPalette, spacePalette]
    );

    // Applique la palette résolue dès qu'elle change (changement d'espace,
    // chargement du thème de l'espace, ou préférence utilisateur modifiée).
    useEffect(() => {
        applyThemePalette(colors);
    }, [colors]);

    // Mode sombre — préférence globale partagée par tous les espaces, persistée
    // côté client. Démarre à `false` (identique au rendu serveur) puis se
    // synchronise avec la valeur stockée juste après le montage, pour éviter
    // tout mismatch d'hydratation.
    const [darkMode, setDarkModeState] = useState(false);

    useEffect(() => {
        if (window.localStorage.getItem(DARK_MODE_STORAGE_KEY) === "true") {
            setDarkModeState(true);
        }
    }, []);

    useEffect(() => {
        applyDarkMode(darkMode);
    }, [darkMode]);

    const setDarkMode = useCallback((dark: boolean) => {
        setDarkModeState(dark);
        window.localStorage.setItem(DARK_MODE_STORAGE_KEY, String(dark));
    }, []);

    const welcomeMessage = useMemo(
        () => (space === "company" || space === "employee")
            ? (user?.organization?.welcomeMessage ?? null)
            : null,
        [space, user]
    );

    const value = useMemo<ThemeContextValue>(
        () => ({ space, colors, defaultColors: DEFAULT_PALETTE, setUserColors, darkMode, setDarkMode, welcomeMessage }),
        [space, colors, setUserColors, darkMode, setDarkMode, welcomeMessage]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme doit être utilisé à l'intérieur d'un <ThemeProvider>");
    return ctx;
}
