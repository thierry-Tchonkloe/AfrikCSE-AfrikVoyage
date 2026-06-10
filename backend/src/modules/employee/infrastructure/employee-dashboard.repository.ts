import { prisma } from "../../../core/config/prisma";

export class EmployeeDashboardRepository {

    // ── Dashboard ─────────────────────────────────────────────────────────────

    async getDashboardData(userId: string, orgId: string) {
        const [
            benefitRequests,
            travelRequests,
            expenseReports,
            nextTravel,
            recentActivity,
            benefitBalance,
        ] = await Promise.all([
            prisma.benefitRequest.count({
                where: {
                    organizationId: orgId,
                    employee: { userId },
                    status: "APPROVED",
                    createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) },
                },
            }),
            prisma.travelRequest.count({
                where: {
                    organizationId: orgId,
                    requestedById: userId,
                    status: { in: ["APPROVED", "PENDING"] },
                },
            }),
            prisma.expenseReport.count({
                where: {
                    organizationId: orgId,
                    employee: { userId },
                    status: "PENDING",
                },
            }),
            prisma.travelRequest.findFirst({
                where: {
                    requestedById: userId,
                    status: "APPROVED",
                    departureDate: { gte: new Date() },
                },
                orderBy: { departureDate: "asc" },
            }),
            prisma.expenseReport.findMany({
                where: { employee: { userId } },
                take: 4,
                orderBy: { createdAt: "desc" },
                select: { id: true, title: true, amount: true, status: true, createdAt: true },
            }),
            prisma.benefitCategory.aggregate({
                where: { organizationId: orgId },
                _sum: { perEmployeeLimit: true },
            }),
        ]);

        return {
            stats: {
                cseBalance: benefitBalance._sum.perEmployeeLimit ?? 0,
                nextTripDays: nextTravel
                    ? Math.ceil(
                        (new Date(nextTravel.departureDate).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    )
                    : null,
                nextTripRoute: nextTravel ? nextTravel.destination : null,
                pendingExpenses: expenseReports,
                benefitsUsed: benefitRequests,
                activeTravels: travelRequests,
            },
            nextTravel,
            recentActivity,
        };
    }

    // ── Voyages ───────────────────────────────────────────────────────────────

    async getMyTravels(userId: string) {
        return prisma.travelRequest.findMany({
            where: { requestedById: userId },
            orderBy: { createdAt: "desc" },
        });
    }

    async createTravelRequest(userId: string, orgId: string, data: {
        destination: string;
        purpose?: string;
        departureDate: Date;
        returnDate: Date;
        estimatedCost?: number;
        department?: string;
    }) {
        return prisma.travelRequest.create({
            data: {
                ...data,
                organizationId: orgId,
                requestedById: userId,
                status: "PENDING",
            },
        });
    }

    // ── Notes de frais ────────────────────────────────────────────────────────

    async getMyExpenses(userId: string) {
        const emp = await prisma.employee.findUnique({ where: { userId } });
        if (!emp) return [];
        return prisma.expenseReport.findMany({
            where: { employeeId: emp.id },
            orderBy: { createdAt: "desc" },
        });
    }

    async createExpense(userId: string, orgId: string, data: {
        title: string;
        amount: number;
        destination?: string;
        description?: string;
        department?: string;
        departureDate?: Date;
        returnDate?: Date;
    }) {
        const emp = await prisma.employee.findUnique({ where: { userId } });
        if (!emp) throw new Error("Profil employé introuvable");

        return prisma.expenseReport.create({
            data: {
                ...data,
                organizationId: orgId,
                employeeId: emp.id,
                status: "PENDING",
            },
        });
    }

    // ── Avantages CSE ─────────────────────────────────────────────────────────

    async getBenefitCategoriesForEmployee(orgId: string, userId: string) {
        const [categories, employee] = await Promise.all([
            prisma.benefitCategory.findMany({
                where: { organizationId: orgId, isActive: true },
                include: {
                    _count: { select: { requests: true } },
                },
                orderBy: { name: "asc" },
            }),
            prisma.employee.findUnique({
                where: { userId },
                select: { id: true },
            }),
        ]);

        if (!employee) return categories;

        // Calcule le montant déjà utilisé par cet employé par catégorie
        const usedByCategory = await prisma.benefitRequest.groupBy({
            by: ["categoryId"],
            where: {
                organizationId: orgId,
                employee: { userId },
                status: { in: ["APPROVED", "PENDING"] },
                createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) },
            },
            _sum: { amount: true },
        });

        const usedMap = new Map(
            usedByCategory.map((r) => [r.categoryId, r._sum.amount ?? 0])
        );

        return categories.map((cat) => ({
            ...cat,
            usedAmount: usedMap.get(cat.id) ?? 0,
            remainingAmount: Math.max(0, cat.perEmployeeLimit - (usedMap.get(cat.id) ?? 0)),
        }));
    }

    async getMyBenefitRequests(userId: string) {
        const emp = await prisma.employee.findUnique({ where: { userId } });
        if (!emp) return [];

        return prisma.benefitRequest.findMany({
            where: { employeeId: emp.id },
            include: {
                category: { select: { id: true, name: true, icon: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async createBenefitRequest(userId: string, orgId: string, data: {
        categoryId: string;
        amount: number;
        description?: string;
        urgency?: "LOW" | "MEDIUM" | "HIGH";
    }) {
        const emp = await prisma.employee.findUnique({ where: { userId } });
        if (!emp) throw new Error("Profil employé introuvable");

        // Vérifier que la catégorie appartient bien à l'organisation
        const category = await prisma.benefitCategory.findFirst({
            where: { id: data.categoryId, organizationId: orgId, isActive: true },
        });
        if (!category) throw new Error("Catégorie introuvable ou inactive");

        // Vérifier le plafond par employé (annuel)
        const yearStart = new Date(new Date().getFullYear(), 0, 1);
        const usedThisYear = await prisma.benefitRequest.aggregate({
            where: {
                employeeId: emp.id,
                categoryId: data.categoryId,
                status: { in: ["APPROVED", "PENDING"] },
                createdAt: { gte: yearStart },
            },
            _sum: { amount: true },
        });

        const used = usedThisYear._sum.amount ?? 0;
        if (used + data.amount > category.perEmployeeLimit) {
            throw new Error(
                `Plafond dépassé — vous avez déjà utilisé ${used} sur un plafond de ${category.perEmployeeLimit}`
            );
        }

        return prisma.benefitRequest.create({
            data: {
                ...data,
                employeeId: emp.id,
                organizationId: orgId,
                status: "PENDING",
                urgency: data.urgency ?? "MEDIUM",
            },
            include: {
                category: { select: { id: true, name: true, icon: true } },
            },
        });
    }

    async cancelBenefitRequest(requestId: string, userId: string) {
        const emp = await prisma.employee.findUnique({ where: { userId } });
        if (!emp) throw new Error("Profil employé introuvable");

        const request = await prisma.benefitRequest.findFirst({
            where: { id: requestId, employeeId: emp.id },
        });
        if (!request) throw new Error("Demande introuvable");
        if (request.status !== "PENDING") throw new Error("Seules les demandes en attente peuvent être annulées");

        return prisma.benefitRequest.update({
            where: { id: requestId },
            data: { status: "CANCELLED" },
        });
    }

    async getBenefitBalance(userId: string, orgId: string) {
        const yearStart = new Date(new Date().getFullYear(), 0, 1);

        const [categories, usedByCategory] = await Promise.all([
            prisma.benefitCategory.findMany({
                where: { organizationId: orgId, isActive: true },
                select: { id: true, name: true, perEmployeeLimit: true },
            }),
            prisma.benefitRequest.groupBy({
                by: ["categoryId"],
                where: {
                    organizationId: orgId,
                    employee: { userId },
                    status: { in: ["APPROVED", "PENDING"] },
                    createdAt: { gte: yearStart },
                },
                _sum: { amount: true },
            }),
        ]);

        const usedMap = new Map(
            usedByCategory.map((r) => [r.categoryId, r._sum.amount ?? 0])
        );

        const totalLimit = categories.reduce((s, c) => s + c.perEmployeeLimit, 0);
        const totalUsed  = usedByCategory.reduce((s, r) => s + (r._sum.amount ?? 0), 0);

        return {
            totalLimit,
            totalUsed,
            totalRemaining: Math.max(0, totalLimit - totalUsed),
            byCategory: categories.map((cat) => ({
                id: cat.id,
                name: cat.name,
                limit: cat.perEmployeeLimit,
                used: usedMap.get(cat.id) ?? 0,
                remaining: Math.max(0, cat.perEmployeeLimit - (usedMap.get(cat.id) ?? 0)),
            })),
        };
    }

    // ── Profil ────────────────────────────────────────────────────────────────

    async updateProfile(userId: string, data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        jobTitle?: string;
        department?: string;
    }) {
        return prisma.user.update({ where: { id: userId }, data });
    }

    // ── Documents ─────────────────────────────────────────────────────────────

    async getDocuments(userId: string) {
        return prisma.userDocument.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    }

    async addDocument(userId: string, data: {
        name: string; url: string; type: string; size?: string;
    }) {
        return prisma.userDocument.create({ data: { ...data, userId } });
    }

    async deleteDocument(id: string, userId: string) {
        return prisma.userDocument.deleteMany({ where: { id, userId } });
    }
}
