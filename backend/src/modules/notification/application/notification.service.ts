import { NotificationType, NotificationChannel, Role } from "@prisma/client";
import { prisma } from "../../../core/config/prisma";
import { sendMail } from "../../../core/services/email.service";
import { sendSms }  from "../../../core/services/sms.service";
import { NotificationRepository } from "../infrastructure/notification.repository";
import { logger } from "../../../core/utils/logger";

const repo = new NotificationRepository();

interface DispatchContext {
    userId?:  string;
    email?:   string;
    phone?:   string;
    vars?:    Record<string, string>;
    /** Lien de redirection de la notification in-app (ex: "/employes/voyages") — pas
     *  géré par le template (admin-éditable), toujours fourni par l'appelant. */
    link?:    string;
}

function interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

/**
 * Dispatch a notification for a given event to one user.
 * - Looks up the NotificationTemplate for the event.
 * - For each active channel, sends + logs.
 * - Fails silently per channel (never throws).
 */
export async function dispatchNotification(
    event: NotificationType,
    ctx: DispatchContext
): Promise<void> {
    const template = await prisma.notificationTemplate.findUnique({
        where: { event },
    });

    if (!template || !template.isActive) return;

    const vars = ctx.vars ?? {};
    const channels = template.channels as NotificationChannel[];

    for (const channel of channels) {
        try {
            if (channel === "IN_APP" && ctx.userId && template.inAppTitle && template.inAppBody) {
                await repo.createForUsers(
                    [ctx.userId],
                    interpolate(template.inAppTitle, vars),
                    interpolate(template.inAppBody, vars),
                    event,
                    ctx.link,
                );
                await _log({ userId: ctx.userId, email: ctx.email, event, channel, status: "SENT" });

            } else if (channel === "EMAIL" && ctx.email && template.emailSubject && template.emailBody) {
                await sendMail({
                    to:      ctx.email,
                    subject: interpolate(template.emailSubject, vars),
                    html:    interpolate(template.emailBody, vars),
                });
                await _log({ userId: ctx.userId, email: ctx.email, event, channel, status: "SENT" });

            } else if (channel === "SMS" && ctx.phone && template.smsBody) {
                await sendSms({
                    to:      ctx.phone,
                    message: interpolate(template.smsBody, vars),
                });
                await _log({ userId: ctx.userId, email: ctx.email, phone: ctx.phone, event, channel, status: "SENT" });

            } else {
                await _log({ userId: ctx.userId, email: ctx.email, event, channel, status: "SKIPPED" });
            }
        } catch (err) {
            logger.error({ err, event, channel }, "Notification dispatch failed");
            await _log({
                userId: ctx.userId, email: ctx.email, phone: ctx.phone,
                event, channel, status: "FAILED",
                error: err instanceof Error ? err.message : String(err),
            }).catch(() => {});
        }
    }
}

async function _log(data: {
    userId?:  string;
    email?:   string;
    phone?:   string;
    event:    NotificationType;
    channel:  NotificationChannel;
    status:   "SENT" | "FAILED" | "SKIPPED" | "PENDING";
    error?:   string;
}): Promise<void> {
    await prisma.notificationLog.create({
        data: {
            userId:  data.userId,
            email:   data.email,
            phone:   data.phone,
            event:   data.event,
            channel: data.channel,
            status:  data.status,
            error:   data.error,
            sentAt:  data.status === "SENT" ? new Date() : undefined,
        },
    });
}

/* -------------------------------------------------------------------------- */
/* Helpers multi-destinataires                                                */
/* -------------------------------------------------------------------------- */
// `dispatchNotification` opère par destinataire unique (email/téléphone individuels
// requis pour les canaux EMAIL/SMS). Ces helpers retrouvent les destinataires
// (id + email) puis dispatchent un appel par utilisateur — remplace l'ancien
// pattern `notificationRepo.createForUsers/createForOrg/createForRoles` qui
// écrivait un titre/corps codés en dur au lieu de lire un NotificationTemplate.

export async function dispatchNotificationToUsers(
    event: NotificationType,
    userIds: string[],
    vars: Record<string, string> = {},
    link?: string,
): Promise<void> {
    if (!userIds.length) return;
    const users = await prisma.user.findMany({
        where:  { id: { in: userIds } },
        select: { id: true, email: true },
    });
    await Promise.all(users.map((u) => dispatchNotification(event, { userId: u.id, email: u.email, vars, link })));
}

/** Notifie tous les utilisateurs actifs d'une organisation (ex: nouvelle publication CSE). */
export async function dispatchNotificationToOrg(
    event: NotificationType,
    orgId: string,
    vars: Record<string, string> = {},
    excludeUserId?: string,
    link?: string,
): Promise<void> {
    const users = await prisma.user.findMany({
        where: {
            organizationId: orgId,
            isActive: true,
            ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
        },
        select: { id: true, email: true },
    });
    await Promise.all(users.map((u) => dispatchNotification(event, { userId: u.id, email: u.email, vars, link })));
}

/** Notifie les utilisateurs actifs d'une organisation occupant l'un des rôles donnés (ex: approbateurs). */
export async function dispatchNotificationToRoles(
    event: NotificationType,
    orgId: string,
    roles: Role[],
    vars: Record<string, string> = {},
    link?: string,
): Promise<void> {
    const users = await prisma.user.findMany({
        where:  { organizationId: orgId, isActive: true, role: { in: roles } },
        select: { id: true, email: true },
    });
    await Promise.all(users.map((u) => dispatchNotification(event, { userId: u.id, email: u.email, vars, link })));
}
