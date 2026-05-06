import { prisma } from "../../../core/config/prisma";
import { RequestStatus, Urgency } from "@prisma/client";

export class BenefitRepository {
    // ── Catégories ──────────────────────────────────────

    async getCategories(orgId: string) {
        return prisma.benefitCategory.findMany({
        where: { organizationId: orgId },
        include: {
            _count: { select: { requests: true } },
            requests: {
            where: { status: "APPROVED" },
            select: { amount: true },
            },
        },
        orderBy: { createdAt: "desc" },
        });
    }

    async createCategory(orgId: string, data: {
        name: string;
        description?: string;
        icon?: string;
        annualBudget: number;
        perEmployeeLimit: number;
        eligibleServices: string[];
    }) {
        return prisma.benefitCategory.create({
        data: { ...data, organizationId: orgId },
        });
    }

    async updateCategory(id: string, data: Partial<{
        name: string;
        description: string;
        annualBudget: number;
        perEmployeeLimit: number;
        eligibleServices: string[];
        isActive: boolean;
    }>) {
        return prisma.benefitCategory.update({ where: { id }, data });
    }

    async deleteCategory(id: string) {
        return prisma.benefitCategory.delete({ where: { id } });
    }

    // ── Demandes ────────────────────────────────────────

    async getRequests(orgId: string, filters?: {
        status?: RequestStatus;
        categoryId?: string;
        urgency?: Urgency;
        page?: number;
        limit?: number;
    }) {
        const { status, categoryId, urgency, page = 1, limit = 10 } = filters ?? {};
        const skip = (page - 1) * limit;

        const where: any = { organizationId: orgId };
        if (status)     where.status     = status;
        if (categoryId) where.categoryId = categoryId;
        if (urgency)    where.urgency    = urgency;

        const [data, total] = await Promise.all([
        prisma.benefitRequest.findMany({
            where,
            skip,
            take: limit,
            include: {
            employee: {
                include: {
                user: { select: { firstName: true, lastName: true, email: true, department: true } },
                },
            },
            category: { select: { name: true, icon: true } },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.benefitRequest.count({ where }),
        ]);

        return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    async getPendingCount(orgId: string) {
        return prisma.benefitRequest.count({
        where: { organizationId: orgId, status: "PENDING" },
        });
    }

    async approveRequest(id: string, approverId: string) {
        return prisma.benefitRequest.update({
        where: { id },
        data: { status: "APPROVED", approvedById: approverId, approvedAt: new Date() },
        });
    }

    async rejectRequest(id: string, note: string) {
        return prisma.benefitRequest.update({
        where: { id },
        data: { status: "REJECTED", rejectionNote: note },
        });
    }

    async bulkApprove(ids: string[], approverId: string) {
        return prisma.benefitRequest.updateMany({
        where: { id: { in: ids }, status: "PENDING" },
        data: { status: "APPROVED", approvedById: approverId, approvedAt: new Date() },
        });
    }

    // ── Stats approbation ────────────────────────────────

    async getApprovalStats(orgId: string) {
        const [pending, approvedToday, totalAmount] = await Promise.all([
        prisma.benefitRequest.count({
            where: { organizationId: orgId, status: "PENDING" },
        }),
        prisma.benefitRequest.count({
            where: {
            organizationId: orgId,
            status: "APPROVED",
            approvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            },
        }),
        prisma.benefitRequest.aggregate({
            where: { organizationId: orgId, status: "APPROVED" },
            _sum: { amount: true },
        }),
        ]);

        return {
        pending,
        approvedToday,
        totalAmount: totalAmount._sum.amount ?? 0,
        avgResponseHours: 2.4, // calculable plus tard
        };
    }

    // ── Rapports CSE ────────────────────────────────────

    async getBudgetReport(orgId: string, year: number) {
        const start = new Date(`${year}-01-01`);
        const end   = new Date(`${year}-12-31`);

        const [categories, totalBudget, usedBudget, activeEmployees] = await Promise.all([
        prisma.benefitCategory.findMany({
            where: { organizationId: orgId },
            include: {
            requests: {
                where: { status: "APPROVED", createdAt: { gte: start, lte: end } },
                select: { amount: true },
            },
            },
        }),
        prisma.benefitCategory.aggregate({
            where: { organizationId: orgId },
            _sum: { annualBudget: true },
        }),
        prisma.benefitRequest.aggregate({
            where: { organizationId: orgId, status: "APPROVED", createdAt: { gte: start, lte: end } },
            _sum: { amount: true },
        }),
        prisma.user.count({ where: { organizationId: orgId, isActive: true } }),
        ]);

        return {
        year,
        totalBudget: totalBudget._sum.annualBudget ?? 0,
        usedBudget: usedBudget._sum.amount ?? 0,
        activeEmployees,
        categories: categories.map((c) => ({
            id: c.id,
            name: c.name,
            budget: c.annualBudget,
            used: c.requests.reduce((sum, r) => sum + r.amount, 0),
        })),
        };
    }
}