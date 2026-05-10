import { Request, Response } from "express";
import { CommunicationRepository } from "../infrastructure/communication.repository";
import { PostType } from "@prisma/client";

const repo = new CommunicationRepository();

export class CommunicationController {
    async getPosts(req: Request, res: Response): Promise<void> {
        const page = parseInt(req.query.page as string) || 1;
        const data = await repo.getPosts(req.user!.organizationId!, page);
        res.json(data);
    }

    async createPost(req: Request, res: Response): Promise<void> {
        try {
        const post = await repo.createPost(
            req.user!.organizationId!,
            req.user!.userId,
            { ...req.body, type: req.body.type as PostType }
        );
        res.status(201).json(post);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async toggleLike(req: Request, res: Response): Promise<void> {
        const result = await repo.toggleLike(req.params.id as string, req.user!.userId);
        res.json(result);
    }

    async addComment(req: Request, res: Response): Promise<void> {
        try {
        const comment = await repo.addComment(
            req.params.id as string, req.user!.userId, req.body.content as string
        );
        res.status(201).json(comment);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async vote(req: Request, res: Response): Promise<void> {
        try {
        await repo.vote(req.params.id as string, req.user!.userId);
        res.json({ success: true });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }
}