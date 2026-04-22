import { z } from "zod";

/**
 * Création d'un user par un admin
 * Pas de mot de passe ici — un email d'invitation sera envoyé
 * Le user définira son mot de passe via le flow reset-password
 */
export const createUserSchema = z.object({
    email: z.string().email("Email invalide"),
    firstName: z.string().min(1, "Prénom requis"),
    lastName: z.string().min(1, "Nom requis"),
    role: z.enum(["MANAGER", "RH", "FINANCE", "EMPLOYE"]),
    jobTitle: z.string().optional(),
    department: z.string().optional(),
    phone: z.string().optional(),
    managerId: z.string().optional(),
});

export const updateUserSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    jobTitle: z.string().optional(),
    department: z.string().optional(),
    phone: z.string().optional(),
    managerId: z.string().optional(),
});

export const changeRoleSchema = z.object({
    role: z.enum(["MANAGER", "RH", "FINANCE", "EMPLOYE"]),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type ChangeRoleDto = z.infer<typeof changeRoleSchema>;