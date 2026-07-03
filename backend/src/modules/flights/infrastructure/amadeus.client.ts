import { prisma } from "../../../core/config/prisma";
import { decrypt } from "../../../core/utils/crypto";

const DEFAULT_BASE_URL = process.env.AMADEUS_BASE_URL || "https://test.api.amadeus.com";

interface CachedSession {
    token:     string;
    baseUrl:   string;
    expiresAt: number;
}

let session: CachedSession | null = null;

async function getAmadeusCredentials(): Promise<{
    key: string; secret: string; baseUrl: string;
}> {
    // Priorité 1 : intégration GDS configurée via l'UI admin
    try {
        const integration = await prisma.apiIntegration.findFirst({
            where: { integrationType: "GDS", isActive: true },
            orderBy: { updatedAt: "desc" },
        });

        if (integration?.apiKey) {
            const key = decrypt(integration.apiKey);
            const config = integration.syncConfig as {
                apiSecret?: string;
                baseUrl?:   string;
            } | null;
            const secret = config?.apiSecret ? decrypt(config.apiSecret) : null;

            if (key && secret) {
                return { key, secret, baseUrl: config?.baseUrl ?? DEFAULT_BASE_URL };
            }
        }
    } catch {
        // DB indisponible ou décryptage échoué → fallback env vars
    }

    // Priorité 2 : variables d'environnement
    const key    = process.env.AMADEUS_API_KEY;
    const secret = process.env.AMADEUS_API_SECRET;
    if (!key || !secret) {
        throw new Error(
            "Configuration Amadeus manquante — définissez AMADEUS_API_KEY / AMADEUS_API_SECRET " +
            "ou configurez une intégration GDS active dans l'UI admin."
        );
    }
    return { key, secret, baseUrl: DEFAULT_BASE_URL };
}

async function getSession(): Promise<CachedSession> {
    if (session && session.expiresAt > Date.now()) return session;

    const { key, secret, baseUrl } = await getAmadeusCredentials();

    const res = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:    new URLSearchParams({
            grant_type:    "client_credentials",
            client_id:     key,
            client_secret: secret,
        }),
    });

    if (!res.ok) throw new Error("Authentification Amadeus échouée");

    const data = (await res.json()) as { access_token: string; expires_in: number };
    session = {
        token:     data.access_token,
        baseUrl,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return session;
}

export async function amadeusGet<T>(
    path: string,
    params: Record<string, string | number | boolean | undefined>
): Promise<T> {
    const { token, baseUrl } = await getSession();

    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== "") query.set(k, String(v));
    }

    const res = await fetch(`${baseUrl}${path}?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Amadeus API error (${res.status}): ${body}`);
    }

    return res.json() as Promise<T>;
}
