import { prisma } from "../../../core/config/prisma";
import { Prisma, OfferType } from "@prisma/client";

export interface SubsidyRuleInput {
    label:         string;
    category?:     string;
    offerType?:    OfferType;
    subsidyPct?:   number;
    subsidyAmount?: number;
    currencyCode?: string;
    maxPerEmployee?: number;
    startsAt?:     Date;
    endsAt?:       Date;
    isActive?:     boolean;
    priority?:     number;
}

export class SubsidyRulesRepository {
    async findAll(organizationId: string) {
        return prisma.subsidyRule.findMany({
            where: { organizationId },
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        });
    }

    async findActiveForOrg(organizationId: string, category?: string | null, offerType?: OfferType | null) {
        const now = new Date();
        return prisma.subsidyRule.findMany({
            where: {
                organizationId,
                isActive: true,
                OR: [{ startsAt: null }, { startsAt: { lte: now } }],
                AND: [
                    { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
                    { OR: [{ category: null }, ...(category ? [{ category }] : [])] },
                    { OR: [{ offerType: null }, ...(offerType ? [{ offerType }] : [])] },
                ],
            },
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        });
    }

    async findById(id: string, organizationId: string) {
        return prisma.subsidyRule.findFirst({ where: { id, organizationId } });
    }

    async create(organizationId: string, data: SubsidyRuleInput) {
        return prisma.subsidyRule.create({
            data: {
                organizationId,
                label:         data.label,
                category:      data.category,
                offerType:     data.offerType,
                subsidyPct:    data.subsidyPct,
                subsidyAmount: data.subsidyAmount != null
                    ? new Prisma.Decimal(data.subsidyAmount)
                    : undefined,
                currencyCode:   data.currencyCode ?? "XOF",
                maxPerEmployee: data.maxPerEmployee != null
                    ? new Prisma.Decimal(data.maxPerEmployee)
                    : undefined,
                startsAt:  data.startsAt,
                endsAt:    data.endsAt,
                isActive:  data.isActive ?? true,
                priority:  data.priority ?? 0,
            },
        });
    }

    async update(id: string, organizationId: string, data: Partial<SubsidyRuleInput>) {
        const existing = await prisma.subsidyRule.findFirst({ where: { id, organizationId } });
        if (!existing) return null;

        return prisma.subsidyRule.update({
            where: { id },
            data: {
                label:         data.label,
                category:      data.category,
                offerType:     data.offerType,
                subsidyPct:    data.subsidyPct,
                subsidyAmount: data.subsidyAmount != null
                    ? new Prisma.Decimal(data.subsidyAmount)
                    : undefined,
                currencyCode:  data.currencyCode,
                maxPerEmployee: data.maxPerEmployee != null
                    ? new Prisma.Decimal(data.maxPerEmployee)
                    : undefined,
                startsAt: data.startsAt,
                endsAt:   data.endsAt,
                isActive: data.isActive,
                priority: data.priority,
            },
        });
    }

    async delete(id: string, organizationId: string) {
        const existing = await prisma.subsidyRule.findFirst({ where: { id, organizationId } });
        if (!existing) return null;
        return prisma.subsidyRule.delete({ where: { id } });
    }
}
