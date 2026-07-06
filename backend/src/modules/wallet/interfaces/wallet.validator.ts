import { z } from "zod";

export const allocateSchema = z.object({
    userIds:     z.array(z.string().uuid()).min(1, "Au moins un salarié requis"),
    amount:      z.number().positive("Le montant doit être positif"),
    period:      z.string().min(1, "La période est requise"),  // ex: "2026-07" ou "Rentrée scolaire"
    description: z.string().optional(),
    expiresAt:   z.string().datetime().optional(),
});

export type AllocateInput = z.infer<typeof allocateSchema>;
