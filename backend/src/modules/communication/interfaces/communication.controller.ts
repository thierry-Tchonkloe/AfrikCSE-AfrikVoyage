import { Request, Response } from "express";
import { CommunicationRepository } from "../infrastructure/communication.repository";
import { NotificationRepository } from "../../notification/infrastructure/notification.repository";
import { PostType } from "@prisma/client";
import { createPostSchema, addCommentSchema } from "./communication.validator";
import { IdParamString } from "../../../core/validators/param.validators";

const repo = new CommunicationRepository();
const notificationRepo = new NotificationRepository();

const POST_TYPE_LABELS: Record<PostType, string> = {
    ARTICLE: "Nouvelle publication CSE",
    POLL: "Nouveau sondage CSE",
    EVENT_ANNOUNCEMENT: "Nouvelle annonce CSE",
};

export class CommunicationController {
    async getPosts(req: Request, res: Response): Promise<void> {
        const page = parseInt(req.query.page as string) || 1;
        const data = await repo.getPosts(req.user!.organizationId!, page);
        res.json(data);
    }

    async createPost(req: Request, res: Response): Promise<void> {
        const parsed = createPostSchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }
        try {
        const post = await repo.createPost(
            req.user!.organizationId!,
            req.user!.userId,
            { ...parsed.data, type: parsed.data.type as PostType }
        );

        if (["ADMIN", "MANAGER", "RH"].includes(req.user!.role)) {
            const title = post.title || POST_TYPE_LABELS[post.type];
            const body  = post.content.length > 140 ? `${post.content.slice(0, 140)}…` : post.content;
            await notificationRepo.createForOrg(req.user!.organizationId!, title, body, "SYSTEM_UPDATE", req.user!.userId, "/employes/communication");
        }

        res.status(201).json(post);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async toggleLike(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
        const result = await repo.toggleLike(req.params.id, req.user!.userId, req.user!.organizationId!);
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async addComment(req: Request<IdParamString>, res: Response): Promise<void> {
        const parsed = addCommentSchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }
        try {
        const comment = await repo.addComment(
            req.params.id, req.user!.userId, parsed.data.content, req.user!.organizationId!
        );
        res.status(201).json(comment);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async vote(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
        await repo.vote(req.params.id, req.user!.userId, req.user!.organizationId!);
        res.json({ success: true });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async getComments(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
        const comments = await repo.getComments(req.params.id, req.user!.organizationId!);
        res.json(comments);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }
}