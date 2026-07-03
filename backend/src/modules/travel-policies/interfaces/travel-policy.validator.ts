import { z } from "zod";

const budgetFields = {
    description:           z.string().optional(),
    isDefault:             z.boolean().optional(),
    isActive:              z.boolean().optional(),
    maxFlightBudget:       z.number().positive().nullable().optional(),
    maxHotelBudgetPerNight: z.number().positive().nullable().optional(),
    maxDailyAllowance:     z.number().positive().nullable().optional(),
    currency:              z.string().default("XOF"),
    allowedFlightClass:    z.enum(["ECONOMY", "BUSINESS", "FIRST"]).nullable().optional(),
    maxAdvanceBookingDays: z.number().int().positive().nullable().optional(),
    requiresApproval:      z.boolean().optional(),
    approvalThreshold:     z.number().positive().nullable().optional(),
    allowedDestinations:   z.array(z.string()).optional(),
    restrictedDestinations: z.array(z.string()).optional(),
    appliesToDepartments:  z.array(z.string()).optional(),
};

export const createTravelPolicySchema = z.object({
    name: z.string().min(1, "Nom requis"),
    ...budgetFields,
});

export const updateTravelPolicySchema = z.object({
    name: z.string().min(1).optional(),
    ...budgetFields,
});
