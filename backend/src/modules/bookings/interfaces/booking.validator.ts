import { z } from "zod";

export const createBookingSchema = z.object({
    partnerId:      z.string().cuid(),
    offerId:        z.string().cuid().optional(),
    locationId:     z.string().cuid().optional(),
    bookingDate:    z.string().datetime(),
    numberOfPersons: z.number().int().min(1).default(1),
    notes:          z.string().optional(),
    idempotencyKey: z.string().min(8),
    paymentMethod:  z.enum(["WALLET", "MOBILE_MONEY", "CARD"]),
    amount:         z.number().positive(),
});

export const rateSchema = z.object({
    score:   z.number().int().min(1).max(5),
    comment: z.string().optional(),
});

export const rejectSchema = z.object({
    reason: z.string().min(1),
});
