import { z } from "zod";

export const generateTicketSchema = z.object({
    offerId:        z.string().uuid("offerId invalide"),
    familyMemberId: z.string().uuid("familyMemberId invalide").optional(),
    expiresAt:      z.coerce.date().optional(),
});

export const validateTicketSchema = z.object({
    code: z.string().min(1, "Code requis"),
});
