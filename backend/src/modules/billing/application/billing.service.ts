import { prisma } from "../../../core/config/prisma";
import { Plan, PaymentMethod } from "@prisma/client";
import crypto from "node:crypto";

// ── Constantes ───────────────────────────────────────────────────────────────

export const PLAN_PRICES_XOF: Record<Plan, number> = {
    STARTER:    0,
    BUSINESS:   175_000, // ~299 USD en FCFA
    ENTERPRISE: 292_000, // ~499 USD en FCFA
};

export const PLAN_PRICES_USD: Record<Plan, number> = {
    STARTER:    0,
    BUSINESS:   299,
    ENTERPRISE: 499,
};

export type Currency = "XOF" | "USD";

// ── Interfaces internes ───────────────────────────────────────────────────────

interface KkiapayVerifyResponse {
    status: string;          // "SUCCESS" | "FAILED" | "PENDING"
    amount: number;
    transactionId: string;
    failureMessage?: string;
}

interface FedapayCreateResponse {
    id: number;
    status: string;
    amount: number;
    currency: { iso: string };
    payment_url: string;    // URL checkout FedaPay
    reference: string;
}

interface FedapayWebhookEvent {
    id: string;
    name: string; // "transaction.approved" | "transaction.declined" | ...
    data: {
        object: {
            id: number;
            reference: string;
            status: string;
            amount: number;
        };
    };
}

// ── Service ──────────────────────────────────────────────────────────────────

export class BillingService {

    // ── Abonnement ────────────────────────────────────────────────────────────

    async getSubscription(orgId: string) {
        const sub = await prisma.subscription.findUnique({
            where: { organizationId: orgId },
            include: {
                invoices: { orderBy: { createdAt: "desc" }, take: 12 },
            },
        });
        return sub;
    }

    async upgradePlan(orgId: string, plan: Plan) {
        return this._upsertSubscription(orgId, plan);
    }

