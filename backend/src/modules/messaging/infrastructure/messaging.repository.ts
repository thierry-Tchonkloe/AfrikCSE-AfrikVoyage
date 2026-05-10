// import { prisma } from "../../../core/config/prisma";

// export class MessagingRepository {
//     async getConversations(userId: string) {
//         return prisma.conversation.findMany({
//         where: {
//             participants: { some: { userId } },
//         },
//         include: {
//             participants: {
//             include: {
//                 user: { select: { id: true, firstName: true, lastName: true } },
//             },
//             },
//             messages: {
//             orderBy: { createdAt: "desc" },
//             take: 1,
//             },
//         },
//         orderBy: { updatedAt: "desc" },
//         });
//     }

//     async getMessages(conversationId: string, page = 1, limit = 30) {
//         const skip = (page - 1) * limit;
//         return prisma.message.findMany({
//         where: { conversationId },
//         include: {
//             sender: { select: { id: true, firstName: true, lastName: true } },
//         },
//         orderBy: { createdAt: "asc" },
//         skip,
//         take: limit,
//         });
//     }

//     async sendMessage(conversationId: string, senderId: string, content: string) {
//         const [msg] = await prisma.$transaction([
//         prisma.message.create({
//             data: { conversationId, senderId, content },
//             include: {
//             sender: { select: { id: true, firstName: true, lastName: true } },
//             },
//         }),
//         prisma.conversation.update({
//             where: { id: conversationId },
//             data: { updatedAt: new Date() },
//         }),
//         ]);
//         return msg;
//     }

//     async createConversation(orgId: string, participantIds: string[]) {
//         return prisma.conversation.create({
//         data: {
//             organizationId: orgId,
//             participants: {
//             create: participantIds.map((userId) => ({ userId })),
//             },
//         },
//         include: { participants: true },
//         });
//     }

//     async markAsRead(conversationId: string, userId: string) {
//         return prisma.conversationParticipant.updateMany({
//         where: { conversationId, userId },
//         data: { lastReadAt: new Date() },
//         });
//     }
// }





import { prisma } from "../../../core/config/prisma";

export class MessagingRepository {
    /**
     * Conversations d'un utilisateur normal (employé/admin entreprise)
     * Filtrées par organisation
     */
    async getConversationsByOrg(orgId: string) {
        return prisma.conversation.findMany({
        where: { organizationId: orgId },
        include: {
            participants: {
            include: {
                user: {
                select: {
                    id: true, firstName: true, lastName: true, role: true,
                },
                },
            },
            },
            messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
                sender: { select: { firstName: true, lastName: true } },
            },
            },
            organization: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        });
    }

    /**
     * Toutes les conversations (Super Admin uniquement)
     * Groupées par organisation
     */
    async getAllConversations() {
        return prisma.conversation.findMany({
        include: {
            participants: {
            include: {
                user: {
                select: { id: true, firstName: true, lastName: true, role: true },
                },
            },
            },
            messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
                sender: { select: { firstName: true, lastName: true } },
            },
            },
            organization: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        });
    }

    async getMessages(conversationId: string, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        return prisma.message.findMany({
        where: { conversationId },
        include: {
            sender: {
            select: {
                id: true, firstName: true, lastName: true, role: true,
            },
            },
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
            sender: {
                select: { id: true, firstName: true, lastName: true, role: true },
            },
            },
        }),
        prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        }),
        ]);
        return msg;
    }

    /**
     * Crée ou récupère la conversation support d'une organisation
     * Une org n'a qu'une seule conversation support
     */
    async getOrCreateSupportConversation(orgId: string, adminUserId: string) {
        // Cherche une conversation existante pour cette org
        const existing = await prisma.conversation.findFirst({
        where: { organizationId: orgId },
        include: { participants: true },
        });

        if (existing) return existing;

        // Récupère tous les Super Admins pour les ajouter à la conversation
        const superAdmins = await prisma.user.findMany({
        where: { role: "SUPER_ADMIN" },
        select: { id: true },
        });

        const participantIds = [
        adminUserId,
        ...superAdmins.map((sa) => sa.id),
        ];

        return prisma.conversation.create({
        data: {
            organizationId: orgId,
            participants: {
            create: [...new Set(participantIds)].map((userId) => ({ userId })),
            },
        },
        include: {
            participants: {
            include: {
                user: { select: { id: true, firstName: true, lastName: true, role: true } },
            },
            },
            organization: { select: { id: true, name: true } },
        },
        });
    }

    async markAsRead(conversationId: string, userId: string) {
        return prisma.conversationParticipant.updateMany({
        where: { conversationId, userId },
        data: { lastReadAt: new Date() },
        });
    }

    async getUnreadCount(userId: string) {
        // Conversations où l'user participe
        const participations = await prisma.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true, lastReadAt: true },
        });

        let unread = 0;
        for (const p of participations) {
        const count = await prisma.message.count({
            where: {
            conversationId: p.conversationId,
            senderId: { not: userId },
            createdAt: p.lastReadAt ? { gt: p.lastReadAt } : undefined,
            },
        });
        unread += count;
        }
        return unread;
    }
}