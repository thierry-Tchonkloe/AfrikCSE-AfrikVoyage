import { prisma } from "../../../core/config/prisma";

export class SettingsRepository {
    /** Récupère les settings (crée l'enregistrement par défaut si inexistant) */
    async get() {
        return prisma.platformSettings.upsert({
        where: { id: "singleton" },
        update: {},
        create: { id: "singleton" },
        });
    }

    async update(data: Partial<{
        logoUrl: string;
        primaryColor: string;
        secondaryColor: string;
        darkModeEnabled: boolean;
        manualValidation: boolean;
        autoRegistration: boolean;
        defaultHasCSE: boolean;
        defaultHasVoyage: boolean;
        notifyOnValidation: boolean;
        notifyOnRejection: boolean;
        notifyWelcome: boolean;
    }>) {
        return prisma.platformSettings.upsert({
        where: { id: "singleton" },
        update: data,
        create: { id: "singleton", ...data },
        });
    }

    /** Stats globales pour le dashboard */
    async getStats() {
        const [total, pending, active, suspended, totalUsers] = await Promise.all([
        prisma.organization.count(),
        prisma.organization.count({ where: { status: "PENDING" } }),
        prisma.organization.count({ where: { status: "ACTIVE" } }),
        prisma.organization.count({ where: { status: "SUSPENDED" } }),
        prisma.user.count(),
        ]);

        return { total, pending, active, suspended, totalUsers };
    }

    /** Dernières inscriptions pour le dashboard */
    async getRecentOrganizations(limit = 5) {
        return prisma.organization.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { users: true } },
        },
        });
    }

    /** Évolution mensuelle des inscriptions (12 derniers mois) */
    async getMonthlyStats() {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const orgs = await prisma.organization.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
        });

        // Groupe par mois
        const months: Record<string, number> = {};
        orgs.forEach((org) => {
        const key = org.createdAt.toISOString().slice(0, 7); // "2024-01"
        months[key] = (months[key] || 0) + 1;
        });

        return Object.entries(months).map(([month, count]) => ({ month, count }));
    }
}