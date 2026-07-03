import { z } from "zod";

const faqFields = {
    answer:   z.string().min(1, "Réponse requise"),
    category: z.string().optional(),
    order:    z.number().int().optional(),
    status:   z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
};

export const createFaqSchema = z.object({
    question: z.string().min(1, "Question requise"),
    ...faqFields,
});

export const updateFaqSchema = z.object({
    question: z.string().min(1).optional(),
    ...faqFields,
});

export const voteSchema = z.object({
    helpful: z.boolean(),
});
