import { prisma } from "../../../core/config/prisma";
import { PostType } from "@prisma/client";

export class CommunicationRepository {
    async getPosts(orgId: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
        prisma.csePost.findMany({
            where: { organizationId: orgId },
            include: {
            author: { select: { firstName: true, lastName: true, role: true, jobTitle: true } },
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
    }) {
        const { pollOptions, ...rest } = data;

        return prisma.csePost.create({
        data: {
            ...rest,
            organizationId: orgId,
            authorId,
            pollOptions: pollOptions?.length
            ? { create: pollOptions.map((label) => ({ label })) }
            : undefined,
        },
        include: {
            author: { select: { firstName: true, lastName: true, role: true } },
            pollOptions: true,
        },
        });
    }

    async toggleLike(postId: string, userId: string) {
        const existing = await prisma.postLike.findUnique({
        where: { postId_userId: { postId, userId } },
        });

        if (existing) {
        await prisma.postLike.delete({ where: { id: existing.id } });
        return { liked: false };
        }

        await prisma.postLike.create({ data: { postId, userId } });
        return { liked: true };
    }

    async vote(pollOptionId: string, userId: string) {
        // Un seul vote par sondage
        const option = await prisma.pollOption.findUnique({ where: { id: pollOptionId } });
        if (!option) throw new Error("Option introuvable");

        // Vérifie si déjà voté sur ce sondage
        const existingVote = await prisma.pollVote.findFirst({
        where: {
            userId,
            pollOption: { postId: option.postId },
        },
        });

        if (existingVote) throw new Error("Vous avez déjà voté");

        return prisma.pollVote.create({ data: { pollOptionId, userId } });
    }

    async addComment(postId: string, authorId: string, content: string) {
        return prisma.postComment.create({
        data: { postId, authorId, content },
        include: {
            author: { select: { firstName: true, lastName: true } },
        },
        });
    }
}