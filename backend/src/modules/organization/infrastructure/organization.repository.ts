import { prisma } from "../../../core/config/prisma";
import { OrgStatus } from "@prisma/client";

export class OrganizationRepository {
    /** Liste toutes les organisations avec le nombre d'utilisateurs */
    async findAll(filters?: { status?: OrgStatus }) {
        return prisma.organization.findMany({
        where: filters?.status ? { status: filters.status } : undefined,
        include: {
            _count: { select: { users: true } },
        },
        orderBy: { createdAt: "desc" },
        });
    }

    /** Détail d'une organisation avec ses utilisateurs */
    async findById(id: string) {
        return prisma.organization.findUnique({
        where: { id },
        include: {
            users: {
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
            },
            },
            _count: { select: { users: true } },
        },
        });
    }

    /** Valide une organisation et active les modules demandés */
    async validate(id: string, validatedById: string, hasVoyage: boolean, hasCSE: boolean) {
        return prisma.organization.update({
        where: { id },
        data: {
            status: "ACTIVE",
            hasVoyage,
            hasCSE,
            validatedAt: new Date(),
            validatedById,
            rejectedAt: null,
            rejectionNote: null,
        },
        });
    }

    /** Rejette une organisation avec une note explicative */
    async reject(id: string, rejectionNote: string) {
        return prisma.organization.update({
        where: { id },
        data: {
            status: "REJECTED",
            rejectedAt: new Date(),
            rejectionNote,
            validatedAt: null,
            validatedById: null,
        },
        });
    }

    /** Active ou désactive les modules d'une organisation */
    async updateModules(id: string, hasVoyage: boolean, hasCSE: boolean) {
        return prisma.organization.update({
        where: { id },
        data: { hasVoyage, hasCSE },
        });
    }

    /** Suspend une organisation active */
    async suspend(id: string) {
        return prisma.organization.update({
        where: { id },
        data: { status: "SUSPENDED" },
        });
    }
}