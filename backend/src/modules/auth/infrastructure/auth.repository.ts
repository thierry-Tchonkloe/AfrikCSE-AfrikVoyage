//import { email } from './../../../../node_modules/zod/src/v4/core/regexes';
// import { prisma } from "../../../core/config/prisma";
// import { Prisma } from "@prisma/client";

// export class AuthRepository {
//   /** Trouve un user par email (avec son organisation) */
//     async findUserByEmail(email: string) {
//         return prisma.user.findUnique({
//         where: { email },
//         include: {
//             organization: true,
//         },
//         });
//     }

//     /** Trouve un user par ID */
//     async findUserById(id: string) {
//         return prisma.user.findUnique({
//         where: { id },
//         include: { organization: true },
//         });
//     }

//     /** Crée l'organisation et l'admin en une seule transaction atomique */
//     async createOrganizationWithAdmin(data: {
//         org: Prisma.OrganizationCreateInput;
//         admin: Omit<Prisma.UserCreateInput, "organization">;
//     }) {
//         // Transaction : si l'une échoue, tout est annulé
//         return prisma.$transaction(async (tx) => {
//         const org = await tx.organization.create({ data: data.org });

//         const admin = await tx.user.create({
//             data: {
//             ...data.admin,
//             role: 'ADMIN',
//             organizationId: org.id,
//             },
//         });

//         return { org, admin };
//         });
//     }

//     /** Met à jour le refresh token (stocké hashé) */
//     async updateRefreshToken(userId: string, hashedToken: string | null) {
//         return prisma.user.update({
//         where: { id: userId },
//         data: { refreshToken: hashedToken },
//         });
//     }

//     /** Sauvegarde le token de reset password */
//     async saveResetToken(userId: string, hashedToken: string, expiresAt: Date) {
//         return prisma.user.update({
//         where: { id: userId },
//         data: {
//             resetPasswordToken: hashedToken,
//             resetPasswordExpiresAt: expiresAt,
//         },
//         });
//     }

//     /** Trouve un user par son token de reset (non expiré) */
//     async findUserByResetToken(hashedToken: string) {
//         return prisma.user.findFirst({
//         where: {
//             resetPasswordToken: hashedToken,
//             resetPasswordExpiresAt: { gt: new Date() }, // non expiré
//         },
//         });
//     }

//     /** Réinitialise le mot de passe et efface le token */
//     async resetPassword(userId: string, hashedPassword: string) {
//         return prisma.user.update({
//         where: { id: userId },
//         data: {
//             password: hashedPassword,
//             resetPasswordToken: null,
//             resetPasswordExpiresAt: null,
//         },
//         });
//     }

//     /** Met à jour la date de dernier login */
//     async updateLastLogin(userId: string) {
//         return prisma.user.update({
//         where: { id: userId },
//         data: { lastLoginAt: new Date() },
//         });
//     }

//     /** Complète le profil utilisateur */
//     async completeProfile(userId: string, data: Partial<{
//         jobTitle: string;
//         department: string;
//         costCenter: string;
//         phone: string;
//         managerId: string;
//     }>) {
//         return prisma.user.update({
//         where: { id: userId },
//         data: { ...data, profileCompleted: true },
//         });
//     }
// }




import { prisma } from "../../../core/config/prisma";

export class AuthRepository {
    async findUserByEmail(email: string) {
        return prisma.user.findUnique({
        where: { email },
        include: { organization: true },
        });
    }

    async findUserById(id: string) {
        return prisma.user.findUnique({
        where: { id },
        include: { organization: true },
        });
    }

    /** Emails des SUPER_ADMIN actifs — utilisés pour les notifications internes */
    async findSuperAdminEmails(): Promise<string[]> {
        const admins = await prisma.user.findMany({
        where: { role: "SUPER_ADMIN", isActive: true },
        select: { email: true },
        });
        return admins.map((a) => a.email);
    }

