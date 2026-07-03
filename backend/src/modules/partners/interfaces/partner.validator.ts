import { z } from "zod";

export const createPartnerSchema = z.object({
    name:            z.string().min(2, "Nom requis"),
    sector:          z.string().min(2, "Secteur requis"),
    logoUrl:         z.string().url().optional(),
    contactEmail:    z.string().email().optional(),
    websiteUrl:      z.string().url().optional(),
    notes:           z.string().optional(),
    status:          z.enum(["DRAFT", "ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
    scopeType:       z.enum(["CSE", "VOYAGE", "BOTH"]).optional(),
    apiEnabled:      z.boolean().optional(),
    apiBaseUrl:      z.string().url().optional(),
    apiKey:          z.string().optional(),
    apiFormat:       z.enum(["REST", "GRAPHQL"]).optional(),
    syncFrequencyH:  z.number().int().min(1).max(168).optional(),
    isGlobal:        z.boolean().optional(),
    organizationIds: z.array(z.string()).optional(),
});

export const updatePartnerSchema = createPartnerSchema.partial();

export const filterPartnerSchema = z.object({
    status:    z.enum(["DRAFT", "ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
    scopeType: z.enum(["CSE", "VOYAGE", "BOTH"]).optional(),
    search:    z.string().optional(),
    page:      z.coerce.number().int().min(1).optional(),
    limit:     z.coerce.number().int().min(1).max(100).optional(),
});
