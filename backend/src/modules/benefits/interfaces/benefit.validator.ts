import { z } from "zod";

export const createBenefitCategorySchema = z.object({
    name: z.string().min(1, "Nom requis"),
    description: z.string().optional(),
    icon: z.string().optional(),
    annualBudget: z.number().nonnegative("Budget invalide"),
    perEmployeeLimit: z.number().nonnegative("Plafond invalide"),
    eligibleServices: z.array(z.string()).default([]),
});

export const updateBenefitCategorySchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    annualBudget: z.number().nonnegative().optional(),
    perEmployeeLimit: z.number().nonnegative().optional(),
    eligibleServices: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});

export const rejectRequestSchema = z.object({
    note: z.string().min(1, "Motif de rejet requis"),
});

export const bulkApproveSchema = z.object({
    ids: z.array(z.string().min(1)).min(1, "Aucune demande sélectionnée"),
});

export type CreateBenefitCategoryDto = z.infer<typeof createBenefitCategorySchema>;
export type UpdateBenefitCategoryDto = z.infer<typeof updateBenefitCategorySchema>;
