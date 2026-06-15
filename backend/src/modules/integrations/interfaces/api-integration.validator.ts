import { z } from "zod";

export const createApiIntegrationSchema = z.object({
    name: z.string().min(1, "Nom requis"),
    type: z.string().min(1, "Type requis"),
    apiKey: z.string().optional(),
    webhookUrl: z.string().url("URL invalide").optional().or(z.literal("")),
    isActive: z.boolean().optional(),
    syncConfig: z.record(z.string(), z.any()).optional(),
});

export const updateApiIntegrationSchema = z.object({
    name: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
    apiKey: z.string().optional(),
    webhookUrl: z.string().url("URL invalide").optional().or(z.literal("")),
    isActive: z.boolean().optional(),
    syncConfig: z.record(z.string(), z.any()).optional(),
});

export const syncIntegrationSchema = z.object({
    type: z.enum(["AUTOMATIC", "MANUAL"]).default("MANUAL"),
});

export type CreateApiIntegrationDto = z.infer<typeof createApiIntegrationSchema>;
export type UpdateApiIntegrationDto = z.infer<typeof updateApiIntegrationSchema>;
