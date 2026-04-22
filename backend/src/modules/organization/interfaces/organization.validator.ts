import { z } from "zod";

export const validateOrgSchema = z.object({
    // Modules à activer lors de la validation
    hasVoyage: z.boolean().default(false),
    hasCSE: z.boolean().default(false),
});

export const rejectOrgSchema = z.object({
    // Raison obligatoire pour traçabilité
    rejectionNote: z.string().min(10, "Précisez la raison du refus (min 10 caractères)"),
});

export const updateModulesSchema = z.object({
    hasVoyage: z.boolean(),
    hasCSE: z.boolean(),
});

export type ValidateOrgDto = z.infer<typeof validateOrgSchema>;
export type RejectOrgDto = z.infer<typeof rejectOrgSchema>;
export type UpdateModulesDto = z.infer<typeof updateModulesSchema>;