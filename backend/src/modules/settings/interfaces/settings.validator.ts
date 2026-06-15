import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide (format hex #RRGGBB)");

export const updateSettingsSchema = z.object({
    logoUrl: z.string().optional(),
    primaryColor: hexColor.optional(),
    secondaryColor: hexColor.optional(),
    darkModeEnabled: z.boolean().optional(),
    manualValidation: z.boolean().optional(),
    autoRegistration: z.boolean().optional(),
    defaultHasCSE: z.boolean().optional(),
    defaultHasVoyage: z.boolean().optional(),
    notifyOnValidation: z.boolean().optional(),
    notifyOnRejection: z.boolean().optional(),
    notifyWelcome: z.boolean().optional(),
});

export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>;
