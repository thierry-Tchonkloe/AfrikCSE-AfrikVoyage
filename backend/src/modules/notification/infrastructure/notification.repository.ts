import { prisma } from "../../../core/config/prisma";
import { NotificationType, Role } from "@prisma/client";

export class NotificationRepository {
    async createForUsers(
        userIds: string[],
        title: string,
        body: string,
        type: NotificationType = "SYSTEM_UPDATE",
        link?: string
    ) {
        if (!userIds.length) return;

        await prisma.notification.createMany({
        data: userIds.map((userId) => ({ userId, title, body, type, link })),
        });
    }

    async createForOrg(
        orgId: string,
        title: string,
        body: string,
        type: NotificationType = "SYSTEM_UPDATE",
        excludeUserId?: string,
        link?: string
    ) {
        const users = await prisma.user.findMany({
        where: {
            organizationId: orgId,
            isActive: true,
            ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
        },
        select: { id: true },
        });

        await this.createForUsers(users.map((u) => u.id), title, body, type, link);
    }

    /** Notifie tous les utilisateurs actifs d'une organisation occupant l'un des rôles donnés */
    async createForRoles(
        orgId: string,
        roles: Role[],
        title: string,
        body: string,
        type: NotificationType = "SYSTEM_UPDATE",
        link?: string
    ) {
        const users = await prisma.user.findMany({
        where: { organizationId: orgId, isActive: true, role: { in: roles } },
        select: { id: true },
        });

        await this.createForUsers(users.map((u) => u.id), title, body, type, link);
    }

    async getForUser(userId: string, page = 1, limit = 20, type?: NotificationType) {
        const skip = (page - 1) * limit;
        const where = { userId, ...(type ? { type } : {}) };

        const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.notification.count({ where }),
        ]);

        return { notifications, total, page, totalPages: Math.ceil(total / limit) };
    }

    async getUnreadCount(userId: string) {
        return prisma.notification.count({ where: { userId, read: false } });
    }

    async markAsRead(id: string, userId: string) {
        return prisma.notification.updateMany({
        where: { id, userId },
        data: { read: true },
        });
    }

    async markAllAsRead(userId: string) {
        return prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
        });
    }
}
