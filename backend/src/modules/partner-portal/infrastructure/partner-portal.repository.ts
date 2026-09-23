import { Prisma, PartnerPaymentMethodType } from "@prisma/client";
import { prisma } from "../../../core/config/prisma";
import { AppError } from "../../../core/errors/app.error";

const PAYMENT_METHOD_SELECT = {
    id: true, type: true, provider: true, label: true,
    maskedHint: true, isActive: true, createdAt: true, updatedAt: true,
} satisfies Prisma.PartnerPaymentMethodSelect;

// Jamais `notes` (réservé Super Admin), `apiKeyEncrypted`/`partnerToken`/
// `mobileMoneyNumberEncrypted`/`bankDetailsEncrypted` (secrets chiffrés), ni
// `warningCount`/`flaggedAt` (modération interne) — voir getPartner().
const PARTNER_PROFILE_SELECT = {
    id:           true,
    name:         true,
    sector:       true,
    logoUrl:      true,
    description:  true,
    contactEmail: true,
    phone:        true,
    websiteUrl:   true,
    status:       true,
    scopeType:    true,
    currencyCode: true,
    createdAt:    true,
    updatedAt:    true,
} satisfies Prisma.PartnerSelect;

export class PartnerPortalRepository {
    // ── Auth / PartnerUser ────────────────────────────────────────────────────

    async findUserByEmail(email: string) {
        return prisma.partnerUser.findUnique({
            where: { email },
            include: { partner: { select: { id: true, name: true, status: true, logoUrl: true } } },
        });
    }

    async findUserById(id: string) {
        return prisma.partnerUser.findUnique({
            where: { id },
            include: { partner: true },
        });
    }

    // `select` strict — sans lui, la création d'un compte staff renvoyait le
    // `PartnerUser` complet au client, y compris `passwordHash` (le hash bcrypt
    // du mot de passe qu'on vient de définir pour ce compte), `refreshToken`,
    // `tokenVersion`, `resetPasswordToken`. Même forme que `listStaff()` ci-dessus,
    // pour une réponse cohérente entre création et listing.
    async createUser(data: {
        partnerId:    string;
        email:        string;
        passwordHash: string;
        firstName:    string;
        lastName:     string;
        role?:        "PARTNER_ADMIN" | "PARTNER_STAFF";
        invitedById?: string;
    }) {
        return prisma.partnerUser.create({
            data:   data as never,
            select: {
                id: true, email: true, firstName: true, lastName: true,
                role: true, isActive: true, lastLoginAt: true, createdAt: true,
            },
        });
    }

    async updateUserLastLogin(id: string) {
        return prisma.partnerUser.update({
            where: { id },
            data:  { lastLoginAt: new Date() },
        });
    }

    async listStaff(partnerId: string) {
        return prisma.partnerUser.findMany({
            where:   { partnerId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true, email: true, firstName: true, lastName: true,
                role: true, isActive: true, lastLoginAt: true, createdAt: true,
            },
        });
    }

    async deactivateUser(id: string, partnerId: string) {
        return prisma.partnerUser.update({
            where: { id, partnerId },
            data:  { isActive: false },
        });
    }

    /** Révoque immédiatement tous les tokens émis pour ce PartnerUser (logout) */
    async revokeSessions(id: string) {
        return prisma.partnerUser.update({
            where: { id },
            data:  { refreshToken: null, tokenVersion: { increment: 1 } },
        });
    }

    /** Persiste le hash du refresh token courant (rotation à chaque /refresh) */
    async updateRefreshToken(id: string, hashedToken: string | null) {
        return prisma.partnerUser.update({
            where: { id },
            data:  { refreshToken: hashedToken },
        });
    }

    /** Crée le 1er compte d'un partenaire (bootstrap) avec un token d'activation —
     *  mot de passe temporaire volontairement non hashé (donc jamais utilisable
     *  tel quel, cf. commentaire équivalent dans organization.repository.ts). */
    async createBootstrapUser(data: {
        partnerId:    string;
        email:        string;
        firstName:    string;
        lastName:     string;
        tempPassword: string;
        resetToken:   string;
        expiresAt:    Date;
    }) {
        return prisma.partnerUser.create({
            data: {
                partnerId:              data.partnerId,
                email:                  data.email,
                passwordHash:           data.tempPassword,
                firstName:              data.firstName,
                lastName:               data.lastName,
                role:                   "PARTNER_ADMIN",
                resetPasswordToken:     data.resetToken,
                resetPasswordExpiresAt: data.expiresAt,
            } as never,
        });
    }

