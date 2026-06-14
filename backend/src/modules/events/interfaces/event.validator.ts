import { z } from "zod";

export const createEventSchema = z.object({
    title: z.string().min(1, "Titre requis"),
    description: z.string().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    location: z.string().optional(),
    maxParticipants: z.number().int().positive().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
}).refine((data) => data.endDate >= data.startDate, {
    message: "La date de fin doit être après la date de début",
    path: ["endDate"],
});

export type CreateEventDto = z.infer<typeof createEventSchema>;
