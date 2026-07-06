import { Request, Response, NextFunction } from "express";
import { NotificationRepository } from "../infrastructure/notification.repository";
import { NotificationType, NotificationChannel } from "@prisma/client";
import { z } from "zod";

const repo = new NotificationRepository();

const templateSchema = z.object({
    channels:     z.array(z.nativeEnum(NotificationChannel)).optional(),
    emailSubject: z.string().max(255).optional().nullable(),
    emailBody:    z.string().optional().nullable(),
    smsBody:      z.string().max(160).optional().nullable(),
    inAppTitle:   z.string().max(120).optional().nullable(),
    inAppBody:    z.string().max(500).optional().nullable(),
    isActive:     z.boolean().optional(),
});

export class NotificationController {
    // ── Employee ──────────────────────────────────────────────────────────────

    async getMine(req: Request, res: Response): Promise<void> {
        const page = parseInt(req.query.page as string) || 1;
        const type = req.query.type as NotificationType | undefined;
        const data = await repo.getForUser(req.user!.userId, page, 20, type);
        res.json(data);
    }

    async getUnreadCount(req: Request, res: Response): Promise<void> {
        const count = await repo.getUnreadCount(req.user!.userId);
        res.json({ count });
    }

    async markAsRead(req: Request, res: Response): Promise<void> {
        await repo.markAsRead(req.params.id as string, req.user!.userId);
        res.json({ success: true });
    }

    async markAllAsRead(req: Request, res: Response): Promise<void> {
        await repo.markAllAsRead(req.user!.userId);
        res.json({ success: true });
    }

    // ── Templates (SA) ────────────────────────────────────────────────────────

    async listTemplates(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            res.json(await repo.listTemplates());
        } catch (err) { next(err); }
    }

    async upsertTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const event = req.params.event as NotificationType;
            const parsed = templateSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            res.json(await repo.upsertTemplate({ event, ...parsed.data }));
        } catch (err) { next(err); }
    }

    async deleteTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await repo.deleteTemplate(req.params.event as NotificationType);
            res.status(204).send();
        } catch (err) { next(err); }
    }

    // ── Logs (SA) ─────────────────────────────────────────────────────────────

    async listLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page  = parseInt(req.query.page as string) || 1;
            const event = req.query.event as NotificationType | undefined;
            res.json(await repo.listLogs(page, 50, event));
        } catch (err) { next(err); }
    }
}
