import { prisma } from "../../../core/config/prisma";
import { PostType } from "@prisma/client";

export class CommunicationRepository {
    async getPosts(orgId: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
        prisma.csePost.findMany({
            where: { organizationId: orgId },
            include: {
            author: { select: { firstName: true, lastName: true, avatar: true, role: true, jobTitle: true } },
            _count: { select: { likes: true, comments: true } },
            pollOptions: {
                include: { _count: { select: { votes: true } } },
            },
            likes: { select: { userId: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.csePost.count({ where: { organizationId: orgId } }),
        ]);

        return { posts, total, page, totalPages: Math.ceil(total / limit) };
    }

    async createPost(orgId: string, authorId: string, data: {
        type: PostType;
        title?: string;
        content: string;
        imageUrl?: string;
        pollOptions?: string[];
        idempotencyKey: string;
    }) {
        const { pollOptions, ...rest } = data;
        const include = {
            author: { select: { firstName: true, lastName: true, avatar: true, role: true } },
            pollOptions: true,
        } as const;

        // Anti-retry : une publication déjà émise avec cette idempotencyKey est
        // renvoyée telle quelle — évite de re-notifier toute l'organisation.
        const existing = await prisma.csePost.findUnique({
            where: { idempotencyKey: data.idempotencyKey },
            include,
        });
        if (existing) return { post: existing, created: false };

        const post = await prisma.csePost.create({
        data: {
            ...rest,
            organizationId: orgId,
            authorId,
            pollOptions: pollOptions?.length
            ? { create: pollOptions.map((label) => ({ label })) }
            : undefined,
        },
        include,
        });
        return { post, created: true };
    }

    /**
     * `action` omis : bascule (comportement historique, non idempotent — un retry
     * réseau après un like réussi peut l'annuler). `action` fourni ("like"/"unlike") :
     * force l'état demandé, idempotent — un retry ne fait que confirmer le même état.
     */
    async toggleLike(postId: string, userId: string, organizationId: string, action?: "like" | "unlike") {
        const post = await prisma.csePost.findFirst({ where: { id: postId, organizationId } });
        if (!post) throw new Error("Publication introuvable");

        const existing = await prisma.postLike.findUnique({
        where: { postId_userId: { postId, userId } },
        });

        if (action === "like") {
        if (!existing) {
            try {
            await prisma.postLike.create({ data: { postId, userId } });
            } catch (err: any) {
            if (err?.code !== "P2002") throw err; // déjà liké par une requête concurrente — état final identique
            }
        }
        return { liked: true };
        }
        if (action === "unlike") {
        if (existing) await prisma.postLike.delete({ where: { id: existing.id } });
        return { liked: false };
        }

        if (existing) {
        await prisma.postLike.delete({ where: { id: existing.id } });
        return { liked: false };
        }

        await prisma.postLike.create({ data: { postId, userId } });
        return { liked: true };
    }

    async vote(pollOptionId: string, userId: string, organizationId: string) {
        // Un seul vote par sondage — vérifie aussi que l'option appartient à l'org
        const option = await prisma.pollOption.findFirst({
        where: { id: pollOptionId, post: { organizationId } },
        });
        if (!option) throw new Error("Option introuvable");

        // L'unicité "1 vote par sondage" est appliquée par la contrainte DB
        // @@unique([postId, userId]) sur PollVote, pas par ce check applicatif —
        // deux votes concurrents sur des options différentes du même sondage ne
        // peuvent donc jamais tous les deux réussir, contrairement à un simple
        // findFirst-puis-create.
        try {
        return await prisma.pollVote.create({
            data: { pollOptionId, postId: option.postId, userId },
        });
        } catch (err: any) {
        if (err?.code === "P2002") throw new Error("Vous avez déjà voté pour ce sondage");
        throw err;
        }
    }

    async addComment(postId: string, authorId: string, content: string, organizationId: string) {
        const post = await prisma.csePost.findFirst({ where: { id: postId, organizationId } });
        if (!post) throw new Error("Publication introuvable");

        return prisma.postComment.create({
        data: { postId, authorId, content },
        include: {
            author: { select: { firstName: true, lastName: true, avatar: true } },
        },
        });
    }

    async getComments(postId: string, organizationId: string) {
        const post = await prisma.csePost.findFirst({ where: { id: postId, organizationId } });
        if (!post) throw new Error("Publication introuvable");

        return prisma.postComment.findMany({
        where: { postId },
        include: {
            author: { select: { firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" },
        });
    }
}