import { prisma } from "../../../core/config/prisma";
import { Prisma, PartnerStatus, PartnerScope } from "@prisma/client";
import { encrypt, decrypt } from "../../../core/utils/crypto";
import { generateSecureToken, hashToken } from "../../../core/utils/hash";
import { AppError } from "../../../core/errors/app.error";

export interface PartnerFilters {
    status?: PartnerStatus;
    scopeType?: PartnerScope;
    search?: string;
    page?: number;
    limit?: number;
}

export interface PartnerInput {
    name: string;
    sector: string;
    logoUrl?: string;
    contactEmail?: string;
    websiteUrl?: string;
    notes?: string;
    status?: PartnerStatus;
    scopeType?: PartnerScope;
    apiEnabled?: boolean;
    apiBaseUrl?: string;
    apiKey?: string;
    apiFormat?: string;
    syncFrequencyH?: number;
    isGlobal?: boolean;
    organizationIds?: string[];
}

function decryptApiKey(partner: { apiKeyEncrypted: string | null; [key: string]: unknown }) {
    const { apiKeyEncrypted, ...rest } = partner;
    return { ...rest, apiKeyEncrypted: undefined, hasApiKey: !!apiKeyEncrypted };
}

export class PartnerRepository {
    async findAll(filters: PartnerFilters = {}) {
        const { status, scopeType, search, page = 1, limit = 20 } = filters;
        const where: Prisma.PartnerWhereInput = {};

        if (status) where.status = status;
        if (scopeType) where.scopeType = scopeType;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { sector: { contains: search, mode: "insensitive" } },
                { contactEmail: { contains: search, mode: "insensitive" } },
            ];
        }

        const [total, items] = await prisma.$transaction([
            prisma.partner.count({ where }),
            prisma.partner.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    _count: { select: { offers: true, syncLogs: true } },
                },
            }),
        ]);

        return {
            total,
            page,
            limit,
            data: items.map(decryptApiKey),
        };
    }

    async findById(id: string) {
        const partner = await prisma.partner.findUnique({
            where: { id },
            include: {
                _count: { select: { offers: true, syncLogs: true } },
                syncLogs: { orderBy: { createdAt: "desc" }, take: 5 },
            },
        });
        if (!partner) return null;
        return decryptApiKey(partner);
    }

    async findActiveGdsByOrgId(orgId: string) {
        return prisma.partner.findFirst({
            where: {
                status: "ACTIVE",
                apiEnabled: true,
                OR: [
                    { isGlobal: true },
                    { organizationIds: { has: orgId } },
                ],
            },
        });
    }

    async create(createdBy: string, data: PartnerInput) {
        return prisma.partner.create({
            data: {
                name: data.name,
                sector: data.sector,
                logoUrl: data.logoUrl,
                contactEmail: data.contactEmail,
                websiteUrl: data.websiteUrl,
                notes: data.notes,
                status: data.status ?? "DRAFT",
                scopeType: data.scopeType ?? "CSE",
                apiEnabled: data.apiEnabled ?? false,
                apiBaseUrl: data.apiBaseUrl,
                apiKeyEncrypted: data.apiKey ? encrypt(data.apiKey) : undefined,
                apiFormat: data.apiFormat,
                syncFrequencyH: data.syncFrequencyH ?? 24,
                isGlobal: data.isGlobal ?? true,
                organizationIds: data.organizationIds ?? [],
                createdBy,
            },
        });
    }

    /**
     * Bootstrap du 1er compte de connexion (PARTNER_ADMIN) à la création du
     * partenaire — sans ça, un partenaire créé par le Super Admin ne pouvait
     * jamais se connecter à son portail (aucune route ne créait de PartnerUser
     * en dehors du flux self-service `createStaff`, déjà protégé par une
     * session partenaire existante). Mot de passe temporaire volontairement non
     * hashé (jamais utilisable tel quel, cf. organization.repository.ts) —
     * seul le token d'activation (réutilise /activate, voir AuthService.resetPassword)
     * permet de définir un vrai mot de passe.
     */
    async createBootstrapPartnerUser(partnerId: string, data: { email: string; firstName: string; lastName: string }) {
        const rawToken   = generateSecureToken();
        const hashedToken = hashToken(rawToken);
        const tempPassword = generateSecureToken();

        const user = await prisma.partnerUser.create({
            data: {
                partnerId,
                email:                  data.email,
                passwordHash:           tempPassword,
                firstName:              data.firstName,
                lastName:               data.lastName,
                role:                   "PARTNER_ADMIN",
                resetPasswordToken:     hashedToken,
                resetPasswordExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            } as never,
        });

        return { user, rawToken };
    }

    async update(id: string, data: Partial<PartnerInput>) {
        const updateData: Prisma.PartnerUpdateInput = {
            name: data.name,
            sector: data.sector,
            logoUrl: data.logoUrl,
            contactEmail: data.contactEmail,
            websiteUrl: data.websiteUrl,
            notes: data.notes,
            status: data.status,
            scopeType: data.scopeType,
            apiEnabled: data.apiEnabled,
            apiBaseUrl: data.apiBaseUrl,
            apiFormat: data.apiFormat,
            syncFrequencyH: data.syncFrequencyH,
            isGlobal: data.isGlobal,
            organizationIds: data.organizationIds,
        };

        if (data.apiKey !== undefined) {
            updateData.apiKeyEncrypted = data.apiKey ? encrypt(data.apiKey) : null;
        }

        const partner = await prisma.partner.update({ where: { id }, data: updateData });
        return decryptApiKey(partner);
    }

    async delete(id: string) {
        const hasActiveOffers = await prisma.benefitCatalogItem.count({
            where: { partnerId: id, isActive: true },
        });
        if (hasActiveOffers > 0) {
            throw new Error("PARTNER_HAS_ACTIVE_OFFERS");
        }
        return prisma.partner.delete({ where: { id } });
    }

    async getDecryptedApiKey(id: string): Promise<string | null> {
        const partner = await prisma.partner.findUnique({
            where: { id },
            select: { apiKeyEncrypted: true },
        });
        if (!partner?.apiKeyEncrypted) return null;
        return decrypt(partner.apiKeyEncrypted);
    }

    async createSyncLog(partnerId: string, data: {
        type: string;
        offersCreated?: number;
        offersUpdated?: number;
        errors?: number;
        status: string;
        errorDetail?: string;
    }) {
        return prisma.partnerSyncLog.create({
            data: {
                partnerId,
                type: data.type,
                offersCreated: data.offersCreated ?? 0,
                offersUpdated: data.offersUpdated ?? 0,
                errors: data.errors ?? 0,
                status: data.status,
                errorDetail: data.errorDetail,
            },
        });
    }

    async getSyncLogs(partnerId: string) {
        return prisma.partnerSyncLog.findMany({
            where: { partnerId },
            orderBy: { createdAt: "desc" },
            take: 20,
        });
    }

    async incrementWarning(id: string) {
        return prisma.partner.update({
            where: { id },
            data: { warningCount: { increment: 1 }, flaggedAt: new Date() },
        });
    }

    // ── Validation des offres soumises par les partenaires ─────────────────────

    async listPendingOffers() {
        return prisma.benefitCatalogItem.findMany({
            where:   { partnerId: { not: null }, reviewStatus: "PENDING" },
            orderBy: { createdAt: "asc" },
            include: { partner: { select: { id: true, name: true, logoUrl: true } } },
        });
    }

    async approveOffer(offerId: string, adminUserId: string) {
        const offer = await this.getPendingOfferOrThrow(offerId);

        const updated = await prisma.benefitCatalogItem.update({
            where: { id: offerId },
            data: {
                isActive:     true,
                reviewStatus: "APPROVED",
                reviewNote:   null,
                reviewedAt:   new Date(),
                reviewedById: adminUserId,
            },
        });
        await this.writeOfferAudit(offer, adminUserId, "APPROVED");
        return updated;
    }

    async rejectOffer(offerId: string, adminUserId: string, note: string) {
        const offer = await this.getPendingOfferOrThrow(offerId);

        const updated = await prisma.benefitCatalogItem.update({
            where: { id: offerId },
            data: {
                isActive:     false,
                reviewStatus: "REJECTED",
                reviewNote:   note,
                reviewedAt:   new Date(),
                reviewedById: adminUserId,
            },
        });
        await this.writeOfferAudit(offer, adminUserId, "REJECTED", note);
        return updated;
    }

    /** Cantonné aux offres soumises par un partenaire, en attente de revue (anti-IDOR / anti-double-traitement) */
    private async getPendingOfferOrThrow(offerId: string) {
        const offer = await prisma.benefitCatalogItem.findFirst({
            where: { id: offerId, partnerId: { not: null } },
        });
        if (!offer) throw new AppError("Offre partenaire introuvable", 404);
        if (offer.reviewStatus !== "PENDING") {
            throw new AppError("Cette offre a déjà été traitée", 409);
        }
        return offer;
    }

    private async writeOfferAudit(
        offer: { id: string; partnerId: string | null },
        changedBy: string,
        action: "APPROVED" | "REJECTED",
        note?: string
    ) {
        const lastAudit = await prisma.offerAuditEntry.findFirst({
            where:   { offerId: offer.id },
            orderBy: { version: "desc" },
            select:  { version: true },
        });
        await prisma.offerAuditEntry.create({
            data: {
                offerId:   offer.id,
                partnerId: offer.partnerId ?? undefined,
                action,
                changedBy,
                snapshot:  note ? { note } : {},
                version:   (lastAudit?.version ?? 0) + 1,
            },
        });
    }
}
