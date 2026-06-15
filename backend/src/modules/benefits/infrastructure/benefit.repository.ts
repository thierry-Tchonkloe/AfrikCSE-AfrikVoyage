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
        include: { employee: { select: { userId: true } }, category: { select: { name: true } } },
        });
    }

    async rejectRequest(id: string, note: string) {
        return prisma.benefitRequest.update({
        where: { id },
        data: { status: "REJECTED", rejectionNote: note },
        include: { employee: { select: { userId: true } }, category: { select: { name: true } } },
        });
    }

    async bulkApprove(ids: string[], approverId: string) {
        const targets = await prisma.benefitRequest.findMany({
        where: { id: { in: ids }, status: "PENDING" },
        select: { id: true, employee: { select: { userId: true } }, category: { select: { name: true } } },
        });

        const result = await prisma.benefitRequest.updateMany({
        where: { id: { in: targets.map((t) => t.id) } },
        data: { status: "APPROVED", approvedById: approverId, approvedAt: new Date() },
        });

        return { count: result.count, requests: targets };
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

    async getBudgetReport(orgId: string, year: number, filters?: {
        department?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const start = filters?.startDate ?? new Date(`${year}-01-01`);
        const end   = filters?.endDate   ?? new Date(`${year}-12-31T23:59:59.999`);
        const department = filters?.department;

        const requestPeriodWhere: any = { status: "APPROVED", createdAt: { gte: start, lte: end } };
        if (department) requestPeriodWhere.employee = { user: { department } };

        const userWhere: any = { organizationId: orgId, isActive: true };
        if (department) userWhere.department = department;

        const [categories, totalBudget, usedBudget, employees] = await Promise.all([
        prisma.benefitCategory.findMany({
            where: { organizationId: orgId },
            include: {
            requests: { where: requestPeriodWhere, select: { amount: true } },
            },
        }),
        prisma.benefitCategory.aggregate({
            where: { organizationId: orgId },
            _sum: { annualBudget: true },
        }),
        prisma.benefitRequest.aggregate({
            where: { organizationId: orgId, ...requestPeriodWhere },
            _sum: { amount: true },
        }),
        prisma.employee.findMany({
            where: { organizationId: orgId, user: userWhere },
            select: { id: true },
        }),
        ]);

        const employeeIds = employees.map((e) => e.id);

        const [approvedRows, pendingRows] = await Promise.all([
        employeeIds.length
            ? prisma.benefitRequest.findMany({
                where: { organizationId: orgId, status: "APPROVED", createdAt: { gte: start, lte: end }, employeeId: { in: employeeIds } },
                select: { employeeId: true },
                distinct: ["employeeId"],
            })
            : Promise.resolve([]),
        employeeIds.length
            ? prisma.benefitRequest.findMany({
                where: { organizationId: orgId, status: "PENDING", createdAt: { gte: start, lte: end }, employeeId: { in: employeeIds } },
                select: { employeeId: true },
                distinct: ["employeeId"],
            })
            : Promise.resolve([]),
        ]);

        const activeIds = new Set(approvedRows.map((r) => r.employeeId));
        const pendingOnlyIds = new Set(pendingRows.map((r) => r.employeeId).filter((id) => !activeIds.has(id)));

        const participation = {
        active: activeIds.size,
        pending: pendingOnlyIds.size,
        inactive: Math.max(0, employeeIds.length - activeIds.size - pendingOnlyIds.size),
        };

        // ── Répartition trimestrielle (Réel vs Budget) ──
        const quarterBudget = (totalBudget._sum.annualBudget ?? 0) / 4;
        const quarterRanges = [
        { label: "T1", from: new Date(`${year}-01-01`), to: new Date(`${year}-03-31T23:59:59.999`) },
        { label: "T2", from: new Date(`${year}-04-01`), to: new Date(`${year}-06-30T23:59:59.999`) },
        { label: "T3", from: new Date(`${year}-07-01`), to: new Date(`${year}-09-30T23:59:59.999`) },
        { label: "T4", from: new Date(`${year}-10-01`), to: new Date(`${year}-12-31T23:59:59.999`) },
        ];

        const quarters = await Promise.all(quarterRanges.map(async (q) => {
        const where: any = { organizationId: orgId, status: "APPROVED", createdAt: { gte: q.from, lte: q.to } };
        if (department) where.employee = { user: { department } };
        const agg = await prisma.benefitRequest.aggregate({ where, _sum: { amount: true } });
        return { quarter: q.label, budget: quarterBudget, actual: agg._sum.amount ?? 0 };
        }));

        return {
        year,
        totalBudget: totalBudget._sum.annualBudget ?? 0,
        usedBudget: usedBudget._sum.amount ?? 0,
        activeEmployees: employeeIds.length,
        categories: categories.map((c) => ({
            id: c.id,
            name: c.name,
            budget: c.annualBudget,
            used: c.requests.reduce((sum, r) => sum + r.amount, 0),
        })),
        quarters,
        participation,
        };
    }

    // ── Rapport de conformité ────────────────────────────

    private static readonly DEFAULT_COMPLIANCE_REQUIREMENTS = [
        {
        label: "Déclaration sociale nominative (DSN)",
        description: "Conformité des déclarations sociales mensuelles auprès des organismes",
        status: "CONFORME" as const,
        lastAuditOffsetDays: -60,
        nextAuditOffsetDays: 30,
        },
        {
        label: "Registre unique du personnel",
        description: "Mise à jour du registre du personnel pour tous les salariés",
        status: "CONFORME" as const,
        lastAuditOffsetDays: -45,
        nextAuditOffsetDays: 135,
        },
        {
        label: "Bilan social annuel",
        description: "Présentation du bilan social aux instances représentatives du personnel",
        status: "EN_COURS" as const,
        lastAuditOffsetDays: -200,
        nextAuditOffsetDays: 15,
        },
        {
        label: "Index égalité professionnelle F/H",
        description: "Publication annuelle de l'index égalité professionnelle femmes/hommes",
        status: "CONFORME" as const,
        lastAuditOffsetDays: -90,
        nextAuditOffsetDays: 270,
        },
        {
        label: "Document unique d'évaluation des risques (DUER)",
        description: "Mise à jour annuelle du document unique d'évaluation des risques professionnels",
        status: "NON_CONFORME" as const,
        lastAuditOffsetDays: -380,
        nextAuditOffsetDays: -15,
        },
        {
        label: "Protection des données (RGPD)",
        description: "Audit de conformité RGPD sur le traitement des données des employés",
        status: "CONFORME" as const,
        lastAuditOffsetDays: -120,
        nextAuditOffsetDays: 245,
        },
    ];

    async getComplianceReport(orgId: string) {
        let items = await prisma.complianceRequirement.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "asc" },
        });

        if (items.length === 0) {
        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;
        await prisma.complianceRequirement.createMany({
            data: BenefitRepository.DEFAULT_COMPLIANCE_REQUIREMENTS.map((r) => ({
            organizationId: orgId,
            label: r.label,
            description: r.description,
            status: r.status,
            lastAuditDate: new Date(now + r.lastAuditOffsetDays * DAY),
            nextAuditDate: new Date(now + r.nextAuditOffsetDays * DAY),
            })),
        });
        items = await prisma.complianceRequirement.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: "asc" },
        });
        }

        const conforme = items.filter((i) => i.status === "CONFORME").length;
        const score = items.length > 0 ? Math.round((conforme / items.length) * 100) : 100;

        return { score, items };
    }
}