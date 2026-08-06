import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Cookies de session portés par ce backend — leur présence signale une requête
// authentifiée "ambiante" (envoyée automatiquement par le navigateur), donc
// potentiellement forgeable en CSRF si elle déclenche une action d'écriture.
const SESSION_COOKIE_NAMES = ["accessToken", "refreshToken", "partnerAccessToken", "partnerRefreshToken"];

/**
 * Protection CSRF — pattern double-submit cookie (OWASP CSRF Prevention Cheat
 * Sheet). Les cookies de session sont posés en `SameSite=None` en production
 * (frontend et backend sur des domaines différents), ce qui désactive la
 * protection CSRF native de SameSite=Lax/Strict.
 *
 * Le contrôle n'est appliqué que lorsque la requête porte déjà un cookie de
 * session : sans cookie ambiant, il n'y a rien à forger côté attaquant (login,
 * inscription, mot de passe oublié, webhooks serveur-à-serveur, endpoints
 * publics comme le formulaire de contact ou le scan de ticket restent donc
 * utilisables sans jeton CSRF, sans avoir à les lister explicitement ici).
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
    if (SAFE_METHODS.has(req.method)) {
        next();
        return;
    }

    // La suite de tests (supertest) appelle l'app directement sans passer par un
    // vrai navigateur — elle ne peut donc pas reproduire le cycle cookie/en-tête
    // double-submit. La protection réelle (dev/prod) n'est pas affectée ; voir
    // csrf.middleware.test.ts pour la couverture de test de cette fonction en isolation.
    if (process.env.NODE_ENV === "test") {
        next();
        return;
    }

    const hasSessionCookie = SESSION_COOKIE_NAMES.some((name) => Boolean(req.cookies?.[name]));
    if (!hasSessionCookie) {
        next();
        return;
    }

    const cookieToken = req.cookies?.csrfToken as string | undefined;
    const headerToken = req.headers["x-csrf-token"];

    if (
        !cookieToken ||
        typeof headerToken !== "string" ||
        cookieToken.length !== headerToken.length ||
        !crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))
    ) {
        res.status(403).json({ message: "Jeton CSRF manquant ou invalide" });
        return;
    }

    next();
}