    /** Trouve un PartnerUser par son token de reset/activation (non expiré) */
    async findUserByResetToken(hashedToken: string) {
        return prisma.partnerUser.findFirst({
            where: {
                resetPasswordToken: hashedToken,
                resetPasswordExpiresAt: { gt: new Date() },
            } as never,
        });
    }

    /** Définit le mot de passe (activation ou reset), efface le token et révoque les sessions. */
    async setPasswordFromToken(id: string, hashedPassword: string) {
        return prisma.partnerUser.update({
            where: { id },
            data: {
                passwordHash:           hashedPassword,
                resetPasswordToken:     null,
                resetPasswordExpiresAt: null,
                refreshToken:           null,
                tokenVersion:           { increment: 1 },
            } as never,
        });
    }

    // ── Partner profile ───────────────────────────────────────────────────────

    // `select` strict — jamais `include` sur `Partner` ici : un `include` renvoie
    // TOUS les champs scalaires, dont `notes` (réservé au Super Admin),
    // `apiKeyEncrypted`/`partnerToken`/`mobileMoneyNumberEncrypted`/
    // `bankDetailsEncrypted` (secrets chiffrés) et `warningCount`/`flaggedAt`
    // (modération interne) — tous interceptables par le partenaire lui-même via
    // GET /partner-portal/profile. `locations` reste inclus : `listLocations()`
    // côté frontend n'a pas de route GET /locations dédiée et dépend de cette
    // relation embarquée dans la réponse profil.
    async getPartner(partnerId: string) {
        return prisma.partner.findUnique({
            where:  { id: partnerId },
            select: { ...PARTNER_PROFILE_SELECT, locations: { include: { availabilities: true } } },
        });
    }

    async updatePartnerProfile(
        partnerId: string,
        data: Partial<{
            name:         string;
            sector:       string;
            description:  string;
            contactEmail: string;
            phone:        string;
            websiteUrl:   string;
            logoUrl:      string;
        }>
    ) {
        return prisma.partner.update({ where: { id: partnerId }, data, select: PARTNER_PROFILE_SELECT });
    }

    // ── Locations ─────────────────────────────────────────────────────────────

    async createLocation(partnerId: string, data: {
        name:      string;
        address:   string;
        city:      string;
        country?:  string;
        latitude?: number;
        longitude?: number;
        mapsUrl?:  string;
        phone?:    string;
        isMain?:   boolean;
    }) {
        return prisma.partnerLocation.create({ data: { ...data, partnerId } });
    }

    async updateLocation(id: string, partnerId: string, data: Partial<{
        name: string; address: string; city: string; phone: string; isMain: boolean;
        latitude: number; longitude: number; mapsUrl: string;
    }>) {
        return prisma.partnerLocation.update({ where: { id, partnerId }, data });
    }

    async deleteLocation(id: string, partnerId: string) {
        return prisma.partnerLocation.delete({ where: { id, partnerId } });
    }

    // ── Availabilities ────────────────────────────────────────────────────────

    async setAvailabilities(locationId: string, partnerId: string, slots: Array<{
        dayOfWeek?: number;
        openTime:   string;
        closeTime:  string;
        isClosed?:  boolean;
        exceptionDate?: Date;
        note?:      string;
    }>) {
        // PartnerAvailability n'a pas de partnerId direct (seulement locationId) : on vérifie
        // que l'établissement appartient bien au partenaire connecté avant toute écriture.
        const location = await prisma.partnerLocation.findFirst({ where: { id: locationId, partnerId } });
        if (!location) throw new AppError("Établissement introuvable", 404);

        await prisma.partnerAvailability.deleteMany({ where: { locationId } });
        if (slots.length === 0) return [];
        return prisma.partnerAvailability.createMany({
            data: slots.map((s) => ({ ...s, locationId })),
        });
    }

    // ── Offers ────────────────────────────────────────────────────────────────

    async listOffers(partnerId: string) {
        return prisma.benefitCatalogItem.findMany({
            where:   { partnerId },
            orderBy: { createdAt: "desc" },
        });
    }

    async createOffer(partnerId: string, organizationId: string, data: {
        title:       string;
        description?: string;
        imageUrl?:   string;
        category:    string;
        employeePrice: number;
        companyPrice:  number;
        subsidyPct:    number;
        stock?:        number;
        validUntil?:   Date;
        requiresTicket?: boolean;
        city?:         string;
        region?:       string;
        country?:      string;
    }) {
        return prisma.benefitCatalogItem.create({
            data: {
                ...data,
                partnerId,
                organizationId,
                isActive:     false, // starts inactive, SA approves
                reviewStatus: "PENDING",
            },
        });
    }

