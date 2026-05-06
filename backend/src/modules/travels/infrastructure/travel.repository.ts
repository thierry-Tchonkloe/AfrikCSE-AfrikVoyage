import { prisma } from "../../../core/config/prisma";
import { RequestStatus } from "@prisma/client";

export class TravelRepository {
    async getAll(orgId: string, filters?: {
        status?: RequestStatus;
        department?: string;
        page?: number;
        limit?: number;
    }) {
        const { status, department, page = 1, limit = 10 } = filters ?? {};
        const skip = (page - 1) * limit;

        const where: any = { organizationId: orgId };
        if (status)     where.status     = status;
        if (department) where.department = department;

        const [data, total] = await Promise.all([
        prisma.travelRequest.findMany({
            where, skip, take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.travelRequest.count({ where }),
        ]);

        return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    async getStats(orgId: string) {
        const [total, pending, approved, totalCost, co2] = await Promise.all([
        prisma.travelRequest.count({ where: { organizationId: orgId } }),
        prisma.travelRequest.count({ where: { organizationId: orgId, status: "PENDING" } }),
        prisma.travelRequest.count({ where: { organizationId: orgId, status: "APPROVED" } }),
        prisma.travelRequest.aggregate({
            where: { organizationId: orgId },
            _sum: { actualCost: true, estimatedCost: true },
        }),
        prisma.expenseReport.aggregate({
            where: { organizationId: orgId },
            _sum: { co2Emissions: true },
        }),
        ]);

        return {
        total,
        pending,
        approved,
        totalCost: totalCost._sum.actualCost ?? totalCost._sum.estimatedCost ?? 0,
        co2Emissions: co2._sum.co2Emissions ?? 0,
        };
    }

    async approve(id: string, approverId: string) {
        return prisma.travelRequest.update({
        where: { id },
        data: { status: "APPROVED", approvedById: approverId, approvedAt: new Date() },
        });
    }

    async reject(id: string, note: string) {
        return prisma.travelRequest.update({
        where: { id },
        data: { status: "REJECTED", rejectionNote: note },
        });
    }

    // ── Notes de frais ────────────────────────────────

    async getExpenses(orgId: string, filters?: {
        status?: RequestStatus;
        department?: string;
        page?: number;
        limit?: number;
    }) {
        const { status, department, page = 1, limit = 10 } = filters ?? {};
        const skip = (page - 1) * limit;

        const where: any = { organizationId: orgId };
        if (status)     where.status     = status;
        if (department) where.department = department;

        const [data, total] = await Promise.all([
        prisma.expenseReport.findMany({
            where, skip, take: limit,
            include: {
            employee: {
                include: {
                user: { select: { firstName: true, lastName: true, email: true, jobTitle: true } },
                },
            },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.expenseReport.count({ where }),
        ]);

        return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    async getExpenseStats(orgId: string) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [total, count, co2] = await Promise.all([
        prisma.expenseReport.aggregate({
            where: { organizationId: orgId, createdAt: { gte: thirtyDaysAgo } },
            _sum: { amount: true },
            _count: true,
            _avg: { amount: true },
        }),
        prisma.expenseReport.count({ where: { organizationId: orgId } }),
        prisma.expenseReport.aggregate({
            where: { organizationId: orgId },
            _sum: { co2Emissions: true },
        }),
        ]);

        return {
        totalAmount:  total._sum.amount  ?? 0,
        totalCount:   count,
        avgAmount:    total._avg.amount  ?? 0,
        co2Emissions: co2._sum.co2Emissions ?? 0,
        };
    }

    async approveExpense(id: string, approverId: string) {
        return prisma.expenseReport.update({
        where: { id },
        data: { status: "APPROVED", approvedById: approverId, approvedAt: new Date() },
        });
    }

    async rejectExpense(id: string, note: string) {
        return prisma.expenseReport.update({
        where: { id },
        data: { status: "REJECTED", rejectionNote: note },
        });
    }
}