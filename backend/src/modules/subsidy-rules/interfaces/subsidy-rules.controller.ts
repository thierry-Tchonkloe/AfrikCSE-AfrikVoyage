import { Request, Response } from "express";
import { SubsidyRulesRepository } from "../infrastructure/subsidy-rules.repository";
import { createSubsidyRuleSchema, updateSubsidyRuleSchema } from "./subsidy-rules.validator";
import { IdParamString } from "../../../core/validators/param.validators";

const repo = new SubsidyRulesRepository();

export class SubsidyRulesController {
    async getAll(req: Request, res: Response): Promise<void> {
        try {
            const rules = await repo.findAll(req.user!.organizationId!);
            res.json(rules);
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }

    async getById(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            const rule = await repo.findById(req.params.id, req.user!.organizationId!);
            if (!rule) { res.status(404).json({ message: "Règle introuvable" }); return; }
            res.json(rule);
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        const parsed = createSubsidyRuleSchema.safeParse(req.body);
        if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
        try {
            const rule = await repo.create(req.user!.organizationId!, parsed.data);
            res.status(201).json(rule);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async update(req: Request<IdParamString>, res: Response): Promise<void> {
        const parsed = updateSubsidyRuleSchema.safeParse(req.body);
        if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
        try {
            const rule = await repo.update(req.params.id, req.user!.organizationId!, parsed.data);
            if (!rule) { res.status(404).json({ message: "Règle introuvable" }); return; }
            res.json(rule);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async remove(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            const result = await repo.delete(req.params.id, req.user!.organizationId!);
            if (!result) { res.status(404).json({ message: "Règle introuvable" }); return; }
            res.json({ success: true });
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }
}
