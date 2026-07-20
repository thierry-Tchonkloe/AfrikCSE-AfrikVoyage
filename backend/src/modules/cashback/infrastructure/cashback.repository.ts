import { CashbackStatus, CashbackType, Prisma } from "@prisma/client";
import { prisma } from "../../../core/config/prisma";

export class CashbackRepository {
    // ── Rules ─────────────────────────────────────────────────────────────────

    async findBestActiveRule(organizationId: string) {
        // Règle spécifique à l'org en priorité, puis règle globale (SA)
        const orgRule = await prisma.cashbackRule.findFirst({
            where: { isActive: true, organizationId },
            orderBy: { createdAt: "desc" },
        });
        if (orgRule) return orgRule;
        return prisma.cashbackRule.findFirst({
            where: { isActive: true, organizationId: null },
            orderBy: { createdAt: "desc" },
        });
    }

    async listRules(organizationId: string) {
        return prisma.cashbackRule.findMany({
            where: {
                OR: [
                    { organizationId },
                    { organizationId: null }, // règles globales SA
                ],
            },
            include: {
                partner: { select: { id: true, name: true } },
                _count:  { select: { transactions: true, offers: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async createRule(organizationId: string | null, data: {
        type:          CashbackType;
        rate:          Prisma.Decimal;
        fixedAmount?:  Prisma.Decimal;
        maxPerEmployee?: Prisma.Decimal;
        maxPerPeriod?: Prisma.Decimal;
        startDate?:    Date;
        endDate?:      Date;
        category?:     string;
        partnerId?:    string;
        currencyCode?: string;
    }) {
        return prisma.cashbackRule.create({
            data: { ...data, organizationId, currencyCode: data.currencyCode ?? "XOF" },
        });
    }

    async updateRule(id: string, organizationId: string | null, data: Partial<{
        type:          CashbackType;
        rate:          Prisma.Decimal;
        fixedAmount:   Prisma.Decimal | null;
        maxPerEmployee: Prisma.Decimal | null;
        maxPerPeriod:  Prisma.Decimal | null;
        startDate:     Date | null;
        endDate:       Date | null;
        category:      string | null;
        isActive:      boolean;
    }>) {
        const filter = organizationId
            ? { id, organizationId }
            : { id }; // SA peut modifier les règles globales
        return prisma.cashbackRule.update({ where: filter, data });
    }

    async deleteRule(id: string, organizationId: string | null) {
        const filter = organizationId ? { id, organizationId } : { id };
        return prisma.cashbackRule.delete({ where: filter });
    }

    // ── Transactions ─────────────────────────────────────────────────────────

    async listMyTransactions(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            prisma.cashbackTransaction.findMany({
                where: { userId },
                include: { rule: { select: { id: true, type: true, rate: true, currencyCode: true } } },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.cashbackTransaction.count({ where: { userId } }),
        ]);
        return { transactions, total, page, limit };
    }

    async listTransactions(organizationId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            prisma.cashbackTransaction.findMany({
                where: { organizationId },
                include: {
                    user: { select: { id: true, firstName: true, lastName: true } },
                    rule: { select: { id: true, type: true, rate: true } },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.cashbackTransaction.count({ where: { organizationId } }),
        ]);
        return { transactions, total, page, limit };
    }

    async createTransaction(data: {
        userId:        string;
        organizationId: string;
        ruleId:        string;
        rawAmount:     Prisma.Decimal;
        creditedAmount: Prisma.Decimal;
        status:        CashbackStatus;
        idempotencyKey: string;
        fraudScore?:   Prisma.Decimal;
        orderId?:      string;
        ticketId?:     string;
        currencyCode?: string;
    }) {
        return prisma.cashbackTransaction.create({
            data: { ...data, currencyCode: data.currencyCode ?? "XOF" },
        });
    }

    // ── Fraud Signals ─────────────────────────────────────────────────────────

    async listFraudSignals(reviewed?: boolean, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = reviewed !== undefined ? { reviewed } : {};
        const [signals, total] = await Promise.all([
            prisma.fraudSignal.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.fraudSignal.count({ where }),
        ]);
        return { signals, total, page, limit };
    }

    async reviewFraudSignal(id: string, reviewedById: string) {
        return prisma.fraudSignal.update({
            where: { id },
            data: { reviewed: true, reviewedById, reviewedAt: new Date() },
        });
    }
}
