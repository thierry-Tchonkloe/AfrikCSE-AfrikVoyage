import { NotificationType } from "@/types";

/** Libellés FR affichés pour chaque type de notification (filtres, badges) */
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
    APPROVAL_REQUEST: "Demandes à approuver",
    REQUEST_APPROVED: "Demandes approuvées",
    REQUEST_REJECTED: "Demandes rejetées",
    TRIP_REMINDER: "Rappels de voyage",
    NEW_EVENT: "Événements",
    MESSAGE_RECEIVED: "Messages",
    SYSTEM_UPDATE: "Communication CSE",
};

export const NOTIFICATION_TYPE_OPTIONS: { value: NotificationType | ""; label: string }[] = [
    { value: "", label: "Toutes les notifications" },
    ...Object.entries(NOTIFICATION_TYPE_LABELS).map(([value, label]) => ({
        value: value as NotificationType,
        label,
    })),
];
