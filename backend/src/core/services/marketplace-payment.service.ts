import crypto from "node:crypto";

// ── Interfaces ────────────────────────────────────────────────────────────────

interface KkiapayVerifyResponse {
    status: string;          // "SUCCESS" | "FAILED" | "PENDING"
    amount: number;
    transactionId: string;
    failureMessage?: string;
}

interface FedapayCreateResponse {
    id: number;
    status: string;
    payment_url: string;
    reference: string;
}

export interface FedapayWebhookEvent {
    id: string;
    name: string; // "transaction.approved" | "transaction.declined" | ...
    data: {
        object: {
            id: number;
            reference: string;
            status: string;
            amount: number;
            custom_metadata?: string;
        };
    };
}

export interface KkiapayWebhookEvent {
    eventType: string; // "SUCCESSFUL_PAYMENT"
    transactionId: string;
    amount: number;
    data?: { custom_metadata?: string };
}

// ── Service ───────────────────────────────────────────────────────────────────

export class MarketplacePaymentService {

    /**
     * KkiaPay — Le frontend lance le widget, récupère un transactionId et
     * l'envoie au backend. On vérifie ici la transaction auprès de l'API.
     */
    async verifyKkiapayTransaction(transactionId: string): Promise<{ success: boolean; amount: number }> {
        const secretKey  = process.env.KKIAPAY_SECRET_KEY;
        const privateKey = process.env.KKIAPAY_PRIVATE_KEY;
        if (!secretKey) throw new Error("KKIAPAY_SECRET_KEY manquant dans les variables d'environnement");

        const baseUrl  = process.env.KKIAPAY_API_URL ?? "https://api.kkiapay.me";
        const response = await fetch(`${baseUrl}/api/v1/transactions/${transactionId}/status`, {
            headers: {
                "x-secret-key": secretKey,
                ...(privateKey ? { "x-private-key": privateKey } : {}),
            },
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`KkiaPay API error ${response.status} : ${err}`);
        }

        const verified = (await response.json()) as KkiapayVerifyResponse;
        return { success: verified.status === "SUCCESS", amount: verified.amount };
    }

    /**
     * FedaPay — Backend crée la transaction et retourne l'URL de paiement.
     * L'utilisateur est redirigé vers cette URL.
     */
    async initiateFedapayTransaction(opts: {
        amount:     number;
        orderId:    string;
        userId:     string;
        orgId:      string;
        currency?:  string;
    }): Promise<{ checkoutUrl: string; transactionRef: string }> {
        const secretKey = process.env.FEDAPAY_SECRET_KEY;
        if (!secretKey) throw new Error("FEDAPAY_SECRET_KEY manquant dans les variables d'environnement");

        const baseUrl  = process.env.FEDAPAY_API_URL ?? "https://api.fedapay.com";
        const backendUrl  = process.env.BACKEND_URL ?? "";
        const frontendUrl = process.env.FRONTEND_URL ?? "";

        const reference = `ORDER-${opts.orderId.slice(-12)}-${Date.now()}`;

        const response = await fetch(`${baseUrl}/v1/transactions`, {
            method: "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${secretKey}`,
            },
            body: JSON.stringify({
                description:     `Commande AfrikCSE/AfrikVoyage`,
                amount:          opts.amount,
                currency:        { iso: opts.currency ?? "XOF" },
                callback_url:    `${backendUrl}/api/orders/webhook/fedapay`,
                return_url:      `${frontendUrl}/employes/commandes?status=success`,
                cancel_url:      `${frontendUrl}/employes/commandes?status=cancelled`,
                custom_metadata: JSON.stringify({ orderId: opts.orderId, userId: opts.userId, orgId: opts.orgId }),
                customer:        { email: "", firstname: "", lastname: "" },
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(`FedaPay API error : ${JSON.stringify(err)}`);
        }

        const txn = (await response.json()) as { v1?: { transaction: FedapayCreateResponse } };
        const transaction = txn.v1?.transaction ?? (txn as unknown as FedapayCreateResponse);

        return {
            checkoutUrl:    transaction.payment_url,
            transactionRef: String(transaction.id ?? reference),
        };
    }

    /**
     * Vérifie la signature HMAC-SHA256 d'un webhook KkiaPay.
     */
    verifyKkiapayWebhookSignature(payload: unknown, signature: string): boolean {
        const secretKey = process.env.KKIAPAY_SECRET_KEY ?? "";
        const expected  = crypto
            .createHmac("sha256", secretKey)
            .update(JSON.stringify(payload))
            .digest("hex");
        try {
            return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
        } catch {
            return false;
        }
    }

    /**
     * Vérifie le token Bearer d'un webhook FedaPay.
     */
    verifyFedapayWebhookToken(token: string): boolean {
        const expected = process.env.FEDAPAY_WEBHOOK_TOKEN ?? "";
        if (!expected) return false;
        try {
            return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
        } catch {
            return false;
        }
    }
}