    /**
     * Transaction atomique : crée l'org puis l'admin
     * On utilise UserUncheckedCreateInput (champs scalaires directs)
     * pour éviter le conflit relation/clé étrangère de Prisma
     */
    async createOrganizationWithAdmin(data: {
        org: {
        name: string;
        slug: string;
        plan: string;
        status: string;
        businessEmail?: string;
        country?: string;
        phone?: string;
        size?: string;
        industry?: string;
        address?: string;
        city?: string;
        region?: string;
        postalCode?: string;
        hasVoyage: boolean;
        hasCSE: boolean;
        email?: string,
        };
        admin: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        };
    }) {
        return prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
            data: {
            name: data.org.name,
            slug: data.org.slug,
            plan: data.org.plan as any,
            status: data.org.status as any,
            businessEmail: data.org.businessEmail,
            country: data.org.country,
            phone: data.org.phone,
            size: data.org.size,
            industry: data.org.industry,
            address: data.org.address,
            email: data.org.email || "",
            city: data.org.city,
            region: data.org.region,
            postalCode: data.org.postalCode,
            hasVoyage: data.org.hasVoyage,
            hasCSE: data.org.hasCSE,
            },
        });

        const admin = await tx.user.create({
            data: {
            email: data.admin.email,
            password: data.admin.password,
            firstName: data.admin.firstName,
            lastName: data.admin.lastName,
            role: "ADMIN",
            // Champ scalaire direct — pas de relation imbriquée
            organizationId: org.id,
            },
        });

        return { org, admin };
        });
    }

    /** Crée une nouvelle session (une par appareil/navigateur) au login */
    async createSession(data: {
        userId: string;
        refreshTokenHash: string;
        expiresAt: Date;
        userAgent?: string | null;
        ipAddress?: string | null;
    }) {
        return prisma.userSession.create({
        data: {
            userId: data.userId,
            refreshTokenHash: data.refreshTokenHash,
            expiresAt: data.expiresAt,
            userAgent: data.userAgent ?? null,
            ipAddress: data.ipAddress ?? null,
        },
        });
    }

    /** Retrouve la session correspondant au refresh token présenté (non expirée) */
    async findSessionByHash(refreshTokenHash: string) {
        return prisma.userSession.findUnique({
        where: { refreshTokenHash },
        });
    }

    /**
     * Rotation : remplace le hash de la session par celui du nouveau refresh
     * token émis, en ciblant UNIQUEMENT cette session (par son id) — les
     * autres sessions du même utilisateur ne sont jamais touchées.
     */
    async rotateSession(sessionId: string, newHash: string, expiresAt: Date) {
        return prisma.userSession.update({
        where: { id: sessionId },
        data: { refreshTokenHash: newHash, expiresAt, lastUsedAt: new Date() },
        });
    }

    /**
     * Déconnexion ciblée : supprime UNIQUEMENT la session de l'appareil courant
     * (identifiée par le hash de son refresh token), en laissant les autres
     * sessions actives de cet utilisateur intactes.
     */
    async deleteSessionByHash(userId: string, refreshTokenHash: string) {
        return prisma.userSession.deleteMany({
        where: { userId, refreshTokenHash },
        });
    }

    /**
     * Révoque TOUTES les sessions d'un user (toutes lignes UserSession) ET
     * incrémente tokenVersion, ce qui invalide immédiatement tout access token
     * déjà émis (vérifié à chaque requête par `authenticate`) — utilisé pour
     * les événements de sécurité globaux (ex : reset password), jamais pour un
     * logout normal qui doit rester limité à l'appareil courant.
     */
    async revokeAllSessions(userId: string) {
        return prisma.$transaction([
        prisma.userSession.deleteMany({ where: { userId } }),
        prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } }),
        ]);
    }

    /** Liste les sessions actives d'un user (appareils connectés), plus récentes d'abord */
    async listSessions(userId: string) {
        return prisma.userSession.findMany({
        where: { userId },
        orderBy: { lastUsedAt: "desc" },
        select: {
            id: true,
            userAgent: true,
            ipAddress: true,
            createdAt: true,
            lastUsedAt: true,
            expiresAt: true,
        },
        });
    }

    /** Retrouve une session par son id, scopée au user (empêche de révoquer la session d'un tiers) */
    async findSessionByIdForUser(userId: string, sessionId: string) {
        return prisma.userSession.findFirst({ where: { id: sessionId, userId } });
    }

    /** Révoque une session précise (un appareil), scopée au user propriétaire */
    async deleteSessionById(userId: string, sessionId: string) {
        return prisma.userSession.deleteMany({ where: { id: sessionId, userId } });
    }

    /**
     * Révoque toutes les sessions d'un user SAUF celle en cours — utilisé par
     * « Déconnexion des autres appareils » : l'utilisateur reste connecté sur
     * l'appareil depuis lequel il déclenche l'action.
     */
    async deleteOtherSessions(userId: string, currentSessionId: string) {
        return prisma.userSession.deleteMany({
        where: { userId, id: { not: currentSessionId } },
        });
    }

    async saveResetToken(userId: string, hashedToken: string, expiresAt: Date) {
        return prisma.user.update({
        where: { id: userId },
        data: {
            resetPasswordToken: hashedToken,
            resetPasswordExpiresAt: expiresAt,
        },
        });
    }

    async findUserByResetToken(hashedToken: string) {
        return prisma.user.findFirst({
        where: {
            resetPasswordToken: hashedToken,
            resetPasswordExpiresAt: { gt: new Date() },
        },
        });
    }

    async resetPassword(userId: string, hashedPassword: string) {
        return prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpiresAt: null,
        },
        });
    }

    async updatePassword(userId: string, hashedPassword: string) {
        return prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
        });
    }

    async updateLastLogin(userId: string) {
        return prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
        });
    }

    async completeProfile(
        userId: string,
        data: Partial<{
        jobTitle: string;
        department: string;
        costCenter: string;
        phone: string;
        managerId: string;
        }>
    ) {
        return prisma.user.update({
        where: { id: userId },
        data: { ...data, profileCompleted: true },
        });
    }
}