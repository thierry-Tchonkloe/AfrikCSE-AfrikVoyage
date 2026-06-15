const AMADEUS_BASE_URL = process.env.AMADEUS_BASE_URL || "https://test.api.amadeus.com";

interface CachedToken {
    value: string;
    expiresAt: number;
}

let cachedToken: CachedToken | null = null;

async function getAccessToken(): Promise<string> {
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
        return cachedToken.value;
    }

    const apiKey = process.env.AMADEUS_API_KEY;
    const apiSecret = process.env.AMADEUS_API_SECRET;
    if (!apiKey || !apiSecret) {
        throw new Error("Configuration Amadeus manquante (AMADEUS_API_KEY / AMADEUS_API_SECRET)");
    }

    const res = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: apiKey,
            client_secret: apiSecret,
        }),
    });

    if (!res.ok) {
        throw new Error("Authentification Amadeus échouée");
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    cachedToken = {
        value: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return cachedToken.value;
}

export async function amadeusGet<T>(
    path: string,
    params: Record<string, string | number | boolean | undefined>
): Promise<T> {
    const token = await getAccessToken();

    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== "") query.set(key, String(value));
    }

    const res = await fetch(`${AMADEUS_BASE_URL}${path}?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Amadeus API error (${res.status}): ${body}`);
    }

    return res.json() as Promise<T>;
}
