import { prisma } from "../../../core/config/prisma";
import { Plan, PaymentMethod, Prisma } from "@prisma/client";
import crypto from "node:crypto";
import { WalletRepository } from "../../wallet/infrastructure/wallet.repository";
import { AppError } from "../../../core/errors/app.error";

const walletRepo = new WalletRepository();

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

    async getInvoices(orgId: string) {
        return prisma.invoice.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: "desc" },
        });
    }

    /**
     * Prix réels des plans pour CETTE organisation — contrairement à GET /plans
     * (public, constantes statiques indicatives), reflète le prix XOF dynamique
     * (PlanConfig.pricePerEmployee × employés actifs) réellement utilisé pour
     * le calcul du montant facturé par processKkiapayPayment/initiateFedapayPayment.
     */
    async getResolvedPlansForOrg(orgId: string) {
        const plans: Plan[] = ["STARTER", "BUSINESS", "ENTERPRISE"];
        return Promise.all(plans.map(async (plan) => ({
            plan,
            priceXOF: await this._resolvePlanPriceXOF(orgId, plan),
        })));
    }

    // ── Wallet entreprise (trésorerie servant au remboursement des notes de frais) ──

    async getWalletBalance(orgId: string) {
        const { balance, currencyCode } = await walletRepo.getOrganizationWalletSummary(orgId);
        return { balance: Number(balance), currencyCode };
    }

    /**
     * Rechargement manuel (ADMIN/FINANCE) — pas de passerelle de paiement réelle
     * ici, contrairement à payWithCard/Kkiapay/Fedapay : simple crédit direct du
     * ledger, la clé d'idempotence n'a donc qu'un rôle de garde-fou anti double-clic.
     */
    async topUpWallet(orgId: string, amount: number) {
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new AppError("Le montant doit être un nombre positif", 400);
        }
        const idempotencyKey = crypto.randomUUID();
        const entry = await walletRepo.creditOrganizationWallet(
            orgId,
            new Prisma.Decimal(amount),
            idempotencyKey,
            { description: "Rechargement du portefeuille entreprise", referenceType: "TOPUP" }
        );
        const { balance, currencyCode } = await walletRepo.getOrganizationWalletSummary(orgId);
        return { entry, balance: Number(balance), currencyCode };
    }

    // ── KkiaPay ───────────────────────────────────────────────────────────────
    // Flow : frontend lance le widget KkiaPay → widget retourne un transactionId
    //        → frontend envoie transactionId au backend → on vérifie avec l'API KkiaPay
    //        → si SUCCESS on crée l'abonnement et la facture

    async processKkiapayPayment(orgId: string, plan: Plan, transactionId: string) {
        // 1. Vérifier la transaction avec l'API KkiaPay
        const verified = await this._verifyKkiapayTransaction(transactionId);

        if (verified.status !== "SUCCESS") {
            throw new Error(`Transaction KkiaPay invalide : ${verified.status}${verified.failureMessage ? ` — ${verified.failureMessage}` : ""}`);
        }

        const expectedAmount = await this._resolvePlanPriceXOF(orgId, plan);
        if (expectedAmount > 0 && verified.amount < expectedAmount) {
            throw new Error(`Montant insuffisant : reçu ${verified.amount} XOF, attendu ${expectedAmount} XOF`);
        }

        // 2. Vérifier que ce transactionId n'a pas déjà été utilisé (anti-replay)
        const existing = await prisma.invoice.findFirst({ where: { paymentRef: transactionId } });
        if (existing) throw new Error("Ce transactionId a déjà été utilisé");

        // 3. Créer/mettre à jour l'abonnement et la facture
        // KkiaPay est un gateway XOF exclusivement (le widget est toujours lancé
        // avec un montant XOF plein, cf. billing/page.tsx) — verified.amount est
        // donc déjà la valeur réelle facturée, sans conversion ni division.
        const sub = await this._upsertSubscription(orgId, plan);
        const invoice = await this._createInvoice(orgId, {
            subscriptionId: sub.id,
            amount: verified.amount,
            currency: "XOF",
            description: `Abonnement ${plan} — KkiaPay`,
            paymentMethod: "KKIAPAY",
            paymentRef: transactionId,
        });

        return { subscription: sub, invoice };
    }

    // ── FedaPay ───────────────────────────────────────────────────────────────
    // Flow : backend crée la transaction FedaPay → retourne checkout_url
    //        → frontend redirige l'utilisateur → FedaPay webhook confirme

    async initiateFedapayPayment(orgId: string, plan: Plan) {
        const amount = await this._resolvePlanPriceXOF(orgId, plan);
        if (amount === 0) {
            // Plan gratuit → pas besoin de paiement
            const sub = await this._upsertSubscription(orgId, plan);
            return { checkoutUrl: null, subscription: sub, message: "Plan gratuit activé" };
        }

        // Anti double-clic / retry réseau : si une facture FedaPay PENDING pour ce
        // même plan a été créée il y a moins de 10 min, on rejoue son checkoutUrl
        // au lieu de créer une nouvelle transaction FedaPay + facture orpheline.
        const recentPending = await prisma.invoice.findFirst({
            where: {
                organizationId: orgId,
                paymentMethod:  "FEDAPAY",
                status:         "PENDING",
                description:    { contains: plan },
                createdAt:      { gt: new Date(Date.now() - 10 * 60 * 1000) },
            },
            orderBy: { createdAt: "desc" },
        });
        if (recentPending?.checkoutUrl) {
            return {
                checkoutUrl:    recentPending.checkoutUrl,
                transactionRef: recentPending.paymentRef ?? undefined,
                message:        "Redirection FedaPay (paiement déjà initié)",
            };
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
                currency: { iso: "XOF" },
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

        // Stocker la référence en attente — même montant XOF plein que celui
        // effectivement envoyé à FedaPay ci-dessus (aucune conversion à faire).
        await prisma.invoice.create({
            data: {
                invoiceNumber: `PRE-${reference}`,
                amount,
                currency: "XOF",
                description: `Abonnement ${plan} — FedaPay en attente`,
                paymentMethod: "FEDAPAY",
                paymentRef: String(transaction.id ?? reference),
                checkoutUrl: transaction.payment_url,
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

        // Le plan acheté n'est connu qu'ici (la facture PENDING a été créée avant
        // le paiement, cf. initiateFedapayPayment) — extrait de la description
        // ("Abonnement {PLAN} — FedaPay en attente"), seule source disponible
        // sans champ dédié sur Invoice. Avant ce correctif, le webhook ne faisait
        // que réactiver l'abonnement SANS jamais appliquer le plan acheté.
        const planMatch = invoice.description?.match(/Abonnement (STARTER|BUSINESS|ENTERPRISE)/);
        if (planMatch) {
            await this._upsertSubscription(invoice.organizationId, planMatch[1] as Plan);
        } else {
            await prisma.subscription.update({
                where: { id: invoice.subscriptionId! },
                data: { status: "ACTIVE" },
            });
        }

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

        // Mode dev/test : simuler un paiement réussi, au vrai prix dynamique XOF
        // (pas la constante USD statique — sinon la simulation ne reflète pas ce
        // qu'un paiement KkiaPay/FedaPay réel facturerait pour cette org).
        const sub = await this._upsertSubscription(orgId, plan);
        const invoice = await this._createInvoice(orgId, {
            subscriptionId: sub.id,
            amount: await this._resolvePlanPriceXOF(orgId, plan),
            currency: "XOF",
            description: `Abonnement ${plan} — Carte (simulation)`,
            paymentMethod: "CARD",
            paymentRef: `CARD-SIM-${Date.now()}`,
        });

        return { subscription: sub, invoice, simulated: true };
    }

    // ── Helpers privés ────────────────────────────────────────────────────────

    /**
     * Prix XOF réel d'un plan pour une organisation : PlanConfig.pricePerEmployee
     * (configuré par le Super Admin, prix/employé actif/mois) × nombre d'employés
     * actifs, avec repli sur les constantes historiques PLAN_PRICES_XOF si aucun
     * PlanConfig n'existe pour ce plan ou que pricePerEmployee n'est pas défini.
     * Note : PlanConfig ne stocke qu'un prix en FCFA — les flux USD (PLAN_PRICES_USD)
     * restent donc sur les constantes statiques, faute d'équivalent dynamique.
     */
    private async _resolvePlanPriceXOF(orgId: string, plan: Plan): Promise<number> {
        const config = await prisma.planConfig.findUnique({ where: { name: plan } });
        if (config?.pricePerEmployee != null) {
            const activeEmployees = await prisma.user.count({ where: { organizationId: orgId, isActive: true } });
            return Number(config.pricePerEmployee) * Math.max(activeEmployees, 1);
        }
        return PLAN_PRICES_XOF[plan];
    }

    private async _verifyKkiapayTransaction(transactionId: string): Promise<KkiapayVerifyResponse> {
        const publicKey = process.env.KKIAPAY_PUBLIC_KEY;
        const secretKey = process.env.KKIAPAY_SECRET_KEY;
        const privateKey = process.env.KKIAPAY_PRIVATE_KEY;

        if (!secretKey) throw new Error("KKIAPAY_SECRET_KEY manquant dans les variables d'environnement");

        // Le sandbox KkiaPay est servi par un host distinct de la prod — vérifier
        // une transaction sandbox sur l'host live renvoie 404 (transaction inconnue là-bas).
        const sandbox = process.env.NODE_ENV !== "production";
        const baseUrl = process.env.KKIAPAY_API_URL
            ?? (sandbox ? "https://api-sandbox.kkiapay.me" : "https://api.kkiapay.me");

        // L'API attend un POST avec le transactionId dans le body, pas dans l'URL
        // (endpoint unique /transactions/status, cf. SDK officiel @kkiapay-org/nodejs-sdk).
        const response = await fetch(`${baseUrl}/api/v1/transactions/status`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(publicKey ? { "x-api-key": publicKey } : {}),
                "x-secret-key": secretKey,
                ...(privateKey ? { "x-private-key": privateKey } : {}),
            },
            body: JSON.stringify({ transactionId }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`KkiaPay API error ${response.status} : ${err}`);
        }

        return response.json() as Promise<KkiapayVerifyResponse>;
    }

    /**
     * Écrit Subscription ET Organization.plan dans la même transaction — avant
     * ce correctif, seule Subscription était mise à jour ici : le Dashboard
     * (qui lit Organization.plan) continuait d'afficher l'ancien plan pour
     * toujours après tout upgrade réel via KkiaPay/FedaPay/carte.
     */
    private async _upsertSubscription(orgId: string, plan: Plan) {
        const now = new Date();
        const end = new Date(now);
        end.setMonth(end.getMonth() + 1);

        const [sub] = await prisma.$transaction([
            prisma.subscription.upsert({
                where: { organizationId: orgId },
                update: { plan, status: "ACTIVE", updatedAt: now, currentPeriodEnd: end },
                create: {
                    organizationId: orgId,
                    plan,
                    status: "ACTIVE",
                    currentPeriodStart: now,
                    currentPeriodEnd: end,
                },
            }),
            prisma.organization.update({
                where: { id: orgId },
                data: { plan },
            }),
        ]);

        return sub;
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
        currency: string;
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
                currency: data.currency,
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
