import { Request, Response } from "express";
import { CommunicationRepository } from "../infrastructure/communication.repository";
import { dispatchNotificationToOrg } from "../../notification/application/notification.service";
import { PostType } from "@prisma/client";
import { createPostSchema, addCommentSchema } from "./communication.validator";
import { IdParamString } from "../../../core/validators/param.validators";

const repo = new CommunicationRepository();

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
        const { post, created } = await repo.createPost(
            req.user!.organizationId!,
            req.user!.userId,
            { ...parsed.data, type: parsed.data.type as PostType }
        );

        // Un retry (idempotencyKey déjà vue) renvoie la publication existante sans
        // renotifier toute l'organisation une 2e fois.
        if (created && ["ADMIN", "MANAGER", "RH"].includes(req.user!.role)) {
            const postTitle = post.title || POST_TYPE_LABELS[post.type];
            const postBody  = post.content.length > 140 ? `${post.content.slice(0, 140)}…` : post.content;
            dispatchNotificationToOrg(
                "SYSTEM_UPDATE",
                req.user!.organizationId!,
                { postTitle, postBody },
                req.user!.userId,
                "/employes/communication"
            ).catch(() => {});
        }

        res.status(201).json(post);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async toggleLike(req: Request<IdParamString>, res: Response): Promise<void> {
        const action = req.body?.action === "like" || req.body?.action === "unlike" ? req.body.action : undefined;
        try {
        const result = await repo.toggleLike(req.params.id, req.user!.userId, req.user!.organizationId!, action);
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