import { prisma } from "../../../core/config/prisma";
import { NotificationType, Role } from "@prisma/client";
import { sendMail } from "../../../core/services/email.service";
import { genericNotificationEmail } from "../../../core/mailer/email.templates";

interface NotificationPreferences {
    email: boolean;
    travelAlerts: boolean;
    cseUpdates: boolean;
    systemUpdates: boolean;
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    email: true,
    travelAlerts: true,
    cseUpdates: true,
    systemUpdates: true,
};

function parseNotificationPreferences(value: unknown): NotificationPreferences {
    if (value && typeof value === "object") {
        return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(value as Partial<NotificationPreferences>) };
    }
    return DEFAULT_NOTIFICATION_PREFERENCES;
}

/** Types non-critiques, soumis aux préférences de notification de l'utilisateur */
const PREFERENCE_KEY_BY_TYPE: Partial<Record<NotificationType, keyof NotificationPreferences>> = {
    TRIP_REMINDER: "travelAlerts",
    NEW_EVENT: "cseUpdates",
    SYSTEM_UPDATE: "systemUpdates",
};

export class NotificationRepository {
    async createForUsers(
        userIds: string[],
        title: string,
        body: string,
        type: NotificationType = "SYSTEM_UPDATE",
        link?: string
    ) {
        if (!userIds.length) return;

        const preferenceKey = PREFERENCE_KEY_BY_TYPE[type];
        let targetUserIds = userIds;
        let emailRecipients: string[] = [];

        if (preferenceKey) {
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, email: true, notificationPreferences: true },
            });

            targetUserIds = [];
            for (const user of users) {
                const prefs = parseNotificationPreferences(user.notificationPreferences);
                if (!prefs[preferenceKey]) continue;
                targetUserIds.push(user.id);
                if (prefs.email) emailRecipients.push(user.email);
            }

            if (!targetUserIds.length) return;
        }

        await prisma.notification.createMany({
        data: targetUserIds.map((userId) => ({ userId, title, body, type, link })),
        });

        if (emailRecipients.length) {
            const { subject, html } = genericNotificationEmail({ title, body, link });
            await sendMail({ to: emailRecipients, subject, html });
        }
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
