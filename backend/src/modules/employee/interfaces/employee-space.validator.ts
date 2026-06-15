import { z } from "zod";

export const createTravelRequestSchema = z.object({
    destination: z.string().min(1, "Destination requise"),
    purpose: z.string().optional(),
    departureDate: z.coerce.date(),
    returnDate: z.coerce.date(),
    estimatedCost: z.number().nonnegative().optional(),
    department: z.string().optional(),
}).refine((data) => data.returnDate >= data.departureDate, {
    message: "La date de retour doit être après la date de départ",
    path: ["returnDate"],
});

export const createExpenseSchema = z.object({
    title: z.string().min(1, "Titre requis"),
    amount: z.number().positive("Montant invalide"),
    destination: z.string().optional(),
    description: z.string().optional(),
    department: z.string().optional(),
    category: z.string().optional(),
    paymentMethod: z.string().optional(),
    expenseDate: z.coerce.date().optional(),
    departureDate: z.coerce.date().optional(),
    returnDate: z.coerce.date().optional(),
    travelId: z.string().optional(),
    receipts: z.array(z.string()).optional(),
});

export const submitBenefitRequestSchema = z.object({
    categoryId: z.string().min(1, "Catégorie requise"),
    amount: z.number().positive("Montant invalide"),
    description: z.string().optional(),
    urgency: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    receipts: z.array(z.string()).optional(),
});

export const updateProfileSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
    jobTitle: z.string().optional(),
    department: z.string().optional(),
    avatar: z.string().optional(),
    timezone: z.string().optional(),
    dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).optional(),
    notificationPreferences: z.object({
        email: z.boolean(),
        travelAlerts: z.boolean(),
        cseUpdates: z.boolean(),
        systemUpdates: z.boolean(),
    }).partial().optional(),
});

export const addDocumentSchema = z.object({
    name: z.string().min(1, "Nom requis"),
    url: z.string().min(1, "URL requise"),
    type: z.string().min(1, "Type requis"),
    size: z.string().optional(),
});

export type CreateTravelRequestDto = z.infer<typeof createTravelRequestSchema>;
export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
export type SubmitBenefitRequestDto = z.infer<typeof submitBenefitRequestSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type AddDocumentDto = z.infer<typeof addDocumentSchema>;
