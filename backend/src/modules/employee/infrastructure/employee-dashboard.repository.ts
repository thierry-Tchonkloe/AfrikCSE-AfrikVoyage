import { prisma } from "../../../core/config/prisma";

export class EmployeeDashboardRepository {
    async getDashboardData(userId: string, orgId: string) {
        const [
        benefitRequests,
        travelRequests,
        expenseReports,
        nextTravel,
        recentActivity,
        benefitBalance,
        ] = await Promise.all([
        // Avantages utilisés cette année
        prisma.benefitRequest.count({
            where: {
            organizationId: orgId,
            employee: { userId },
            status: "APPROVED",
            createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) },
            },
        }),

        // Voyages actifs
        prisma.travelRequest.count({
            where: {
            organizationId: orgId,
            requestedById: userId,
            status: { in: ["APPROVED", "PENDING"] },
            },
        }),

        // Notes de frais en attente
        prisma.expenseReport.count({
            where: {
            organizationId: orgId,
            employee: { userId },
            status: "PENDING",
            },
        }),

        // Prochain voyage
        prisma.travelRequest.findFirst({
            where: {
            requestedById: userId,
            status: "APPROVED",
            departureDate: { gte: new Date() },
            },
            orderBy: { departureDate: "asc" },
        }),

        // Activité récente — notes de frais + voyages
        prisma.expenseReport.findMany({
            where: { employee: { userId } },
            take: 4,
            orderBy: { createdAt: "desc" },
            select: {
            id: true, title: true, amount: true,
            status: true, createdAt: true,
            },
        }),

        // Balance CSE (budget restant)
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
            nextTripRoute: nextTravel
            ? `${nextTravel.destination}`
            : null,
            pendingExpenses: expenseReports,
            benefitsUsed: benefitRequests,
            activeTravels: travelRequests,
        },
        nextTravel,
        recentActivity,
        };
    }

    async getMyTravels(userId: string) {
        return prisma.travelRequest.findMany({
        where: { requestedById: userId },
        orderBy: { createdAt: "desc" },
        });
    }

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

    // ── Documents profil ──

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

    // ── Profile update ──

    async updateProfile(userId: string, data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        jobTitle?: string;
        department?: string;
    }) {
        return prisma.user.update({ where: { id: userId }, data });
    }
}