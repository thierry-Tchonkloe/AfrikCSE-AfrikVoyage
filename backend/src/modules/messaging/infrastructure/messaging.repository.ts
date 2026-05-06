import { prisma } from "../../../core/config/prisma";

export class MessagingRepository {
    async getConversations(userId: string) {
        return prisma.conversation.findMany({
        where: {
            participants: { some: { userId } },
        },
        include: {
            participants: {
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
            },
            },
            messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            },
        },
        orderBy: { updatedAt: "desc" },
        });
    }

    async getMessages(conversationId: string, page = 1, limit = 30) {
        const skip = (page - 1) * limit;
        return prisma.message.findMany({
        where: { conversationId },
        include: {
            sender: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
        });
    }

    async sendMessage(conversationId: string, senderId: string, content: string) {
        const [msg] = await prisma.$transaction([
        prisma.message.create({
            data: { conversationId, senderId, content },
            include: {
            sender: { select: { id: true, firstName: true, lastName: true } },
            },
        }),
        prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        }),
        ]);
        return msg;
    }

    async createConversation(orgId: string, participantIds: string[]) {
        return prisma.conversation.create({
        data: {
            organizationId: orgId,
            participants: {
            create: participantIds.map((userId) => ({ userId })),
            },
        },
        include: { participants: true },
        });
    }

    async markAsRead(conversationId: string, userId: string) {
        return prisma.conversationParticipant.updateMany({
        where: { conversationId, userId },
        data: { lastReadAt: new Date() },
        });
    }
}