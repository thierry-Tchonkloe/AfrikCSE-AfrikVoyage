import { z } from "zod";

export const createPostSchema = z.object({
    type: z.enum(["ARTICLE", "POLL", "EVENT_ANNOUNCEMENT"], {
        error: () => ({ message: "Type de publication invalide" }),
    }),
    title: z.string().min(1).optional(),
    content: z.string().min(1, "Contenu requis"),
    imageUrl: z.string().optional(),
    pollOptions: z.array(z.string().min(1)).optional(),
});

export const addCommentSchema = z.object({
    content: z.string().min(1, "Commentaire vide"),
});

export type CreatePostDto = z.infer<typeof createPostSchema>;
export type AddCommentDto = z.infer<typeof addCommentSchema>;
