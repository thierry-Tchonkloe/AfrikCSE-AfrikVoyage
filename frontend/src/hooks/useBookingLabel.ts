"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import type { Booking } from "@/types";

type BookingLabelInput = Pick<Booking, "offer" | "flightRoute" | "hotelRoomType" | "trainRoute" | "carRentalVehicle" | "partner">;

/**
 * Libellé lisible d'une réservation à partir des relations structurées
 * (flightRoute/hotelRoomType/trainRoute/carRentalVehicle/offer) — jamais de
 * `notes`, qui est un champ de commentaire libre et ne doit pas porter
 * l'information métier (cf. nettoyage du couplage historique notes/catalogue).
 */
export function useBookingLabel() {
    const t = useTranslations("common.bookingLabel");
    return useCallback(
        (b: BookingLabelInput): string => {
            if (b.flightRoute) return t("flight", { origin: b.flightRoute.originCity, destination: b.flightRoute.destinationCity });
            if (b.hotelRoomType) return `${b.hotelRoomType.hotel.name} — ${b.hotelRoomType.name}`;
            if (b.trainRoute) return t("train", { origin: b.trainRoute.originCity, destination: b.trainRoute.destinationCity });
            if (b.carRentalVehicle) return `${b.carRentalVehicle.brand} ${b.carRentalVehicle.model}`;
            return b.offer?.title ?? b.partner?.name ?? t("booking");
        },
        [t]
    );
}
