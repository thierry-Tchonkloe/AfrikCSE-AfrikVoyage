import { Prisma } from "@prisma/client";
import { prisma } from "../../../core/config/prisma";
import { AppError } from "../../../core/errors/app.error";

export class PartnerPortalRepository {
    // ── Auth / PartnerUser ────────────────────────────────────────────────────

    async findUserByEmail(email: string) {
        return prisma.partnerUser.findUnique({
            where: { email },
            include: { partner: { select: { id: true, name: true, status: true } } },
        });
    }

    async findUserById(id: string) {
        return prisma.partnerUser.findUnique({
            where: { id },
            include: { partner: true },
        });
    }

    async createUser(data: {
        partnerId:    string;
        email:        string;
        passwordHash: string;
        firstName:    string;
        lastName:     string;
        role?:        "PARTNER_ADMIN" | "PARTNER_STAFF";
        invitedById?: string;
    }) {
        return prisma.partnerUser.create({ data: data as never });
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

    // ── Partner profile ───────────────────────────────────────────────────────

    async getPartner(partnerId: string) {
        return prisma.partner.findUnique({
            where:   { id: partnerId },
            include: { locations: { include: { availabilities: true } } },
        });
    }

    async updatePartnerProfile(
        partnerId: string,
        data: Partial<{
            contactEmail: string;
            websiteUrl:   string;
            notes:        string;
            logoUrl:      string;
        }>
    ) {
        return prisma.partner.update({ where: { id: partnerId }, data });
    }

    // ── Locations ─────────────────────────────────────────────────────────────

    async createLocation(partnerId: string, data: {
        name:      string;
        address:   string;
        city:      string;
        country?:  string;
        latitude?: Prisma.Decimal;
        longitude?: Prisma.Decimal;
        phone?:    string;
        isMain?:   boolean;
    }) {
        return prisma.partnerLocation.create({ data: { ...data, partnerId } });
    }

    async updateLocation(id: string, partnerId: string, data: Partial<{
        name: string; address: string; city: string; phone: string; isMain: boolean;
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
                isActive: false, // starts inactive, SA approves
            },
        });
    }

    async updateOffer(id: string, partnerId: string, data: Partial<{
        title: string; description: string; imageUrl: string;
        employeePrice: number; companyPrice: number; stock: number; validUntil: Date;
    }>) {
        return prisma.benefitCatalogItem.update({
            where: { id, partnerId },
            data:  { ...data, isActive: false }, // re-submit for review
        });
    }
}
