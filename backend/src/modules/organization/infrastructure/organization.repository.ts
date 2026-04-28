import { prisma } from "../../../core/config/prisma";
import { OrgStatus } from "@prisma/client";
import crypto from "node:crypto";

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

    /** Création directe par Super Admin (avec lien d'invitation) */

    async createByAdmin(data: {
        name: string;
        slug: string;
        plan: string;
        status: string;
        hasVoyage: boolean;
        hasCSE: boolean;
        businessEmail?: string;
        country?: string;
        phone?: string;
        city?: string;
        notes?: string;
        adminFirstName: string;
        adminLastName: string;
        adminEmail: string;
    }) {
    return prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
            data: {
                name: data.name,
                slug: data.slug,
                plan: data.plan as any,
                status: data.status as any,
                hasVoyage: data.hasVoyage,
                hasCSE: data.hasCSE,
                businessEmail: data.businessEmail,
                country: data.country,
                phone: data.phone,
                city: data.city,
            },
        });

        // Génère le token d'invitation (valable 7 jours)
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

        await tx.invitationToken.create({
            data: {
                token: hashedToken,
                organizationId: org.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        // Crée l'admin avec le token d'invitation dans resetPassword
        const tempPassword = crypto.randomBytes(32).toString("hex");
        const admin = await tx.user.create({
            data: {
                email: data.adminEmail,
                password: tempPassword,
                firstName: data.adminFirstName,
                lastName: data.adminLastName,
                role: "ADMIN",
                organizationId: org.id,
                resetPasswordToken: hashedToken,
                resetPasswordExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        return { org, admin, invitationToken: rawToken };
    });
    }

    /** Valide + génère le lien d'invitation pour l'admin */
    async validateWithInvitation(
        id: string,
        superAdminId: string,
        hasVoyage: boolean,
        hasCSE: boolean
    ) {
    return prisma.$transaction(async (tx) => {
        const org = await tx.organization.update({
            where: { id },
            data: {
                status: "ACTIVE",
                hasVoyage,
                hasCSE,
                validatedAt: new Date(),
                validatedById: superAdminId,
            },
            include: { users: { where: { role: "ADMIN" }, take: 1 } },
        });

        // Génère le token d'invitation
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

        await tx.invitationToken.create({
            data: {
                token: hashedToken,
                organizationId: id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        // Met à jour le token de l'admin pour l'activation
        if (org.users[0]) {
            await tx.user.update({
                where: { id: org.users[0].id },
                data: {
                resetPasswordToken: hashedToken,
                resetPasswordExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
        }

        return { org, invitationToken: rawToken };
    });
    }

    /** Suppression soft — désactive org + tous ses users */
    async softDelete(id: string) {
        return prisma.$transaction(async (tx) => {
            await tx.user.updateMany({
                where: { organizationId: id },
                data: { isActive: false, refreshToken: null },
            });
            return tx.organization.update({
                where: { id },
                data: { status: "SUSPENDED" },
            });
        });
    }

    /** Pagination + filtres pour la liste */
    async findPaginated(params: {
        page: number;
        limit: number;
        search?: string;
        status?: string;
        module?: string;
    }) {
    const { page, limit, search, status, module } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
        where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { businessEmail: { contains: search, mode: "insensitive" } },
        ];
    }
    if (status) where.status = status;
    if (module === "CSE") where.hasCSE = true;
    if (module === "VOYAGE") where.hasVoyage = true;

    const [data, total] = await Promise.all([
        prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { users: true } },
            users: {
            where: { role: "ADMIN" },
            select: { firstName: true, lastName: true, email: true },
            take: 1,
            },
        },
        }),
        prisma.organization.count({ where }),
    ]);

    return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
    }
}