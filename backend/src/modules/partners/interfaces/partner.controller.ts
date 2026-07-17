import { Request, Response } from "express";
import { PartnerService } from "../application/partner.service";
import {
    createPartnerSchema,
    updatePartnerSchema,
    filterPartnerSchema,
} from "./partner.validator";
import { IdParamString } from "../../../core/validators/param.validators";

const service = new PartnerService();

export class PartnerController {
    async list(req: Request, res: Response): Promise<void> {
        const parsed = filterPartnerSchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        const data = await service.list(parsed.data);
        res.json(data);
    }

    async getById(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            const data = await service.getById(req.params.id);
            res.json(data);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        const parsed = createPartnerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const data = await service.create(req.user!.userId, parsed.data);
            res.status(201).json(data);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async update(req: Request<IdParamString>, res: Response): Promise<void> {
        const parsed = updatePartnerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const data = await service.update(req.params.id, parsed.data);
            res.json(data);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async delete(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            await service.delete(req.params.id);
            res.json({ message: "Partenaire supprimé" });
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async sync(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            const result = await service.sync(req.params.id);
            res.json(result);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async getSyncLogs(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            const data = await service.getSyncLogs(req.params.id);
            res.json(data);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }
}
