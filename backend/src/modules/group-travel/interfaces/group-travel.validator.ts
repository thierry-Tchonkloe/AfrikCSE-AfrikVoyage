import { z } from "zod";

export const createGroupTravelSchema = z.object({
    title:           z.string().min(1, "Titre requis"),
    description:     z.string().optional(),
    destination:     z.string().min(1, "Destination requise"),
    departureDate:   z.coerce.date(),
    returnDate:      z.coerce.date(),
    estimatedCost:   z.number().positive().nullable().optional(),
    maxParticipants: z.number().int().positive().nullable().optional(),
    currency:        z.string().default("XOF"),
    notes:           z.string().optional(),
});

export const updateGroupTravelSchema = createGroupTravelSchema.partial();

export const statusSchema = z.object({
    status: z.enum(["DRAFT", "OPEN", "CONFIRMED", "CANCELLED", "COMPLETED"]),
});

export const inviteSchema = z.object({
    userId: z.string().uuid("userId invalide"),
});

export const respondSchema = z.object({
    accept: z.boolean(),
    note:   z.string().optional(),
});
