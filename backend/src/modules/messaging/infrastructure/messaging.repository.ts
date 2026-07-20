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
import { ConversationStatus } from "@prisma/client";

export class MessagingRepository {
    /**
     * Conversations d'un utilisateur normal (employé/admin entreprise)
     * Filtrées par organisation
     */
    async getConversationsByOrg(orgId: string, userId: string) {
        const convs = await prisma.conversation.findMany({
        where: { organizationId: orgId },
        include: {
            participants: {
            include: {
                user: {
                select: {
                    id: true, firstName: true, lastName: true, role: true, lastLoginAt: true,
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
        return this.attachUnreadCounts(convs, userId);
    }

    /**
     * Toutes les conversations (Super Admin uniquement), paginées
     * Filtrables par nom d'organisation (search) et par statut
     */
    async getAllConversations(userId: string, params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: ConversationStatus;
    }) {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 20;
        const skip = (page - 1) * limit;

        const baseWhere: any = {};
        if (params?.search) {
        baseWhere.organization = { name: { contains: params.search, mode: "insensitive" } };
        }

        const where = { ...baseWhere };
        if (params?.status) where.status = params.status;

        const [convs, total, openCount, resolvedCount] = await Promise.all([
        prisma.conversation.findMany({
            where,
            include: {
            participants: {
                include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, role: true, lastLoginAt: true },
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
            skip,
            take: limit,
        }),
        prisma.conversation.count({ where }),
        prisma.conversation.count({ where: { ...baseWhere, status: "OPEN" } }),
        prisma.conversation.count({ where: { ...baseWhere, status: "RESOLVED" } }),
        ]);

        const conversations = await this.attachUnreadCounts(convs, userId);
        return {
        conversations,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        openCount,
        resolvedCount,
        };
    }

    /**
     * Ajoute le nombre de messages non lus par `userId` à chaque conversation
     */
    private async attachUnreadCounts<
        T extends { id: string; participants: { userId: string; lastReadAt: Date | null }[] }
    >(conversations: T[], userId: string): Promise<(T & { unreadCount: number })[]> {
        return Promise.all(
        conversations.map(async (conv) => {
            const participant = conv.participants.find((p) => p.userId === userId);
            const unreadCount = await prisma.message.count({
            where: {
                conversationId: conv.id,
                senderId: { not: userId },
                createdAt: participant?.lastReadAt ? { gt: participant.lastReadAt } : undefined,
            },
            });
            return { ...conv, unreadCount };
        })
        );
    }

    /**
     * Change le statut résolu/ouvert d'une conversation (Super Admin)
     */
    async updateStatus(conversationId: string, status: ConversationStatus) {
        return prisma.conversation.update({
        where: { id: conversationId },
        data: { status },
        });
    }

    /** Un utilisateur ne peut lire/écrire que les conversations dont il est participant (anti-IDOR) */
    async isParticipant(conversationId: string, userId: string): Promise<boolean> {
        const p = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
        });
        return !!p;
    }

    /** Retourne `null` si `userId` n'est pas participant de la conversation */
    async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
        if (!(await this.isParticipant(conversationId, userId))) return null;

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

    /** Retourne `null` si `senderId` n'est pas participant de la conversation */
    async sendMessage(conversationId: string, senderId: string, content: string) {
        if (!(await this.isParticipant(conversationId, senderId))) return null;

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

    /** Récupère les autres participants d'une conversation (pour notification) */
    async getOtherParticipants(conversationId: string, excludeUserId: string) {
        const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId, userId: { not: excludeUserId } },
        include: { user: { select: { id: true, role: true } } },
        });
        return participants.map((p) => p.user);
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