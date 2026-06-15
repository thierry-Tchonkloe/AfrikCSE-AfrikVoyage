import { EventRepository } from "../infrastructure/event.repository";
import { sendMail } from "../../../core/services/email.service";
import { eventReminderEmail } from "../../../core/mailer/email.templates";
import { logger } from "../../../core/utils/logger";

const repo = new EventRepository();

const ONE_HOUR_MS = 60 * 60 * 1000;
const REMINDER_WINDOW_START_MS = 23 * ONE_HOUR_MS;
const REMINDER_WINDOW_END_MS = 25 * ONE_HOUR_MS;

/** Envoie un rappel par email aux participants dont l'événement démarre dans 23 à 25h */
async function sendEventReminders() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + REMINDER_WINDOW_START_MS);
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_END_MS);

    const registrations = await repo.getUpcomingForReminder(windowStart, windowEnd);

    for (const registration of registrations) {
        const { subject, html } = eventReminderEmail({
            firstName: registration.user.firstName,
            eventTitle: registration.event.title,
            startDate: registration.event.startDate,
            location: registration.event.location ?? undefined,
        });
        await sendMail({ to: registration.user.email, subject, html });
        await repo.markReminderSent(registration.id);
    }
}

/** Démarre la tâche planifiée qui envoie les rappels d'événements 24h avant leur début */
export function startEventReminderJob() {
    sendEventReminders().catch((err) => logger.error({ err }, "Échec de l'envoi des rappels d'événements"));
    setInterval(() => {
        sendEventReminders().catch((err) => logger.error({ err }, "Échec de l'envoi des rappels d'événements"));
    }, ONE_HOUR_MS);
}
