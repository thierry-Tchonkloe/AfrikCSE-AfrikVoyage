import { z } from "zod";

// Param unique du segment `/locations/:locationId/...` (nom différent de "id" -> schéma local dédié)
export const locationIdParamSchema = z.object({ locationId: z.string().min(1) });
export type LocationIdParam = z.infer<typeof locationIdParamSchema>;

export const loginSchema = z.object({
    email:    z.string().email(),
    password: z.string().min(8),
});

export const createStaffSchema = z.object({
    email:     z.string().email(),
    password:  z.string().min(8),
    firstName: z.string().min(1),
    lastName:  z.string().min(1),
});

export const updateProfileSchema = z.object({
    name:         z.string().min(1).optional(),
    sector:       z.string().min(1).optional(),
    description:  z.string().optional(),
    contactEmail: z.string().email().optional(),
    phone:        z.string().optional(),
    websiteUrl:   z.string().url().optional(),
    notes:        z.string().optional(),
    logoUrl:      z.string().url().optional(),
});

// Whitelist de domaines Google Maps — empêche tout lien javascript:/URI arbitraire (XSS/open-redirect).
const googleMapsUrlRegex = /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i;

export const locationSchema = z.object({
    name:      z.string().min(1),
    address:   z.string().min(1),
    city:      z.string().min(1),
    country:   z.string().optional(),
    phone:     z.string().optional(),
    isMain:    z.boolean().optional(),
    mapsUrl:   z.string().url().regex(googleMapsUrlRegex, "Lien Google Maps invalide").optional(),
    latitude:  z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
});

export const availabilitySlotSchema = z.object({
    dayOfWeek:     z.number().int().min(0).max(6).optional(),
    openTime:      z.string().regex(/^\d{2}:\d{2}$/),
    closeTime:     z.string().regex(/^\d{2}:\d{2}$/),
    isClosed:      z.boolean().optional(),
    exceptionDate: z.string().datetime().optional(),
    note:          z.string().optional(),
});

export const setAvailabilitiesSchema = z.object({
    slots: z.array(availabilitySlotSchema),
});

export const createOfferSchema = z.object({
    title:          z.string().min(1),
    description:    z.string().optional(),
    imageUrl:       z.string().url().optional(),
    category:       z.string().min(1),
    employeePrice:  z.number().min(0),
    companyPrice:   z.number().min(0),
    subsidyPct:     z.number().int().min(0).max(100).default(0),
    stock:          z.number().int().positive().optional(),
    validUntil:     z.string().datetime().optional(),
    requiresTicket: z.boolean().optional(),
    city:           z.string().optional(),
    region:         z.string().optional(),
    country:        z.string().optional(),
});

// ── Paramètres ────────────────────────────────────────────────────────────

export const SUPPORTED_CURRENCIES = ["XOF", "GHS", "NGN", "EUR", "USD"] as const;

export const updateCurrencySchema = z.object({
    currencyCode: z.enum(SUPPORTED_CURRENCIES),
});

export const updateApiIntegrationSchema = z.object({
    apiEnabled: z.boolean().optional(),
    apiBaseUrl: z.string().url().optional(),
    apiFormat:  z.string().min(1).max(40).optional(),
    // Omis = clé inchangée. N'est jamais renvoyée en clair par l'API (voir hasApiKey).
    apiKey:     z.string().min(8).max(500).optional(),
});

export const paymentMethodTypeSchema = z.enum(["MOBILE_MONEY", "BANK_TRANSFER", "OTHER"]);

export const paymentMethodSchema = z.object({
    type:     paymentMethodTypeSchema,
    provider: z.string().min(2).max(60),
    label:    z.string().min(2).max(60),
    // Contenu sensible (numéro, IBAN...) — jamais stocké en clair, voir service.createPaymentMethod.
    details:  z.record(z.string(), z.string().min(1).max(200)).refine(
        (o) => Object.keys(o).length > 0,
        "Au moins un champ de détail est requis"
    ),
});

export const updatePaymentMethodSchema = z.object({
    label:    z.string().min(2).max(60).optional(),
    isActive: z.boolean().optional(),
    details:  z.record(z.string(), z.string().min(1).max(200)).optional(),
});
