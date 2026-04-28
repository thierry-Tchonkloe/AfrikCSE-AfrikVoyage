// modules/contact/interfaces/contact.validator.ts

import { z } from "zod";

export const createContactSchema = z.object({
    fullName: z.string().min(2, "Nom trop court"),
    company: z.string().min(1, "Entreprise requise"),
    email: z.string().email("Email invalide"),
    phone: z.string().optional().default(""),
    companySize: z.string().optional().default(""),
    message: z.string().min(10, "Message trop court (10 caractères min)"),
    acceptMarketing: z.boolean().optional().default(false),
});

export const updateStatusSchema = z.object({
    status: z.enum(["PENDING", "IN_PROGRESS", "DONE"], {
        error: () => ({ message: "Statut invalide" }),
    }),
});

export type CreateContactDTO = z.infer<typeof createContactSchema>;
export type UpdateStatusDTO = z.infer<typeof updateStatusSchema>;