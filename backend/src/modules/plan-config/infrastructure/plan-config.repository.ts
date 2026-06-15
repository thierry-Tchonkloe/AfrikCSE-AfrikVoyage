import { prisma } from "../../../core/config/prisma";

// Plans par défaut — alignés sur l'enum Prisma `Plan` (STARTER/BUSINESS/ENTERPRISE)
// utilisé par Organization.plan, et sur les tarifs de billing.service.ts.
const DEFAULT_PLANS = [
    {
        name: "STARTER",
        label: "Starter",
        price: "Gratuit",
        maxUsers: 10,
        hasVoyage: false,
        hasCSE: true,
        features: ["Gestion des avantages CSE", "Jusqu'à 10 employés", "Support par email"],
        isActive: true,
    },
    {
        name: "BUSINESS",
        label: "Business",
        price: "175 000 FCFA / mois",
        maxUsers: 50,
        hasVoyage: true,
        hasCSE: true,
        features: ["Tous les avantages Starter", "Module Voyages d'affaires", "Jusqu'à 50 employés", "Support prioritaire"],
        isActive: true,
    },
    {
        name: "ENTERPRISE",
        label: "Enterprise",
        price: "Sur devis",
        maxUsers: null,
        hasVoyage: true,
        hasCSE: true,
        features: ["Tous les avantages Business", "Utilisateurs illimités", "Account manager dédié", "SLA personnalisé"],
        isActive: true,
    },
];

export class PlanConfigRepository {
    /** Liste tous les plans — initialise les 3 plans par défaut si la table est vide */
    async findAll() {
        const count = await prisma.planConfig.count();
        if (count === 0) {
            await prisma.planConfig.createMany({ data: DEFAULT_PLANS });
        }
        return prisma.planConfig.findMany({ orderBy: { createdAt: "asc" } });
    }

    async findById(id: string) {
        return prisma.planConfig.findUnique({ where: { id } });
    }

    async findByName(name: string) {
        return prisma.planConfig.findUnique({ where: { name } });
    }

    async create(data: {
        name: string;
        label: string;
        price: string;
        maxUsers?: number | null;
        hasVoyage: boolean;
        hasCSE: boolean;
        features: string[];
        isActive: boolean;
    }) {
        return prisma.planConfig.create({ data });
    }

    async update(id: string, data: Partial<{
        label: string;
        price: string;
        maxUsers: number | null;
        hasVoyage: boolean;
        hasCSE: boolean;
        features: string[];
        isActive: boolean;
    }>) {
        return prisma.planConfig.update({ where: { id }, data });
    }

    async delete(id: string) {
        return prisma.planConfig.delete({ where: { id } });
    }

    /** Nombre d'organisations par plan (basé sur Organization.plan) */
    async countOrganizationsByPlan(): Promise<Record<string, number>> {
        const groups = await prisma.organization.groupBy({
            by: ["plan"],
            _count: { _all: true },
        });
        const counts: Record<string, number> = {};
        for (const g of groups) counts[g.plan] = g._count._all;
        return counts;
    }
}
