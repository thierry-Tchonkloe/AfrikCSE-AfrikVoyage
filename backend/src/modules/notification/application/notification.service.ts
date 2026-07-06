import { NotificationType, NotificationChannel } from "@prisma/client";
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
