import { z } from "zod";

export const createRuleSchema = z.object({
    type:           z.enum(["MERCHANT", "EMPLOYER", "HYBRID", "CAMPAIGN"]),
    rate:           z.number().min(0).max(1),
    fixedAmount:    z.number().positive().optional(),
    maxPerEmployee: z.number().positive().optional(),
    maxPerPeriod:   z.number().positive().optional(),
    startDate:      z.string().datetime().optional(),
    endDate:        z.string().datetime().optional(),
    category:       z.string().optional(),
    partnerId:      z.string().uuid().optional(),
    currencyCode:   z.string().default("XOF"),
});

export const updateRuleSchema = createRuleSchema.partial().extend({
    isActive: z.boolean().optional(),
});
