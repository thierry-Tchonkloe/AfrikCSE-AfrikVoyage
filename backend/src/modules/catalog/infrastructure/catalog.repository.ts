import { prisma } from "../../../core/config/prisma";
import { Prisma, OfferType } from "@prisma/client";

export interface CatalogFilters {
    category?:    string;
    search?:      string;
    sortBy?:      string;
    featured?:    boolean;
    city?:        string;
    region?:      string;
    partnerId?:   string;
    offerType?:   OfferType;
    subsidized?:  boolean;
}

export interface CatalogItemInput {
    title:           string;
    description?:    string;
    imageUrl?:       string;
    category:        string;
    subsidyPct:      number;
    employeePrice:   number;
    companyPrice:    number;
    validUntil?:     Date;
    maxPerFamily?:   number;
    isActive?:       boolean;
    partnerId?:      string;
    offerType?:      OfferType;
    isFeatured?:     boolean;
    isCommitteeChoice?: boolean;
    boostUntil?:     Date;
    boostLabel?:     string;
    subsidyAmount?:  number;
    subsidyStart?:   Date;
    subsidyEnd?:     Date;
    city?:           string;
    region?:         string;
    country?:        string;
    latitude?:       number;
    longitude?:      number;
    requiresTicket?: boolean;
    requiresFamilyMember?: boolean;
    publishedAt?:    Date;
    unpublishedAt?:  Date;
    validFrom?:      Date;
    stock?:          number;
}

