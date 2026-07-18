import { z } from "zod";

export const createSubsidyRuleSchema = z.object({
    label:          z.string().min(1, "Libellé requis"),
    category:       z.string().optional(),
    offerType:      z.enum(["VOUCHER", "BOOKING", "DISCOUNT_CODE"]).optional(),
    subsidyPct:     z.number().int().min(0).max(100).optional(),
    subsidyAmount:  z.number().min(0).optional(),
    currencyCode:   z.string().length(3).optional(),
    maxPerEmployee: z.number().min(0).optional(),
    startsAt:       z.coerce.date().optional(),
    endsAt:         z.coerce.date().optional(),
    isActive:       z.boolean().optional(),
    priority:       z.number().int().min(0).optional(),
});

export const updateSubsidyRuleSchema = createSubsidyRuleSchema.partial();
