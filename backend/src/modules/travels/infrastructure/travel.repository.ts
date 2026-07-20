import { prisma } from "../../../core/config/prisma";
import { RequestStatus, TravelStatus, PaymentStatus, Urgency } from "@prisma/client";

export class TravelRepository {
    async getAll(orgId: string, filters?: {
        status?: TravelStatus;
        department?: string;
        urgency?: Urgency;
        minAmount?: number;
        maxAmount?: number;
        search?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }) {
        const { status, department, urgency, minAmount, maxAmount, search, startDate, endDate, page = 1, limit = 10 } = filters ?? {};
        const skip = (page - 1) * limit;

        const where: any = { organizationId: orgId };
        if (status)     where.status     = status;
        if (department) where.department = department;
        if (urgency)    where.urgency    = urgency;
        if (minAmount != null || maxAmount != null) {
        where.estimatedCost = {};
        if (minAmount != null) where.estimatedCost.gte = minAmount;
        if (maxAmount != null) where.estimatedCost.lte = maxAmount;
        }
        if (startDate || endDate) {
        where.departureDate = {};
        if (startDate) where.departureDate.gte = startDate;
        if (endDate)   where.departureDate.lte = endDate;
        }
        if (search) {
        where.requestedBy = {
            OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName:  { contains: search, mode: "insensitive" } },
            { email:     { contains: search, mode: "insensitive" } },
            ],
        };
        }

        const [data, total] = await Promise.all([
        prisma.travelRequest.findMany({
            where, skip, take: limit,
            include: {
            requestedBy: { select: { id: true, firstName: true, lastName: true, email: true, department: true, jobTitle: true } },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.travelRequest.count({ where }),
        ]);

        return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    async getById(orgId: string, id: string) {
        return prisma.travelRequest.findFirst({
        where: { id, organizationId: orgId },
        include: {
            requestedBy: { select: { id: true, firstName: true, lastName: true, email: true, department: true, jobTitle: true } },
            expenses: true,
        },
        });
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

    async approve(id: string, organizationId: string, approverId: string) {
        return prisma.travelRequest.update({
        where: { id, organizationId },
        data: { status: "APPROVED", approvedById: approverId, approvedAt: new Date() },
        });
    }

    async reject(id: string, organizationId: string, note: string) {
        return prisma.travelRequest.update({
        where: { id, organizationId },
        data: { status: "REJECTED", rejectionNote: note },
        });
    }

    async updateStatus(id: string, organizationId: string, status: TravelStatus, approverId?: string) {
        const data: any = { status };
        if (status === "APPROVED" && approverId) {
        data.approvedById = approverId;
        data.approvedAt   = new Date();
        }
        return prisma.travelRequest.update({ where: { id, organizationId }, data });
    }

    async bulkApprove(orgId: string, ids: string[], approverId: string) {
        const targets = await prisma.travelRequest.findMany({
        where: { id: { in: ids }, organizationId: orgId, status: "PENDING" },
        select: { id: true, requestedById: true, destination: true },
        });

        const result = await prisma.travelRequest.updateMany({
        where: { id: { in: targets.map((t) => t.id) } },
        data: { status: "APPROVED", approvedById: approverId, approvedAt: new Date() },
        });

        return { count: result.count, requests: targets };
    }

    async getApprovalStats(orgId: string) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [pending, approvedToday, totalAmount, approvedDelays] = await Promise.all([
        prisma.travelRequest.count({ where: { organizationId: orgId, status: "PENDING" } }),
        prisma.travelRequest.count({
            where: { organizationId: orgId, status: "APPROVED", approvedAt: { gte: todayStart } },
        }),
        prisma.travelRequest.aggregate({
            where: { organizationId: orgId, status: "APPROVED" },
            _sum: { estimatedCost: true },
        }),
        prisma.travelRequest.findMany({
            where: { organizationId: orgId, status: "APPROVED", approvedAt: { not: null } },
            select: { createdAt: true, approvedAt: true },
            orderBy: { approvedAt: "desc" },
            take: 100,
        }),
        ]);

        const avgResponseHours = approvedDelays.length
        ? approvedDelays.reduce((sum, r) => sum + (r.approvedAt!.getTime() - r.createdAt.getTime()) / 3_600_000, 0) / approvedDelays.length
        : 0;

        return {
        pending,
        approvedToday,
        totalAmount: totalAmount._sum.estimatedCost ?? 0,
        avgResponseHours: Math.round(avgResponseHours * 10) / 10,
        };
    }

    async assignPartner(id: string, organizationId: string, partnerName: string) {
        return prisma.travelRequest.update({
        where: { id, organizationId },
        data: { partnerName },
        });
    }

    async updatePayment(id: string, organizationId: string, data: { paymentStatus?: PaymentStatus; paymentLink?: string }) {
        return prisma.travelRequest.update({
        where: { id, organizationId },
        data,
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

    async approveExpense(id: string, organizationId: string, approverId: string) {
        return prisma.expenseReport.update({
        where: { id, organizationId },
        data: { status: "APPROVED", approvedById: approverId, approvedAt: new Date() },
        include: { employee: { select: { userId: true } } },
        });
    }

    async rejectExpense(id: string, organizationId: string, note: string) {
        return prisma.expenseReport.update({
        where: { id, organizationId },
        data: { status: "REJECTED", rejectionNote: note },
        include: { employee: { select: { userId: true } } },
        });
    }

    // ── Rappels de voyage ────────────────────────────────

    async getUpcomingForReminder(windowStart: Date, windowEnd: Date) {
        return prisma.travelRequest.findMany({
        where: {
            status: "APPROVED",
            tripReminderSentAt: null,
            departureDate: { gte: windowStart, lte: windowEnd },
        },
        });
    }

    async markReminderSent(id: string) {
        return prisma.travelRequest.update({
        where: { id },
        data: { tripReminderSentAt: new Date() },
        });
    }
}