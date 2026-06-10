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

// Champs d'informations générales modifiables — exclut volontairement
// status, plan, hasVoyage/hasCSE, slug et autres champs sensibles qui
// disposent de leurs propres routes/contrôles dédiés.
export const updateOrgSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().nullable().optional(),
    businessEmail: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    postalCode: z.string().nullable().optional(),
    region: z.string().nullable().optional(),
    industry: z.string().nullable().optional(),
    size: z.string().nullable().optional(),
}).strict();

export type ValidateOrgDto = z.infer<typeof validateOrgSchema>;
export type RejectOrgDto = z.infer<typeof rejectOrgSchema>;
export type UpdateModulesDto = z.infer<typeof updateModulesSchema>;
export type UpdateOrgDto = z.infer<typeof updateOrgSchema>;