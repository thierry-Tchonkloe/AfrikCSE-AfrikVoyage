import { prisma } from "../../../core/config/prisma";
import { Role } from "@prisma/client";
import crypto from "node:crypto";

export class UserRepository {
    /**
     * Liste les users d'une organisation
     * SUPER_ADMIN peut voir toutes les organisations (organizationId = null)
     */
    async findByOrganization(organizationId: string) {
        return prisma.user.findMany({
        where: { organizationId },
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
        });
    }

    async findById(id: string) {
        return prisma.user.findUnique({
        where: { id },
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

        // TODO: Envoyer email d'invitation avec le lien :
        // ${FRONTEND_URL}/auth/set-password?token=${inviteToken}
        console.log(`[DEV] Invitation token pour ${data.email}: ${inviteToken}`);

        return user;
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

    async findAll() {
        return prisma.user.findMany({
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
        });
    }
}