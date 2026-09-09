import { Booking } from "@/types";

/**
 * Libellé lisible d'une réservation à partir des relations structurées
 * (flightRoute/hotelRoomType/trainRoute/carRentalVehicle/offer) — jamais de
 * `notes`, qui est un champ de commentaire libre et ne doit pas porter
 * l'information métier (cf. nettoyage du couplage historique notes/catalogue).
 */
export function getBookingLabel(
    b: Pick<Booking, "offer" | "flightRoute" | "hotelRoomType" | "trainRoute" | "carRentalVehicle" | "partner">
): string {
    if (b.flightRoute) return `Vol ${b.flightRoute.originCity} → ${b.flightRoute.destinationCity}`;
    if (b.hotelRoomType) return `${b.hotelRoomType.hotel.name} — ${b.hotelRoomType.name}`;
    if (b.trainRoute) return `Train ${b.trainRoute.originCity} → ${b.trainRoute.destinationCity}`;
    if (b.carRentalVehicle) return `${b.carRentalVehicle.brand} ${b.carRentalVehicle.model}`;
    return b.offer?.title ?? b.partner?.name ?? "Réservation";
}
