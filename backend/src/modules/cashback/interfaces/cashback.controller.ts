import { Request, Response, NextFunction } from "express";
import { CashbackService } from "../application/cashback.service";
import { createRuleSchema, updateRuleSchema } from "./cashback.validator";
import { IdParamString } from "../../../core/validators/param.validators";

const service = new CashbackService();

export class CashbackController {
    async listRules(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { organizationId, isHost } = req.user!;
            const orgId = isHost ? null : organizationId;
            res.json(await service.listRules(orgId ?? organizationId ?? ""));
        } catch (err) { next(err); }
    }

    async createRule(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { organizationId, isHost } = req.user!;
            const parsed = createRuleSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            const orgId = isHost ? null : organizationId;
            res.status(201).json(await service.createRule(orgId, parsed.data));
        } catch (err) { next(err); }
    }

    async updateRule(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { organizationId, isHost } = req.user!;
            const parsed = updateRuleSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            const orgId = isHost ? null : organizationId;
            res.json(await service.updateRule(req.params.id, orgId, parsed.data));
        } catch (err) { next(err); }
    }

    async deleteRule(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { organizationId, isHost } = req.user!;
            const orgId = isHost ? null : organizationId;
            await service.deleteRule(req.params.id, orgId);
            res.status(204).end();
        } catch (err) { next(err); }
    }

    async listMyTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId } = req.user!;
            const page  = parseInt(req.query.page  as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            res.json(await service.listMyTransactions(userId, page, limit));
        } catch (err) { next(err); }
    }

    async listTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { organizationId } = req.user!;
            const page  = parseInt(req.query.page  as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            res.json(await service.listTransactions(organizationId ?? "", page, limit));
        } catch (err) { next(err); }
    }

    async listFraudSignals(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const reviewed = req.query.reviewed === "true" ? true : req.query.reviewed === "false" ? false : undefined;
            const page  = parseInt(req.query.page  as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            res.json(await service.listFraudSignals(reviewed, page, limit));
        } catch (err) { next(err); }
    }

    async reviewFraudSignal(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId } = req.user!;
            res.json(await service.reviewFraudSignal(req.params.id, userId));
        } catch (err) { next(err); }
    }
}
