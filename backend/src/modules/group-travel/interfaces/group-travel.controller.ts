import { Request, Response } from "express";
import { GroupTravelService } from "../application/group-travel.service";
import {
    createGroupTravelSchema, updateGroupTravelSchema,
    statusSchema, inviteSchema, respondSchema,
} from "./group-travel.validator";
import { IdParamString } from "../../../core/validators/param.validators";

const service = new GroupTravelService();

export class GroupTravelController {
    async list(req: Request, res: Response): Promise<void> {
        const trips = await service.list(req.user!.organizationId!, req.user!.userId);
        res.json(trips);
    }

    async getById(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            const trip = await service.getById(req.params.id, req.user!.organizationId!);
            res.json(trip);
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }

    async create(req: Request, res: Response): Promise<void> {
        const parsed = createGroupTravelSchema.safeParse(req.body);
        if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
        try {
            const trip = await service.create(req.user!.organizationId!, req.user!.userId, parsed.data as any);
            res.status(201).json(trip);
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }

    async update(req: Request<IdParamString>, res: Response): Promise<void> {
        const parsed = updateGroupTravelSchema.safeParse(req.body);
        if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
        try {
            const trip = await service.update(req.params.id, req.user!.organizationId!, req.user!.userId, parsed.data as any);
            res.json(trip);
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }

    async updateStatus(req: Request<IdParamString>, res: Response): Promise<void> {
        const parsed = statusSchema.safeParse(req.body);
        if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
        try {
            const trip = await service.updateStatus(req.params.id, req.user!.organizationId!, req.user!.userId, parsed.data.status);
            res.json(trip);
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }

    async delete(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            await service.delete(req.params.id, req.user!.organizationId!, req.user!.userId);
            res.json({ message: "Voyage supprimé" });
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }

    async invite(req: Request<IdParamString>, res: Response): Promise<void> {
        const parsed = inviteSchema.safeParse(req.body);
        if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
        try {
            const result = await service.invite(req.params.id, req.user!.organizationId!, req.user!.userId, parsed.data.userId);
            res.status(201).json(result);
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }

    async respond(req: Request<IdParamString>, res: Response): Promise<void> {
        const parsed = respondSchema.safeParse(req.body);
        if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
        try {
            const result = await service.respond(req.params.id, req.user!.userId, parsed.data.accept, parsed.data.note);
            res.json(result);
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }
}
