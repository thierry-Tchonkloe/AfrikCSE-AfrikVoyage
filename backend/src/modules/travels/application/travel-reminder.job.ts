import { TravelRepository } from "../infrastructure/travel.repository";
import { NotificationRepository } from "../../notification/infrastructure/notification.repository";
import { logger } from "../../../core/utils/logger";

const repo = new TravelRepository();
const notificationRepo = new NotificationRepository();

const ONE_HOUR_MS = 60 * 60 * 1000;
const REMINDER_WINDOW_START_MS = 23 * ONE_HOUR_MS;
const REMINDER_WINDOW_END_MS = 25 * ONE_HOUR_MS;

/** Crée une notification in-app pour les voyages approuvés démarrant dans 23 à 25h */
async function sendTripReminders() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + REMINDER_WINDOW_START_MS);
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_END_MS);

    const trips = await repo.getUpcomingForReminder(windowStart, windowEnd);

    for (const trip of trips) {
        const dateLabel = trip.departureDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
        await notificationRepo.createForUsers(
            [trip.requestedById],
            "Rappel de voyage",
            `Votre voyage vers ${trip.destination} part le ${dateLabel}.`,
            "TRIP_REMINDER",
            "/employes/voyages"
        );
        await repo.markReminderSent(trip.id);
    }
}

/** Démarre la tâche planifiée qui envoie les rappels de voyage 24h avant le départ */
export function startTripReminderJob() {
    sendTripReminders().catch((err) => logger.error({ err }, "Échec de l'envoi des rappels de voyage"));
    setInterval(() => {
        sendTripReminders().catch((err) => logger.error({ err }, "Échec de l'envoi des rappels de voyage"));
    }, ONE_HOUR_MS);
}
