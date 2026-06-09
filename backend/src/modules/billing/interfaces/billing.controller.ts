import { Request, Response } from "express";
import { Plan } from "@prisma/client";
import { BillingService, PLAN_PRICES_USD, PLAN_PRICES_XOF, Currency } from "../application/billing.service";

const service = new BillingService();

function isValidPlan(plan: unknown): plan is Plan {
    return typeof plan === "string" && Object.prototype.hasOwnProperty.call(PLAN_PRICES_USD, plan);
}

export class BillingController {

    // ── Abonnement ────────────────────────────────────────────────────────────

    async getSubscription(req: Request, res: Response): Promise<void> {
        const sub = await service.getSubscription(req.user!.organizationId!);
        res.json(sub);
    }

    async upgradePlan(req: Request, res: Response): Promise<void> {
        try {
            const { plan } = req.body as { plan: unknown };
            if (!isValidPlan(plan)) {
                res.status(400).json({ message: "Plan invalide" });
                return;
            }
            const sub = await service.upgradePlan(req.user!.organizationId!, plan);
            res.json(sub);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async getInvoices(req: Request, res: Response): Promise<void> {
        const invoices = await service.getInvoices(req.user!.organizationId!);
        res.json(invoices);
    }

    // ── KkiaPay ───────────────────────────────────────────────────────────────
    // Étape 1 : Le frontend lance le widget KkiaPay avec KKIAPAY_PUBLIC_KEY
    // Étape 2 : Le widget retourne un transactionId
    // Étape 3 : Le frontend appelle cet endpoint avec plan + transactionId
    // Étape 4 : On vérifie auprès de l'API KkiaPay et on active l'abonnement

    async payWithKkiapay(req: Request, res: Response): Promise<void> {
        const { plan, transactionId, currency } = req.body as {
            plan: unknown;
            transactionId: unknown;
            currency?: Currency;
        };

        if (!isValidPlan(plan)) {
            res.status(400).json({ message: "Plan invalide" });
            return;
        }
        if (typeof transactionId !== "string" || !transactionId.trim()) {
            res.status(400).json({ message: "transactionId requis" });
            return;
        }

        try {
            const result = await service.processKkiapayPayment(
                req.user!.organizationId!,
                plan,
                transactionId.trim(),
                currency ?? "XOF"
            );
            res.json({ success: true, message: "Paiement KkiaPay confirmé", ...result });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    // ── FedaPay ───────────────────────────────────────────────────────────────
    // Étape 1 : Le frontend appelle cet endpoint avec le plan désiré
    // Étape 2 : On crée une transaction FedaPay et on retourne checkoutUrl
    // Étape 3 : Le frontend redirige l'utilisateur vers checkoutUrl
    // Étape 4 : FedaPay appelle le webhook backend pour confirmer le paiement

    async payWithFedapay(req: Request, res: Response): Promise<void> {
        const { plan, currency } = req.body as { plan: unknown; currency?: Currency };

        if (!isValidPlan(plan)) {
            res.status(400).json({ message: "Plan invalide" });
            return;
        }

        try {
            const result = await service.initiateFedapayPayment(
                req.user!.organizationId!,
                plan,
                currency ?? "XOF"
            );
            res.json(result);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    // ── Carte prépayée ────────────────────────────────────────────────────────

    async payWithCard(req: Request, res: Response): Promise<void> {
        const { plan, cardNumber, expiry, cvv } = req.body as {
            plan: unknown;
            cardNumber?: string;
            expiry?: string;
            cvv?: string;
        };

        if (!isValidPlan(plan)) {
            res.status(400).json({ message: "Plan invalide" });
            return;
        }

        try {
            const result = await service.processCardPayment(
                req.user!.organizationId!,
                plan,
                { number: cardNumber ?? "", expiry: expiry ?? "", cvv: cvv ?? "" }
            );
            res.json({ success: true, ...result });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    // ── Webhooks ──────────────────────────────────────────────────────────────
    // Ces routes sont publiques (appelées par les passerelles),
    // mais protégées par signature cryptographique.

    async kkiapayWebhook(req: Request, res: Response): Promise<void> {
        const signature = (req.headers["x-kkiapay-signature"] as string) ?? "";
        try {
            const result = await service.handleKkiapayWebhook(req.body, signature);
            res.json(result);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async fedapayWebhook(req: Request, res: Response): Promise<void> {
        const token = (req.headers["x-fedapay-webhook-token"] as string) ?? "";
        try {
            const result = await service.handleFedapayWebhook(req.body, token);
            res.json(result);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    // ── Infos publiques sur les plans ─────────────────────────────────────────

    async getPlans(_req: Request, res: Response): Promise<void> {
        const plans = Object.entries(PLAN_PRICES_USD).map(([plan, usd]) => ({
            plan,
            priceUSD: usd,
            priceXOF: PLAN_PRICES_XOF[plan as Plan],
        }));
        res.json(plans);
    }
}
