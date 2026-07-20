import { Request, Response, NextFunction } from "express";
import { OrderService } from "../application/order.service";
import { MarketplacePaymentService } from "../../../core/services/marketplace-payment.service";
import type { FedapayWebhookEvent, KkiapayWebhookEvent } from "../../../core/services/marketplace-payment.service";
import { createOrderSchema } from "./order.validator";
import { IdParamString } from "../../../core/validators/param.validators";

const service    = new OrderService();
const paySvc     = new MarketplacePaymentService();

export class OrderController {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, organizationId } = req.user!;
            if (!organizationId) { res.status(400).json({ message: "Organisation requise" }); return; }
            const parsed = createOrderSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            const order = await service.create(userId, organizationId, parsed.data);
            res.status(201).json(order);
        } catch (err) { next(err); }
    }

    async getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, organizationId } = req.user!;
            if (!organizationId) { res.status(400).json({ message: "Organisation requise" }); return; }
            const page  = parseInt(req.query.page  as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            res.json(await service.getMyOrders(userId, organizationId, page, limit));
        } catch (err) { next(err); }
    }

    async getById(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId } = req.user!;
            res.json(await service.getOrderById(req.params.id, userId));
        } catch (err) { next(err); }
    }

    async cancel(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, organizationId } = req.user!;
            if (!organizationId) { res.status(400).json({ message: "Organisation requise" }); return; }
            res.json(await service.cancelOrder(req.params.id, userId, organizationId));
        } catch (err) { next(err); }
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    async getAllForAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { status, paymentStatus, organizationId, partnerId, from, to } = req.query;
            const page  = parseInt(req.query.page  as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            res.json(await service.getAllForAdmin({
                status:         status         as never,
                paymentStatus:  paymentStatus  as never,
                organizationId: organizationId as string | undefined,
                partnerId:      partnerId      as string | undefined,
                from:           from ? new Date(from as string) : undefined,
                to:             to   ? new Date(to   as string) : undefined,
                page, limit,
            }));
        } catch (err) { next(err); }
    }

    // ── Webhooks ──────────────────────────────────────────────────────────────

    async webhookKkiapay(req: Request, res: Response): Promise<void> {
        const signature = (req.headers["x-kkiapay-signature"] ?? "") as string;
        if (!paySvc.verifyKkiapayWebhookSignature(req.body, signature)) {
            res.status(401).json({ message: "Signature invalide" });
            return;
        }
        const event = req.body as KkiapayWebhookEvent;
        if (event.eventType !== "SUCCESSFUL_PAYMENT") {
            res.json({ ignored: true });
            return;
        }
        const result = await service.confirmFromWebhook(event.transactionId);
        res.json(result);
    }

    async webhookFedapay(req: Request, res: Response): Promise<void> {
        const token = (req.headers["authorization"] ?? "").toString().replace("Bearer ", "");
        if (!paySvc.verifyFedapayWebhookToken(token)) {
            res.status(401).json({ message: "Token invalide" });
            return;
        }
        const event = req.body as FedapayWebhookEvent;
        if (event.name !== "transaction.approved") {
            res.json({ ignored: true, event: event.name });
            return;
        }
        const transactionRef = String(event.data.object.id);
        const result = await service.confirmFromWebhook(transactionRef);
        res.json(result);
    }
}
