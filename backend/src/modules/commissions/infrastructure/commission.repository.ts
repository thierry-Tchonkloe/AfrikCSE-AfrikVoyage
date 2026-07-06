import { CommissionStatus, CommissionType, PayoutStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../core/config/prisma";

export class CommissionRepository {
    // ── Rules ─────────────────────────────────────────────────────────────────

    async listRules(partnerId?: string) {
        return prisma.commissionRule.findMany({
            where: { isActive: true, ...(partnerId ? { OR: [{ partnerId }, { partnerId: null }] } : {}) },
            include: { partner: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
        });
    }

    async createRule(data: {
        partnerId?:  string;
        category?:   string;
        type:        CommissionType;
        rate:        Prisma.Decimal;
        fixedAmount?: Prisma.Decimal;
        currencyCode?: string;
    }) {
        return prisma.commissionRule.create({ data });
    }

    async updateRule(id: string, data: Partial<{
        type:        CommissionType;
        rate:        Prisma.Decimal;
        fixedAmount: Prisma.Decimal;
        isActive:    boolean;
        category:    string;
    }>) {
        return prisma.commissionRule.update({ where: { id }, data });
    }

    async deleteRule(id: string) {
        return prisma.commissionRule.delete({ where: { id } });
    }

    // ── Commission calculation ────────────────────────────────────────────────

    /**
     * Finds the applicable rule for a booking:
     * 1. Partner-specific rule first
     * 2. Category-level rule
     * 3. Global rule (partnerId = null AND category = null)
     */
    async findApplicableRule(partnerId: string, category?: string) {
        const rule = await prisma.commissionRule.findFirst({
            where: {
                isActive: true,
                OR: [
                    { partnerId, ...(category ? { category } : {}) },
                    { partnerId },
                    { partnerId: null, category },
                    { partnerId: null, category: null },
                ],
            },
            orderBy: [{ partnerId: "desc" }, { category: "desc" }],
        });
        return rule;
    }

    async createEntry(data: {
        bookingId:        string;
        ruleId:           string;
        partnerId:        string;
        grossAmount:      Prisma.Decimal;
        commissionAmount: Prisma.Decimal;
        netAmount:        Prisma.Decimal;
        currencyCode?:    string;
    }) {
        const existing = await prisma.commissionEntry.findUnique({ where: { bookingId: data.bookingId } });
        if (existing) return existing;
        return prisma.commissionEntry.create({ data });
    }

    async updateEntryStatus(id: string, status: CommissionStatus) {
        return prisma.commissionEntry.update({ where: { id }, data: { status } });
    }

    // ── Payouts ───────────────────────────────────────────────────────────────

    async listEntriesForPayout(partnerId: string, period: string) {
        const [year, month] = period.split("-").map(Number);
        const start = new Date(year, month - 1, 1);
        const end   = new Date(year, month, 0, 23, 59, 59);
        return prisma.commissionEntry.findMany({
            where: {
                partnerId,
                status:    CommissionStatus.CONFIRMED,
                payoutId:  null,
                createdAt: { gte: start, lte: end },
            },
        });
    }

    async createPayout(data: {
        partnerId:       string;
        period:          string;
        totalGross:      Prisma.Decimal;
        totalCommission: Prisma.Decimal;
        netAmount:       Prisma.Decimal;
        currencyCode?:   string;
        paymentMethod?:  string;
        triggeredById?:  string;
        entryIds:        string[];
    }) {
        const { entryIds, ...payoutData } = data;
        return prisma.$transaction(async (tx) => {
            const payout = await tx.partnerPayout.create({ data: payoutData as never });
            await tx.commissionEntry.updateMany({
                where: { id: { in: entryIds } },
                data:  { payoutId: payout.id, status: CommissionStatus.CONFIRMED },
            });
            return payout;
        });
    }

    async updatePayoutStatus(id: string, status: PayoutStatus, paidAt?: Date) {
        return prisma.partnerPayout.update({
            where: { id },
            data:  { status, ...(paidAt ? { paidAt } : {}) },
        });
    }

    async listPayouts(partnerId?: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = partnerId ? { partnerId } : {};
        const [payouts, total] = await Promise.all([
            prisma.partnerPayout.findMany({
                where,
                include: {
                    partner: { select: { id: true, name: true } },
                    entries: { select: { id: true, grossAmount: true, commissionAmount: true, netAmount: true } },
                },
                orderBy: { createdAt: "desc" },
                skip, take: limit,
            }),
            prisma.partnerPayout.count({ where }),
        ]);
        return { payouts, total, page, limit };
    }

    async listEntries(partnerId?: string, _organizationId?: string, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where = {
            ...(partnerId ? { partnerId } : {}),
        };
        const [entries, total] = await Promise.all([
            prisma.commissionEntry.findMany({
                where,
                include: {
                    partner: { select: { id: true, name: true } },
                    booking: { select: { id: true, bookingDate: true, status: true, organization: { select: { id: true, name: true } } } },
                    rule:    { select: { id: true, type: true, rate: true } },
                },
                orderBy: { createdAt: "desc" },
                skip, take: limit,
            }),
            prisma.commissionEntry.count({ where }),
        ]);
        return { entries, total, page, limit };
    }
}
