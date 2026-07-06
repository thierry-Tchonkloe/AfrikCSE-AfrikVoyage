import { z } from "zod";

export const createPlanConfigSchema = z.object({
    name: z.string().min(2).max(30).regex(/^[A-Z_]+$/, "Majuscules et underscores uniquement"),
    label: z.string().min(1),
    price: z.string().min(1),
    maxUsers: z.number().int().positive().nullable().optional(),
    hasVoyage: z.boolean().default(false),
    hasCSE: z.boolean().default(false),
    features: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
    pricePerEmployee: z.number().positive().optional(),
    billingCycle:     z.string().optional(),
    apiAccess:        z.boolean().default(false),
    webhookAccess:    z.boolean().default(false),
});

export const updatePlanConfigSchema = z.object({
    label:            z.string().min(1).optional(),
    price:            z.string().min(1).optional(),
    maxUsers:         z.number().int().positive().nullable().optional(),
    hasVoyage:        z.boolean().optional(),
    hasCSE:           z.boolean().optional(),
    features:         z.array(z.string()).optional(),
    isActive:         z.boolean().optional(),
    pricePerEmployee: z.number().positive().optional(),
    billingCycle:     z.string().optional(),
    apiAccess:        z.boolean().optional(),
    webhookAccess:    z.boolean().optional(),
}).strict();

export type CreatePlanConfigDto = z.infer<typeof createPlanConfigSchema>;
export type UpdatePlanConfigDto = z.infer<typeof updatePlanConfigSchema>;
