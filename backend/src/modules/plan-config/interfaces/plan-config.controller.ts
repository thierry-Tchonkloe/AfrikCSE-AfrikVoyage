import { Request, Response } from "express";
import { PlanConfigService } from "../application/plan-config.service";
import { createPlanConfigSchema, updatePlanConfigSchema } from "./plan-config.validator";

const service = new PlanConfigService();

export class PlanConfigController {
    async getAll(_req: Request, res: Response): Promise<void> {
        const plans = await service.getAll();
        res.json(plans);
    }

    async getPublic(_req: Request, res: Response): Promise<void> {
        const plans = await service.getPublic();
        res.json(plans);
    }

    async getById(req: Request, res: Response): Promise<void> {
        try {
            const plan = await service.getById(req.params.id as string);
            res.json(plan);
        } catch (err: any) {
            res.status(404).json({ message: err.message });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        const parsed = createPlanConfigSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const plan = await service.create(parsed.data);
            res.status(201).json(plan);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        const parsed = updatePlanConfigSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const plan = await service.update(req.params.id as string, parsed.data);
            res.json(plan);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async delete(req: Request, res: Response): Promise<void> {
        try {
            await service.delete(req.params.id as string);
            res.json({ message: "Plan supprimé" });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }
}
