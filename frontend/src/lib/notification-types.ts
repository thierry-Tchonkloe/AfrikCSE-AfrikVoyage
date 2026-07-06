import { NotificationType } from "@/types";

/** Libellés FR affichés pour chaque type de notification (filtres, badges) */
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
    APPROVAL_REQUEST:       "Demandes à approuver",
    REQUEST_APPROVED:       "Demandes approuvées",
    REQUEST_REJECTED:       "Demandes rejetées",
    TRIP_REMINDER:          "Rappels de voyage",
    NEW_EVENT:              "Événements",
    MESSAGE_RECEIVED:       "Messages",
    SYSTEM_UPDATE:          "Communication CSE",
    NEW_PARTNER_OFFER:      "Offres partenaires",
    PHOTO_PENDING_MODERATION: "Photos en attente",
    BOOKING_CONFIRMED:      "Réservation confirmée",
    BOOKING_CANCELLED:      "Réservation annulée",
    BOOKING_COMPLETED:      "Réservation complétée",
    BOOKING_REJECTED:       "Réservation refusée",
    WALLET_CREDITED:        "Wallet crédité",
    CASHBACK_CREDITED:      "Cashback crédité",
    ORDER_CONFIRMED:        "Commande confirmée",
    ORDER_CANCELLED:        "Commande annulée",
};

export const NOTIFICATION_TYPE_OPTIONS: { value: NotificationType | ""; label: string }[] = [
    { value: "", label: "Toutes les notifications" },
    ...Object.entries(NOTIFICATION_TYPE_LABELS).map(([value, label]) => ({
        value: value as NotificationType,
        label,
    })),
];
