import { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { verifyApiKey } from "../../modules/api-developer/application/api-developer.service";
import { AppError } from "../errors/app.error";

declare global {
    namespace Express {
        interface Request {
            apiClient?: {
                id:     string;
                orgId:  string;
                scopes: string[];
            };
        }
    }
}

/* -------------------------------------------------------------------------- */
/* Cache en mémoire (TTL court)                                                */
/* -------------------------------------------------------------------------- */
// Pas de Redis dans ce projet (aucune dépendance, aucun service docker-compose) et
// déploiement Render sur le plan "free" = une seule instance backend (voir
// render.yaml) : un cache mémoire local ne pose donc aucun problème de cohérence
// inter-instances. Objectif : épargner un aller-retour PostgreSQL (verifyApiKey
// fait un findUnique + un UPDATE lastUsedAt) à chaque appel d'un intégrateur qui
// consommerait l'API publique en rafale.

function envInt(name: string, fallback: number): number {
    const raw = process.env[name];
    if (raw === undefined || raw.trim() === "") return fallback;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// TTL volontairement court : une clé révoquée/expirée met au plus ce délai à être
// effectivement coupée. `lastUsedAt` n'est lui aussi rafraîchi qu'à ce rythme
// (au plus une fois par fenêtre de TTL par clé) — compromis accepté, la fraîcheur
// à la seconde près de "dernière utilisation" n'a pas d'enjeu métier ici.
const CACHE_TTL_MS = envInt("API_KEY_CACHE_TTL_SECONDS", 120) * 1000;

// Garde-fou de taille : borne la mémoire même si un client bombarde l'endpoint
// avec des clés distinctes (valides ou non) — évite une croissance non bornée.
const MAX_CACHE_ENTRIES = 5000;

type ClientInfo = {
    id: string; orgId: string; scopes: string[];
    orgStatus: string; developerApiEnabled: boolean;
};
type CacheEntry =
    | { ok: true; client: ClientInfo }
    | { ok: false; status: number; message: string };

const cache = new Map<string, { expiresAt: number; entry: CacheEntry }>();

function hashKey(rawKey: string): string {
    return createHash("sha256").update(rawKey).digest("hex");
}

function readCache(hash: string): CacheEntry | undefined {
    const cached = cache.get(hash);
    if (!cached) return undefined;
    if (cached.expiresAt < Date.now()) {
        cache.delete(hash);
        return undefined;
    }
    return cached.entry;
}

function writeCache(hash: string, entry: CacheEntry): void {
    if (cache.size >= MAX_CACHE_ENTRIES) {
        // Map conserve l'ordre d'insertion — on éjecte la plus ancienne entrée
        // plutôt que de tout vider, pour un comportement proche d'un LRU simple.
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) cache.delete(oldestKey);
    }
    cache.set(hash, { expiresAt: Date.now() + CACHE_TTL_MS, entry });
}

// Purge périodique des entrées expirées — `readCache` nettoie déjà à la lecture,
// ce sweep évite juste qu'une clé jamais rappelée reste en mémoire jusqu'au cap.
if (process.env.NODE_ENV !== "test") {
    setInterval(() => {
        const now = Date.now();
        for (const [hash, { expiresAt }] of cache) {
            if (expiresAt < now) cache.delete(hash);
        }
    }, CACHE_TTL_MS).unref();
}

/* -------------------------------------------------------------------------- */
/* Middleware                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Authentification par clé API (en-tête `x-api-key`) — distincte de `authenticate`
 * (cookie de session JWT) : c'est le point d'entrée pour les intégrations tierces
 * dont la clé est générée depuis /admin/developer, pas pour les utilisateurs du produit.
 */
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const rawKey = req.header("x-api-key");
    if (!rawKey) {
        res.status(401).json({ message: "Clé API manquante (en-tête x-api-key requis)" });
        return;
    }

    const hash = hashKey(rawKey);
    let entry = readCache(hash);

    if (!entry) {
        try {
            const client = await verifyApiKey(rawKey);
            entry = {
                ok: true,
                client: {
                    id: client.id, orgId: client.orgId, scopes: client.scopes,
                    orgStatus: client.org.status, developerApiEnabled: client.org.developerApiEnabled,
                },
            };
        } catch (err) {
            if (!(err instanceof AppError)) { next(err); return; }
            entry = { ok: false, status: err.statusCode, message: err.message };
        }
        writeCache(hash, entry);
    }

    if (!entry.ok) {
        res.status(entry.status).json({ message: entry.message });
        return;
    }
    if (entry.client.orgStatus !== "ACTIVE") {
        res.status(403).json({ message: "Organisation inactive" });
        return;
    }
    if (!entry.client.developerApiEnabled) {
        res.status(403).json({ message: "L'API développeur n'est pas activée pour cette organisation" });
        return;
    }

    req.apiClient = { id: entry.client.id, orgId: entry.client.orgId, scopes: entry.client.scopes };
    next();
}
