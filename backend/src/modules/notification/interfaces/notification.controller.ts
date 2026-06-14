import { Request, Response } from "express";
import { NotificationRepository } from "../infrastructure/notification.repository";
import { NotificationType } from "@prisma/client";

const repo = new NotificationRepository();

export class NotificationController {
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
}
