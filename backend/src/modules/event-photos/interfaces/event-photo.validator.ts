import { z } from "zod";

export const uploadPhotoSchema = z.object({
    eventId: z.string().min(1, "eventId requis"),
    url:     z.string().url("URL invalide"),
    caption: z.string().max(300).optional(),
});

export const moderateSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
});
