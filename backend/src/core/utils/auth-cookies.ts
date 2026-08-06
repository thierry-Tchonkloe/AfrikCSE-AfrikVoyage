import { Response } from "express";
import crypto from "node:crypto";

// Config commune aux deux systèmes de session (User et Partenaire) — seuls les
// NOMS de cookies diffèrent, pour que les deux sessions coexistent sans jamais
// interférer sur un même navigateur.
const IS_PROD = process.env.NODE_ENV === "production";

const COOKIE_BASE = {
    httpOnly: true,                                   // inaccessible depuis JS côté client
    secure:   IS_PROD,                                 // HTTPS uniquement en prod
    sameSite: (IS_PROD ? "none" : "lax") as "none" | "lax",
    partitioned: IS_PROD,
    path:   "/",
} as const;

// ── CSRF (double-submit cookie) ──────────────────────────────────────────────
// Les cookies de session sont posés en `SameSite=None` en production (frontend
// et backend sur des domaines différents), ce qui désactive la protection CSRF
// native de SameSite=Lax/Strict. Ce cookie compense : volontairement PAS
// httpOnly, pour que le frontend puisse le lire en JS et le renvoyer dans
// l'en-tête `X-CSRF-Token` à chaque requête d'écriture — vérifié par
// `csrfProtection` (core/middlewares/csrf.middleware.ts).
const CSRF_COOKIE_BASE = { ...COOKIE_BASE, httpOnly: false } as const;

export function setCsrfCookie(res: Response): string {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie("csrfToken", token, {
        ...CSRF_COOKIE_BASE,
        maxAge: 90 * 24 * 60 * 60 * 1000, // aligné sur la plus longue durée de session (refresh)
    });
    return token;
}

export function clearCsrfCookie(res: Response) {
    res.clearCookie("csrfToken", { ...CSRF_COOKIE_BASE });
}

// ── Utilisateurs standard ────────────────────────────────────────────────────

export function setUserAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    // accessToken — durée alignée sur le JWT (24h), disponible sur toutes les routes.
    // Un maxAge trop court (ex: 15min) faisait expirer le cookie côté navigateur
    // avant le JWT lui-même, et le middleware Edge Runtime (qui lit ce cookie
    // directement, sans passer par l'intercepteur axios) redirigeait alors
    // silencieusement vers /login malgré un refreshToken encore valide.
    res.cookie("accessToken", accessToken, {
        ...COOKIE_BASE,
        maxAge: 24 * 60 * 60 * 1000,  // 1 jour
    });

    // refreshToken — durée longue (7j), accessible partout pour le refresh workflow
    res.cookie("refreshToken", refreshToken, {
        ...COOKIE_BASE,
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 jours
    });

    setCsrfCookie(res);
}

export function clearUserAuthCookies(res: Response) {
    res.clearCookie("accessToken", { ...COOKIE_BASE });
    res.clearCookie("refreshToken", { ...COOKIE_BASE });
    clearCsrfCookie(res);
}

// ── Partenaires — cookies dédiés, noms distincts des cookies User ───────────

export function setPartnerAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie("partnerAccessToken", accessToken, {
        ...COOKIE_BASE,
        maxAge: 24 * 60 * 60 * 1000, // 24h — aligné sur la durée du JWT
    });
    res.cookie("partnerRefreshToken", refreshToken, {
        ...COOKIE_BASE,
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90j
    });

    setCsrfCookie(res);
}

export function clearPartnerAuthCookies(res: Response) {
    res.clearCookie("partnerAccessToken", { ...COOKIE_BASE });
    res.clearCookie("partnerRefreshToken", { ...COOKIE_BASE });
    clearCsrfCookie(res);
}
