import { z } from "zod";

export const createRuleSchema = z.object({
    partnerId:   z.string().cuid().optional(),
    category:    z.string().optional(),
    type:        z.enum(["PERCENTAGE", "FIXED", "MAX_OF_BOTH"]),
    rate:        z.number().min(0).max(1),
    fixedAmount: z.number().min(0).optional(),
    currencyCode: z.string().default("XOF"),
});

export const triggerPayoutSchema = z.object({
    partnerId: z.string().cuid(),
    period:    z.string().regex(/^\d{4}-\d{2}$/, "Format attendu: YYYY-MM"),
});
