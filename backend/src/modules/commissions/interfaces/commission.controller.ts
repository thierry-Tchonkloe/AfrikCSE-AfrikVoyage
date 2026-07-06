import { Request, Response, NextFunction } from "express";
import { CommissionService } from "../application/commission.service";
import { createRuleSchema, triggerPayoutSchema } from "./commission.validator";
import { CommissionType } from "@prisma/client";

const service = new CommissionService();

export class CommissionController {
    async listRules(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const partnerId = req.query.partnerId as string | undefined;
            res.json(await service.listRules(partnerId));
        } catch (err) { next(err); }
    }

    async createRule(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = createRuleSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            res.status(201).json(await service.createRule({
                ...parsed.data,
                type: parsed.data.type as CommissionType,
            }));
        } catch (err) { next(err); }
    }

    async updateRule(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = createRuleSchema.partial().safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            res.json(await service.updateRule(req.params.id as string, {
                ...parsed.data,
                type: parsed.data.type as CommissionType | undefined,
            }));
        } catch (err) { next(err); }
    }

    async deleteRule(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await service.deleteRule(req.params.id as string);
            res.status(204).send();
        } catch (err) { next(err); }
    }

    async listEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId, organizationId } = req.query as Record<string, string | undefined>;
            const page  = parseInt(req.query.page  as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            res.json(await service.listEntries(partnerId, organizationId, page, limit));
        } catch (err) { next(err); }
    }

    async listPayouts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const partnerId = req.query.partnerId as string | undefined;
            const page  = parseInt(req.query.page  as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            res.json(await service.listPayouts(partnerId, page, limit));
        } catch (err) { next(err); }
    }

    async triggerPayout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId } = req.user!;
            const parsed = triggerPayoutSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            res.status(201).json(await service.triggerPayout(parsed.data.partnerId, parsed.data.period, userId));
        } catch (err) { next(err); }
    }

    async markPayoutPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            res.json(await service.markPayoutPaid(req.params.id as string));
        } catch (err) { next(err); }
    }
}