    async getInvoices(orgId: string) {
        return prisma.invoice.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: "desc" },
        });
    }

    // ── KkiaPay ───────────────────────────────────────────────────────────────
    // Flow : frontend lance le widget KkiaPay → widget retourne un transactionId
    //        → frontend envoie transactionId au backend → on vérifie avec l'API KkiaPay
    //        → si SUCCESS on crée l'abonnement et la facture

    async processKkiapayPayment(orgId: string, plan: Plan, transactionId: string, currency: Currency = "XOF") {
        // 1. Vérifier la transaction avec l'API KkiaPay
        const verified = await this._verifyKkiapayTransaction(transactionId);

        if (verified.status !== "SUCCESS") {
            throw new Error(`Transaction KkiaPay invalide : ${verified.status}${verified.failureMessage ? ` — ${verified.failureMessage}` : ""}`);
        }

        const expectedAmount = PLAN_PRICES_XOF[plan];
        if (expectedAmount > 0 && verified.amount < expectedAmount) {
            throw new Error(`Montant insuffisant : reçu ${verified.amount} XOF, attendu ${expectedAmount} XOF`);
        }

        // 2. Vérifier que ce transactionId n'a pas déjà été utilisé (anti-replay)
        const existing = await prisma.invoice.findFirst({ where: { paymentRef: transactionId } });
        if (existing) throw new Error("Ce transactionId a déjà été utilisé");

        // 3. Créer/mettre à jour l'abonnement et la facture
        const sub = await this._upsertSubscription(orgId, plan);
        const invoice = await this._createInvoice(orgId, {
            subscriptionId: sub.id,
            amount: currency === "XOF" ? verified.amount / 100 : PLAN_PRICES_USD[plan],
            description: `Abonnement ${plan} — KkiaPay`,
            paymentMethod: "KKIAPAY",
            paymentRef: transactionId,
        });

        return { subscription: sub, invoice };
    }

    // ── FedaPay ───────────────────────────────────────────────────────────────
    // Flow : backend crée la transaction FedaPay → retourne checkout_url
    //        → frontend redirige l'utilisateur → FedaPay webhook confirme

    async initiateFedapayPayment(orgId: string, plan: Plan, currency: Currency = "XOF") {
        const amount = PLAN_PRICES_XOF[plan];
        if (amount === 0) {
            // Plan gratuit → pas besoin de paiement
            const sub = await this._upsertSubscription(orgId, plan);
            return { checkoutUrl: null, subscription: sub, message: "Plan gratuit activé" };
        }

        const secretKey = process.env.FEDAPAY_SECRET_KEY;
        if (!secretKey) throw new Error("FEDAPAY_SECRET_KEY manquant dans les variables d'environnement");

        const baseUrl = process.env.FEDAPAY_API_URL ?? "https://api.fedapay.com";

        // Référence unique pour traçabilité
        const reference = `PLAN-${plan}-${orgId.slice(-8)}-${Date.now()}`;

        const response = await fetch(`${baseUrl}/v1/transactions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${secretKey}`,
            },
            body: JSON.stringify({
                description: `Abonnement AfrikCSE/AfrikVoyage — Plan ${plan}`,
                amount,
                currency: { iso: currency },
                callback_url: `${process.env.BACKEND_URL ?? process.env.FRONTEND_URL}/api/billing/webhook/fedapay`,
                return_url: `${process.env.FRONTEND_URL}/companies/billing?status=success`,
                cancel_url: `${process.env.FRONTEND_URL}/companies/billing?status=cancelled`,
                custom_metadata: JSON.stringify({ orgId, plan }),
                customer: { email: "", firstname: "", lastname: "" },
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(`FedaPay API error : ${JSON.stringify(err)}`);
        }

        const txn = (await response.json()) as { v1: { transaction: FedapayCreateResponse } };
        const transaction = txn.v1?.transaction ?? (txn as unknown as FedapayCreateResponse);

        // Stocker la référence en attente
        await prisma.invoice.create({
            data: {
                invoiceNumber: `PRE-${reference}`,
                amount: amount / 100,
                description: `Abonnement ${plan} — FedaPay en attente`,
                paymentMethod: "FEDAPAY",
                paymentRef: String(transaction.id ?? reference),
                status: "PENDING",
                organizationId: orgId,
                subscriptionId: (await this._getOrCreateSubscription(orgId)).id,
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });

        return {
            checkoutUrl: transaction.payment_url,
            transactionRef: String(transaction.id),
            message: "Redirection FedaPay",
        };
    }

    // ── Webhooks ───────────────────────────────────────────────────────────────

    async handleKkiapayWebhook(payload: unknown, signature: string) {
        const secretKey = process.env.KKIAPAY_SECRET_KEY ?? "";

        // Vérification HMAC-SHA256
        const expectedSig = crypto
            .createHmac("sha256", secretKey)
            .update(JSON.stringify(payload))
            .digest("hex");

        if (!crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSig, "hex"))) {
            throw new Error("Signature KkiaPay invalide");
        }

        const event = payload as { eventType: string; transactionId: string; amount: number };

        if (event.eventType !== "SUCCESSFUL_PAYMENT") return { ignored: true };

        // Retrouver la facture en attente via paymentRef
        const invoice = await prisma.invoice.findFirst({
            where: { paymentRef: event.transactionId, status: "PENDING" },
        });
        if (!invoice) return { ignored: true, reason: "Facture introuvable" };

        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: "PAID", paidAt: new Date() },
        });

        return { processed: true };
    }

    async handleFedapayWebhook(payload: FedapayWebhookEvent, token: string) {
        const webhookToken = process.env.FEDAPAY_WEBHOOK_TOKEN ?? "";

        if (token !== webhookToken) {
            throw new Error("Token FedaPay webhook invalide");
        }

        if (payload.name !== "transaction.approved") return { ignored: true, event: payload.name };

        const txnId = String(payload.data.object.id);
        const invoice = await prisma.invoice.findFirst({
            where: { paymentRef: txnId, status: "PENDING" },
        });

        if (!invoice) return { ignored: true, reason: "Facture introuvable" };

        // Activer l'abonnement
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: "PAID", paidAt: new Date() },
        });

        // Mettre à jour l'abonnement
        await prisma.subscription.update({
            where: { id: invoice.subscriptionId! },
            data: { status: "ACTIVE" },
        });

        return { processed: true };
    }

    // ── Carte prépayée ────────────────────────────────────────────────────────
    // Architecture extensible — remplacer le stub par Stripe ou autre gateway

    async processCardPayment(orgId: string, plan: Plan, _cardData: {
        number: string;
        expiry: string;
        cvv: string;
    }) {
        // TODO: Intégrer Stripe ou CinetPay selon le marché
        // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });
        // const paymentIntent = await stripe.paymentIntents.create({ amount: ..., currency: "xof" });

        if (process.env.NODE_ENV === "production") {
            throw new Error("Paiement carte non encore configuré en production — contactez le support");
        }

        // Mode dev/test : simuler un paiement réussi
        const sub = await this._upsertSubscription(orgId, plan);
        const invoice = await this._createInvoice(orgId, {
            subscriptionId: sub.id,
            amount: PLAN_PRICES_USD[plan],
            description: `Abonnement ${plan} — Carte (simulation)`,
            paymentMethod: "CARD",
            paymentRef: `CARD-SIM-${Date.now()}`,
        });

        return { subscription: sub, invoice, simulated: true };
    }

    // ── Helpers privés ────────────────────────────────────────────────────────

    private async _verifyKkiapayTransaction(transactionId: string): Promise<KkiapayVerifyResponse> {
        const secretKey = process.env.KKIAPAY_SECRET_KEY;
        const privateKey = process.env.KKIAPAY_PRIVATE_KEY;

        if (!secretKey) throw new Error("KKIAPAY_SECRET_KEY manquant dans les variables d'environnement");

        const baseUrl = process.env.KKIAPAY_API_URL ?? "https://api.kkiapay.me";

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

        return response.json() as Promise<KkiapayVerifyResponse>;
    }

    private async _upsertSubscription(orgId: string, plan: Plan) {
        const now = new Date();
        const end = new Date(now);
        end.setMonth(end.getMonth() + 1);

        return prisma.subscription.upsert({
            where: { organizationId: orgId },
            update: { plan, status: "ACTIVE", updatedAt: now, currentPeriodEnd: end },
            create: {
                organizationId: orgId,
                plan,
                status: "ACTIVE",
                currentPeriodStart: now,
                currentPeriodEnd: end,
            },
        });
    }

    private async _getOrCreateSubscription(orgId: string) {
        const existing = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
        if (existing) return existing;

        const now = new Date();
        const end = new Date(now);
        end.setMonth(end.getMonth() + 1);

        return prisma.subscription.create({
            data: {
                organizationId: orgId,
                plan: "STARTER",
                status: "ACTIVE",
                currentPeriodStart: now,
                currentPeriodEnd: end,
            },
        });
    }

    private async _createInvoice(orgId: string, data: {
        subscriptionId: string;
        amount: number;
        description: string;
        paymentMethod: PaymentMethod;
        paymentRef?: string;
    }) {
        const count = await prisma.invoice.count({ where: { organizationId: orgId } });
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

        return prisma.invoice.create({
            data: {
                invoiceNumber,
                amount: data.amount,
                description: data.description,
                paymentMethod: data.paymentMethod,
                paymentRef: data.paymentRef,
                organizationId: orgId,
                subscriptionId: data.subscriptionId,
                status: "PAID",
                paidAt: new Date(),
                dueDate: new Date(),
            },
        });
    }
}
