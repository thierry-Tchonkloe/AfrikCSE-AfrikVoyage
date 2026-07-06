import { Prisma } from "@prisma/client";
import { prisma } from "../../../core/config/prisma";

export class PartnerPortalRepository {
    // ── Auth / PartnerUser ────────────────────────────────────────────────────

    async findUserByEmail(email: string) {
        return prisma.partnerUser.findUnique({
            where: { email },
            include: { partner: { select: { id: true, status: true } } },
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

    async setAvailabilities(locationId: string, slots: Array<{
        dayOfWeek?: number;
        openTime:   string;
        closeTime:  string;
        isClosed?:  boolean;
        exceptionDate?: Date;
        note?:      string;
    }>) {
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
