import { z } from "zod";

// Champs "cible" mutuellement exclusifs : une réservation pointe soit vers une
// offre CSE (offerId), soit vers UNE SEULE entité du catalogue voyage — jamais
// plusieurs à la fois. Prisma ne modélise pas les FK exclusives nativement,
// donc c'est vérifié ici (superRefine) plutôt qu'en base.
const TARGET_FIELDS = ["offerId", "flightRouteId", "hotelRoomTypeId", "trainRouteId", "carRentalVehicleId"] as const;

export const createBookingSchema = z.object({
    partnerId:          z.string().cuid(),
    offerId:            z.string().cuid().optional(),
    locationId:         z.string().cuid().optional(),
    travelRequestId:    z.string().cuid().optional(),
    flightRouteId:      z.string().cuid().optional(),
    hotelRoomTypeId:    z.string().cuid().optional(),
    trainRouteId:       z.string().cuid().optional(),
    carRentalVehicleId: z.string().cuid().optional(),
    bookingDate:    z.string().datetime(),
    numberOfPersons: z.number().int().min(1).default(1),
    notes:          z.string().optional(),
    idempotencyKey: z.string().min(8),
    paymentMethod:  z.enum(["WALLET", "MOBILE_MONEY", "CARD"]),
    amount:         z.number().positive(),
}).superRefine((data, ctx) => {
    const setCount = TARGET_FIELDS.filter((f) => data[f] !== undefined).length;
    if (setCount > 1) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Une réservation ne peut cibler qu'une seule offre/entité du catalogue à la fois",
            path: ["offerId"],
        });
    }
});

export const rateSchema = z.object({
    score:   z.number().int().min(1).max(5),
    comment: z.string().optional(),
});

export const rejectSchema = z.object({
    reason: z.string().min(1),
});
