import { Request, Response } from "express";
import { EventPhotoService } from "../application/event-photo.service";
import { uploadPhotoSchema, moderateSchema, EventIdParam } from "./event-photo.validator";
import { IdParamString } from "../../../core/validators/param.validators";

const service = new EventPhotoService();

const ADMIN_ROLES = ["ADMIN", "MANAGER", "SUPER_ADMIN"];

export class EventPhotoController {
    async listByEvent(req: Request<EventIdParam>, res: Response): Promise<void> {
        const isAdmin = ADMIN_ROLES.includes(req.user!.role);
        const photos = await service.listByEvent(req.params.eventId, req.user!.organizationId!, isAdmin);
        res.json(photos);
    }

    async upload(req: Request, res: Response): Promise<void> {
        const parsed = uploadPhotoSchema.safeParse(req.body);
        if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
        try {
            const photo = await service.upload({
                ...parsed.data,
                organizationId: req.user!.organizationId!,
                uploadedBy:     req.user!.userId,
            });
            res.status(201).json(photo);
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }

    async moderate(req: Request<IdParamString>, res: Response): Promise<void> {
        const parsed = moderateSchema.safeParse(req.body);
        if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
        try {
            const photo = await service.moderate(req.params.id, req.user!.organizationId!, parsed.data.status);
            res.json(photo);
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }

    async delete(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            const isAdmin = ADMIN_ROLES.includes(req.user!.role);
            await service.delete(req.params.id, req.user!.organizationId!, req.user!.userId, isAdmin);
            res.json({ message: "Photo supprimée" });
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }

    async like(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            const result = await service.toggleLike(req.params.id, req.user!.organizationId!, req.user!.userId);
            res.json(result);
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }

    async pendingCount(req: Request, res: Response): Promise<void> {
        const count = await service.getPendingCount(req.user!.organizationId!);
        res.json({ count });
    }
}
