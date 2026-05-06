import { Request, Response } from "express";
import { MessagingRepository } from "../infrastructure/messaging.repository";

const repo = new MessagingRepository();

export class MessagingController {
    async getConversations(req: Request, res: Response): Promise<void> {
        const convs = await repo.getConversations(req.user!.userId);
        res.json(convs);
    }

    async createConversation(req: Request, res: Response): Promise<void> {
        try {
        const { participantIds } = req.body as { participantIds: string[] };
        const all = [...new Set([req.user!.userId, ...participantIds])];
        const conv = await repo.createConversation(req.user!.organizationId!, all);
        res.status(201).json(conv);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async getMessages(req: Request, res: Response): Promise<void> {
        const page = parseInt(req.query.page as string) || 1;
        const msgs = await repo.getMessages(req.params.id as string, page);
        res.json(msgs);
    }

    async sendMessage(req: Request, res: Response): Promise<void> {
        try {
        const msg = await repo.sendMessage(
            req.params.id as string,
            req.user!.userId,
            req.body.content
        );
        res.status(201).json(msg);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async markAsRead(req: Request, res: Response): Promise<void> {
        await repo.markAsRead(req.params.id as string, req.user!.userId);
        res.json({ success: true });
    }
}