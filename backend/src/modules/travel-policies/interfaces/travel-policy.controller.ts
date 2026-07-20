import { Request, Response } from "express";
import { TravelPolicyService } from "../application/travel-policy.service";
import { createTravelPolicySchema, updateTravelPolicySchema } from "./travel-policy.validator";
import { IdParamString } from "../../../core/validators/param.validators";

const service = new TravelPolicyService();

export class TravelPolicyController {
    async list(req: Request, res: Response): Promise<void> {
        const policies = await service.list(req.user!.organizationId!);
        res.json(policies);
    }

    async getById(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            const policy = await service.getById(req.params.id, req.user!.organizationId!);
            res.json(policy);
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }

    async create(req: Request, res: Response): Promise<void> {
        const parsed = createTravelPolicySchema.safeParse(req.body);
        if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
        try {
            const policy = await service.create(req.user!.organizationId!, req.user!.userId, parsed.data as any);
            res.status(201).json(policy);
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }

    async update(req: Request<IdParamString>, res: Response): Promise<void> {
        const parsed = updateTravelPolicySchema.safeParse(req.body);
        if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
        try {
            const policy = await service.update(req.params.id, req.user!.organizationId!, parsed.data as any);
            res.json(policy);
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }

    async delete(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            await service.delete(req.params.id, req.user!.organizationId!);
            res.json({ message: "Politique supprimée" });
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }
}
