import { Request, Response } from "express";
import { BillingRepository } from "../infrastructure/billing.repository";
import { Plan } from "@prisma/client";

const repo = new BillingRepository();

// Prix par plan (en centimes)
const PLAN_PRICES: Record<Plan, number> = {
    STARTER:    0,
    BUSINESS:   29900,  // 299€/mois
    ENTERPRISE: 49900,  // 499€/mois
};

export class BillingController {
    async getSubscription(req: Request, res: Response): Promise<void> {
        const sub = await repo.getSubscription(req.user!.organizationId!);
        res.json(sub);
    }

    async upgradePlan(req: Request, res: Response): Promise<void> {
        try {
        const { plan } = req.body as { plan: Plan };
        const sub = await repo.createOrUpdateSubscription(
            req.user!.organizationId!, plan
        );
        // Mettre à jour le plan de l'organisation
        res.json(sub);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async getInvoices(req: Request, res: Response): Promise<void> {
        const invoices = await repo.getInvoices(req.user!.organizationId!);
        res.json(invoices);
    }

    /**
     * Paiement via KkiaPay
     * Flow : frontend initie → KkiaPay widget → callback webhook → on confirme
     */
    async payWithKkiapay(req: Request, res: Response): Promise<void> {
        const { plan, transactionId } = req.body;
        try {
        // TODO: Vérifier le transactionId avec l'API KkiaPay
        // GET https://api.kkiapay.me/api/v1/transactions/{id}/status
        const sub = await repo.createOrUpdateSubscription(
            req.user!.organizationId!, plan as Plan
        );
        await repo.createInvoice(req.user!.organizationId!, {
            subscriptionId: sub.id,
            amount: PLAN_PRICES[plan as Plan] / 100,
            description: `Abonnement ${plan}`,
            paymentMethod: "KKIAPAY",
            paymentRef: transactionId,
        });
        res.json({ success: true, message: "Paiement KkiaPay confirmé" });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    /**
     * Paiement via FedaPay
     * Flow : créer transaction FedaPay → retourner checkout_url → webhook confirm
     */
    async payWithFedapay(req: Request, res: Response): Promise<void> {
        const { plan } = req.body;
        try {
        // TODO: Appel API FedaPay pour créer la transaction
        // POST https://api.fedapay.com/v1/transactions
        const amount = PLAN_PRICES[plan as Plan];
        res.json({
            checkoutUrl: `https://checkout.fedapay.com/pay/demo?amount=${amount}`,
            message: "Redirection FedaPay",
        });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    /**
     * Paiement par carte (Stripe ou équivalent)
     * À implémenter avec Stripe Elements côté frontend
     */
    async payWithCard(_req: Request, res: Response): Promise<void> {
        //const { plan, paymentMethodId } = req.body;
        try {
        // TODO: Intégration Stripe
        // const paymentIntent = await stripe.paymentIntents.create(...)
        res.json({
            clientSecret: "pi_demo_secret",
            message: "Stripe payment intent créé",
        });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }
}