export class CatalogRepository {
    async getAll(orgId: string, filters: CatalogFilters = {}) {
        const now = new Date();
        const where: Prisma.BenefitCatalogItemWhereInput = {
            organizationId: orgId,
            isActive: true,
            // Ne montrer que les offres publiées (ou sans contrainte de publication)
            OR: [
                { publishedAt: null },
                { publishedAt: { lte: now } },
            ],
            AND: [
                {
                    OR: [
                        { unpublishedAt: null },
                        { unpublishedAt: { gt: now } },
                    ],
                },
            ],
        };

        if (filters.category && filters.category !== "all") {
            where.category = { contains: filters.category, mode: "insensitive" };
        }

        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: "insensitive" } },
                { description: { contains: filters.search, mode: "insensitive" } },
            ];
        }

        if (filters.featured) where.isFeatured = true;
        if (filters.offerType) where.offerType = filters.offerType;
        if (filters.partnerId) where.partnerId = filters.partnerId;
        if (filters.subsidized) {
            where.OR = [
                { subsidyPct: { gt: 0 } },
                { subsidyAmount: { gt: 0 } },
            ];
        }

        if (filters.city) {
            where.city = { contains: filters.city, mode: "insensitive" };
        }
        if (filters.region) {
            where.region = { contains: filters.region, mode: "insensitive" };
        }

        const orderBy: Prisma.BenefitCatalogItemOrderByWithRelationInput = {};
        if (filters.sortBy === "price")    orderBy.employeePrice = "asc";
        else if (filters.sortBy === "subsidy") orderBy.subsidyPct = "desc";
        else if (filters.sortBy === "featured") {
            // Les featured d'abord, puis par date
        } else {
            orderBy.createdAt = "desc";
        }

        return prisma.benefitCatalogItem.findMany({
            where,
            orderBy,
            include: { partner: { select: { id: true, name: true, logoUrl: true } } },
        });
    }

    async getFeatured(orgId: string) {
        const now = new Date();
        return prisma.benefitCatalogItem.findMany({
            where: {
                organizationId: orgId,
                isActive: true,
                boostUntil: { gte: now },
            },
            orderBy: { boostUntil: "asc" },
            include: { partner: { select: { id: true, name: true, logoUrl: true } } },
        });
    }

    async getCommitteeChoices(orgId: string) {
        return prisma.benefitCatalogItem.findMany({
            where: { organizationId: orgId, isActive: true, isCommitteeChoice: true },
            include: { partner: { select: { id: true, name: true, logoUrl: true } } },
        });
    }

    async getNew(orgId: string) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return prisma.benefitCatalogItem.findMany({
            where: {
                organizationId: orgId,
                isActive: true,
                createdAt: { gte: sevenDaysAgo },
            },
            orderBy: { createdAt: "desc" },
            include: { partner: { select: { id: true, name: true, logoUrl: true } } },
        });
    }

    /** Cantonné à l'organisation appelante — retourne null si id inconnu OU appartenant à une autre org (anti-IDOR) */
    async getById(id: string, organizationId: string) {
        return prisma.benefitCatalogItem.findFirst({
            where: { id, organizationId },
            include: { partner: { select: { id: true, name: true, logoUrl: true, contactEmail: true } } },
        });
    }

    async getCategories(orgId: string) {
        const items = await prisma.benefitCatalogItem.groupBy({
            by: ["category"],
            where: { organizationId: orgId, isActive: true },
        });
        return items.map((i) => i.category);
    }

    // ─── Admin CRUD ─────────────────────────────────────────────────────────────

    async getAllAdmin(orgId: string) {
        return prisma.benefitCatalogItem.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: "desc" },
            include: { partner: { select: { id: true, name: true } } },
        });
    }

    async create(orgId: string, userId: string, data: CatalogItemInput) {
        const item = await prisma.benefitCatalogItem.create({
            data: {
                organizationId: orgId,
                title:           data.title,
                description:     data.description,
                imageUrl:        data.imageUrl,
                category:        data.category,
                subsidyPct:      data.subsidyPct,
                employeePrice:   data.employeePrice,
                companyPrice:    data.companyPrice,
                validUntil:      data.validUntil,
                maxPerFamily:    data.maxPerFamily,
                isActive:        data.isActive ?? true,
                partnerId:       data.partnerId,
                offerType:       data.offerType ?? "VOUCHER",
                isFeatured:      data.isFeatured ?? false,
                isCommitteeChoice: data.isCommitteeChoice ?? false,
                boostUntil:      data.boostUntil,
                boostLabel:      data.boostLabel,
                subsidyAmount:   data.subsidyAmount,
                subsidyStart:    data.subsidyStart,
                subsidyEnd:      data.subsidyEnd,
                city:            data.city,
                region:          data.region,
                country:         data.country,
                requiresTicket:  data.requiresTicket ?? false,
                requiresFamilyMember: data.requiresFamilyMember ?? false,
                publishedAt:     data.publishedAt,
                unpublishedAt:   data.unpublishedAt,
                validFrom:       data.validFrom,
                stock:           data.stock,
            },
        });

        await this.writeAudit(item.id, null, userId, "CREATED", item, 1);
        return item;
    }

    async update(id: string, userId: string, organizationId: string, data: Partial<CatalogItemInput>) {
        // Cantonné à l'organisation appelante — retourne null si id inconnu OU appartenant à une autre org (anti-IDOR)
        const before = await prisma.benefitCatalogItem.findFirst({ where: { id, organizationId } });
        if (!before) return null;

        const lastAudit = await prisma.offerAuditEntry.findFirst({
            where: { offerId: id },
            orderBy: { version: "desc" },
            select: { version: true },
        });
        const nextVersion = (lastAudit?.version ?? 0) + 1;

        const item = await prisma.benefitCatalogItem.update({
            where: { id, organizationId },
            data: {
                title:           data.title,
                description:     data.description,
                imageUrl:        data.imageUrl,
                category:        data.category,
                subsidyPct:      data.subsidyPct,
                employeePrice:   data.employeePrice,
                companyPrice:    data.companyPrice,
                validUntil:      data.validUntil,
                maxPerFamily:    data.maxPerFamily,
                isActive:        data.isActive,
                partnerId:       data.partnerId,
                offerType:       data.offerType,
                isFeatured:      data.isFeatured,
                isCommitteeChoice: data.isCommitteeChoice,
                boostUntil:      data.boostUntil,
                boostLabel:      data.boostLabel,
                subsidyAmount:   data.subsidyAmount,
                subsidyStart:    data.subsidyStart,
                subsidyEnd:      data.subsidyEnd,
                city:            data.city,
                region:          data.region,
                country:         data.country,
                requiresTicket:  data.requiresTicket,
                requiresFamilyMember: data.requiresFamilyMember,
                publishedAt:     data.publishedAt,
                unpublishedAt:   data.unpublishedAt,
                validFrom:       data.validFrom,
                stock:           data.stock,
            },
        });

        const action = data.isActive === false
            ? "UNPUBLISHED"
            : data.isActive === true
            ? "PUBLISHED"
            : "UPDATED";

        await this.writeAudit(id, before.partnerId, userId, action, before, nextVersion);
        return item;
    }

    async delete(id: string, userId: string, organizationId: string) {
        // Cantonné à l'organisation appelante — retourne null si id inconnu OU appartenant à une autre org (anti-IDOR)
        const before = await prisma.benefitCatalogItem.findFirst({ where: { id, organizationId } });
        if (!before) return null;
        const lastAudit = await prisma.offerAuditEntry.findFirst({
            where: { offerId: id },
            orderBy: { version: "desc" },
            select: { version: true },
        });
        const nextVersion = (lastAudit?.version ?? 0) + 1;

        await prisma.benefitCatalogItem.delete({ where: { id, organizationId } });
        await this.writeAudit(id, before.partnerId, userId, "DELETED", before, nextVersion);
        return true;
    }

    /** Cantonné à l'organisation via la relation offer.organizationId (anti-IDOR) */
    async getAuditHistory(offerId: string, organizationId: string) {
        return prisma.offerAuditEntry.findMany({
            where: { offerId, offer: { organizationId } },
            orderBy: { version: "asc" },
        });
    }

    private async writeAudit(
        offerId: string,
        partnerId: string | null | undefined,
        changedBy: string,
        action: string,
        snapshot: object,
        version: number
    ) {
        await prisma.offerAuditEntry.create({
            data: {
                offerId,
                partnerId: partnerId ?? undefined,
                action,
                changedBy,
                snapshot,
                version,
            },
        });
    }
}
