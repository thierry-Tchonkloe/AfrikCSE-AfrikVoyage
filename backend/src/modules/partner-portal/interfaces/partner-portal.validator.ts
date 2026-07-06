import { z } from "zod";

export const loginSchema = z.object({
    email:    z.string().email(),
    password: z.string().min(8),
});

export const createStaffSchema = z.object({
    email:     z.string().email(),
    password:  z.string().min(8),
    firstName: z.string().min(1),
    lastName:  z.string().min(1),
});

export const updateProfileSchema = z.object({
    contactEmail: z.string().email().optional(),
    websiteUrl:   z.string().url().optional(),
    notes:        z.string().optional(),
    logoUrl:      z.string().url().optional(),
});

export const locationSchema = z.object({
    name:      z.string().min(1),
    address:   z.string().min(1),
    city:      z.string().min(1),
    country:   z.string().optional(),
    phone:     z.string().optional(),
    isMain:    z.boolean().optional(),
});

export const availabilitySlotSchema = z.object({
    dayOfWeek:     z.number().int().min(0).max(6).optional(),
    openTime:      z.string().regex(/^\d{2}:\d{2}$/),
    closeTime:     z.string().regex(/^\d{2}:\d{2}$/),
    isClosed:      z.boolean().optional(),
    exceptionDate: z.string().datetime().optional(),
    note:          z.string().optional(),
});

export const setAvailabilitiesSchema = z.object({
    slots: z.array(availabilitySlotSchema),
});

export const createOfferSchema = z.object({
    title:          z.string().min(1),
    description:    z.string().optional(),
    imageUrl:       z.string().url().optional(),
    category:       z.string().min(1),
    employeePrice:  z.number().min(0),
    companyPrice:   z.number().min(0),
    subsidyPct:     z.number().int().min(0).max(100).default(0),
    stock:          z.number().int().positive().optional(),
    validUntil:     z.string().datetime().optional(),
    requiresTicket: z.boolean().optional(),
    city:           z.string().optional(),
    region:         z.string().optional(),
    country:        z.string().optional(),
});
