import { Request, Response, NextFunction } from "express";
import { OrderService } from "../application/order.service";
import { createOrderSchema } from "./order.validator";

const service = new OrderService();

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

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId } = req.user!;
            res.json(await service.getOrderById(req.params.id as string, userId));
        } catch (err) { next(err); }
    }

    async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, organizationId } = req.user!;
            if (!organizationId) { res.status(400).json({ message: "Organisation requise" }); return; }
            res.json(await service.cancelOrder(req.params.id as string, userId, organizationId));
        } catch (err) { next(err); }
    }
}
