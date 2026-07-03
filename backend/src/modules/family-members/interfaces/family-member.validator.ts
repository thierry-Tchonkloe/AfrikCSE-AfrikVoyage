import { z } from "zod";

export const createFamilyMemberSchema = z.object({
    firstName:    z.string().min(1, "Prénom requis"),
    lastName:     z.string().min(1, "Nom requis"),
    relationship: z.enum(["SPOUSE", "CHILD", "PARENT", "SIBLING", "OTHER"]),
    birthDate:    z.coerce.date().optional(),
    documentUrl:  z.string().url().optional(),
});

export const updateFamilyMemberSchema = createFamilyMemberSchema.partial();
