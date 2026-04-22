import { z } from "zod";

/** Étape 1 onboarding : informations entreprise + admin */
export const registerCompanySchema = z.object({
    // Informations entreprise
    companyName: z.string().min(2, "Nom requis"),
    businessEmail: z.string().email("Email invalide"),
    country: z.string().min(1, "Pays requis"),
    phone: z.string().min(8, "Téléphone requis"),
    size: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]),
    industry: z.string().min(1, "Secteur requis"),
    address: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    postalCode: z.string().optional(),

    // Plan choisi
    plan: z.enum(["STARTER", "BUSINESS", "ENTERPRISE"]),

    // Modules souhaités (demande, validation par Super Admin)
    requestVoyage: z.boolean().default(false),
    requestCSE: z.boolean().default(false),

    // Informations admin (sera le premier user de l'org)
    adminFirstName: z.string().min(1, "Prénom requis"),
    adminLastName: z.string().min(1, "Nom requis"),
    email: z.string().email("Email admin invalide"),
    adminPassword: z
        .string()
        .min(8, "Mot de passe minimum 8 caractères")
        .regex(/[A-Z]/, "Au moins une majuscule")
        .regex(/[0-9]/, "Au moins un chiffre"),
});

export const loginSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(1, "Mot de passe requis"),
    rememberMe: z.boolean().default(false),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("Email invalide"),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z
        .string()
        .min(8)
        .regex(/[A-Z]/)
        .regex(/[0-9]/),
});

export const completeProfileSchema = z.object({
    jobTitle: z.string().optional(),
    department: z.string().optional(),
    costCenter: z.string().optional(),
    phone: z.string().optional(),
    managerId: z.string().optional(),
});

export type RegisterCompanyDto = z.infer<typeof registerCompanySchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type CompleteProfileDto = z.infer<typeof completeProfileSchema>;