import { z } from "zod";

export const generateTicketSchema = z.object({
    offerId:        z.string().uuid("offerId invalide"),
    familyMemberId: z.string().uuid("familyMemberId invalide").optional(),
    expiresAt:      z.coerce.date().optional(),
});

export const validateTicketSchema = z.object({
    code: z.string().min(1, "Code requis"),
});

// Paramètre de route GET /:code — nom différent de "id", donc idParamString
// (qui attend la clé "id") ne s'applique pas ; petit schéma local dédié.
export const codeParamSchema = z.object({
    code: z.string().min(1, "Code requis"),
});
export type CodeParam = z.infer<typeof codeParamSchema>;
