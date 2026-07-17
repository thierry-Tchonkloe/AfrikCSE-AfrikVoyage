import { prisma } from "../../../core/config/prisma";
import { Role } from "@prisma/client";
import crypto from "node:crypto";
import { logger } from "../../../core/utils/logger";

export class UserRepository {
    /**
     * Liste paginée des users d'une organisation, avec recherche et filtre par département
     */
    async findByOrganization(organizationId: string, params: {
        page: number;
        limit: number;
        search?: string;
        department?: string;
    }) {
        const { page, limit, search, department } = params;
        const skip = (page - 1) * limit;

        const where: any = { organizationId };
        if (department) where.department = department;
        if (search) {
        where.OR = [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
        }

        const [data, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            jobTitle: true,
            department: true,
            phone: true,
            profileCompleted: true,
            lastLoginAt: true,
            createdAt: true,
            manager: {
                select: { id: true, firstName: true, lastName: true },
            },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.user.count({ where }),
        ]);

        return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    async findById(id: string) {
        return prisma.user.findUnique({
        where: { id },
        omit: {
            password: true,
            refreshToken: true,
            resetPasswordToken: true,
            resetPasswordExpiresAt: true,
        },
        include: {
            organization: { select: { id: true, name: true, status: true } },
            manager: { select: { id: true, firstName: true, lastName: true } },
        },
        });
    }

    /**
     * Crée un user sans mot de passe défini
     * Un token de reset est généré pour l'invitation par email
     */
    async create(data: {
        email: string;
        firstName: string;
        lastName: string;
        role: Role;
        organizationId: string;
        jobTitle?: string;
        department?: string;
        phone?: string;
        managerId?: string;
    }) {
        // Mot de passe temporaire aléatoire — sera remplacé via invitation
        const tempPassword = crypto.randomBytes(32).toString("hex");

        // Token d'invitation valable 72h
        const inviteToken = crypto.randomBytes(32).toString("hex");
        const inviteTokenHash = crypto
        .createHash("sha256")
        .update(inviteToken)
        .digest("hex");

        const user = await prisma.user.create({
        data: {
            email: data.email,
            password: tempPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            organizationId: data.organizationId,
            jobTitle: data.jobTitle,
            department: data.department,
            phone: data.phone,
            managerId: data.managerId,
            // Réutilise le champ resetPassword pour l'invitation
            resetPasswordToken: inviteTokenHash,
            resetPasswordExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
        },
        });

        if (process.env.NODE_ENV !== "production") {
            logger.debug(`Invitation token pour ${data.email}: ${inviteToken}`);
        }

        return { user, inviteToken };
    }

    async update(id: string, data: {
        firstName?: string;
        lastName?: string;
        jobTitle?: string;
        department?: string;
        phone?: string;
        managerId?: string;
    }) {
        return prisma.user.update({ where: { id }, data });
    }

    async changeRole(id: string, role: Role) {
        return prisma.user.update({ where: { id }, data: { role } });
    }

    /** Désactivation soft (pas de suppression physique pour audit) */
    async deactivate(id: string) {
        return prisma.user.update({
        where: { id },
        data: { isActive: false, refreshToken: null },
        });
    }

    async activate(id: string) {
        return prisma.user.update({ where: { id }, data: { isActive: true } });
    }

    /**
     * Liste paginée de tous les users, toutes organisations confondues (Super Admin)
     */
    async findAllPaginated(params: {
        page: number;
        limit: number;
        search?: string;
        department?: string;
    }) {
        const { page, limit, search, department } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (department) where.department = department;
        if (search) {
        where.OR = [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
        }

        const [data, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            organizationId: true,
            organization: { select: { name: true } },
            createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.user.count({ where }),
        ]);

        return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    /** Membres de l'organisation hôte (Waxeho) — pour la gestion des accès Super Admin */
    async findHostUsers() {
        return prisma.user.findMany({
        where: { organization: { isHost: true } },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
        },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        });
    }
}