    async updateOffer(id: string, partnerId: string, data: Partial<{
        title: string; description: string; imageUrl: string;
        employeePrice: number; companyPrice: number; stock: number; validUntil: Date;
    }>) {
        return prisma.benefitCatalogItem.update({
            where: { id, partnerId },
            // Toute modification par le partenaire remet l'offre en revue —
            // aucune offre ne peut redevenir active sans re-validation SA.
            data:  { ...data, isActive: false, reviewStatus: "PENDING", reviewNote: null, reviewedAt: null, reviewedById: null }, // re-submit for review
        });
    }

    /**
     * Bascule la visibilité d'une offre (masquer/afficher), SANS jamais
     * toucher à `reviewStatus` — contrairement à `updateOffer`, ce n'est pas
     * une modification de contenu qui doit repasser en revue. Désactiver
     * (`isActive: false`) est toujours permis (le partenaire doit pouvoir
     * masquer son offre à tout moment). Réactiver n'est permis que si l'offre
     * est déjà `APPROVED` — vérifié de façon atomique via le `where` (évite
     * une race lecture-puis-écriture entre la vérification et la mise à jour,
     * même pattern que `booking.repository.ts::updateStatusFrom`).
     */
    async setOfferActive(id: string, partnerId: string, isActive: boolean) {
        if (!isActive) {
            return prisma.benefitCatalogItem.update({ where: { id, partnerId }, data: { isActive: false } });
        }
        try {
            return await prisma.benefitCatalogItem.update({
                where: { id, partnerId, reviewStatus: "APPROVED" },
                data:  { isActive: true },
            });
        } catch (err: any) {
            if (err?.code === "P2025") {
                const offer = await prisma.benefitCatalogItem.findFirst({ where: { id, partnerId } });
                if (!offer) throw new AppError("Offre introuvable", 404);
                throw new AppError("Cette offre doit être approuvée par le Super Admin avant de pouvoir être réactivée", 400);
            }
            throw err;
        }
    }

    // ── Paramètres ────────────────────────────────────────────────────────────

    async getSettingsPartner(partnerId: string) {
        return prisma.partner.findUnique({
            where:  { id: partnerId },
            select: {
                currencyCode:    true,
                apiEnabled:      true,
                apiBaseUrl:      true,
                apiFormat:       true,
                apiKeyEncrypted: true,
            },
        });
    }

    async updateCurrency(partnerId: string, currencyCode: string) {
        return prisma.partner.update({ where: { id: partnerId }, data: { currencyCode } });
    }

    async updateApiIntegration(partnerId: string, data: {
        apiEnabled?: boolean; apiBaseUrl?: string; apiFormat?: string; apiKeyEncrypted?: string;
    }) {
        return prisma.partner.update({
            where: { id: partnerId },
            data:  {
                apiEnabled: data.apiEnabled,
                apiBaseUrl: data.apiBaseUrl,
                apiFormat:  data.apiFormat,
                ...(data.apiKeyEncrypted !== undefined ? { apiKeyEncrypted: data.apiKeyEncrypted } : {}),
            },
        });
    }

    // ── Moyens de réception de paiement ─────────────────────────────────────────
    // Aucune méthode de ce bloc ne sélectionne jamais `detailsEncrypted` en retour.

    async listPaymentMethods(partnerId: string) {
        return prisma.partnerPaymentMethod.findMany({
            where:   { partnerId },
            orderBy: { createdAt: "desc" },
            select:  PAYMENT_METHOD_SELECT,
        });
    }

    async createPaymentMethod(partnerId: string, createdById: string, data: {
        type: PartnerPaymentMethodType; provider: string; label: string;
        detailsEncrypted: string; maskedHint?: string;
    }) {
        return prisma.partnerPaymentMethod.create({
            data:   { ...data, partnerId, createdById },
            select: PAYMENT_METHOD_SELECT,
        });
    }

    async updatePaymentMethod(id: string, partnerId: string, data: Partial<{
        label: string; isActive: boolean; detailsEncrypted: string; maskedHint: string;
    }>) {
        return prisma.partnerPaymentMethod.update({
            where:  { id, partnerId },
            data,
            select: PAYMENT_METHOD_SELECT,
        });
    }

    async deletePaymentMethod(id: string, partnerId: string) {
        return prisma.partnerPaymentMethod.delete({ where: { id, partnerId } });
    }
}
