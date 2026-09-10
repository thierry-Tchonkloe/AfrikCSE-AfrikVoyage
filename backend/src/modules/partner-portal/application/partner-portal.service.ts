import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { UploadApiResponse } from "cloudinary";
import { PartnerPaymentMethodType } from "@prisma/client";
import { PartnerPortalRepository } from "../infrastructure/partner-portal.repository";
import { prisma } from "../../../core/config/prisma";
import { AppError } from "../../../core/errors/app.error";
import { hashToken } from "../../../core/utils/hash";
import { encrypt } from "../../../core/utils/crypto";
import { cloudinary } from "../../../core/config/cloudinary";

const repo = new PartnerPortalRepository();

function uploadImageToCloudinary(buffer: Buffer, folder: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "image" },
            (err, result) => {
                if (err || !result) reject(err ?? new Error("Échec de l'upload"));
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
}

/** Aperçu non-sensible affichable en UI (ex: "•••• 4821") — dérivé, jamais réversible vers la valeur brute. */
function maskDetails(details: Record<string, string>): string | undefined {
    const value = Object.values(details).find((v) => v.trim().length > 0);
    if (!value) return undefined;
    return `•••• ${value.slice(-4)}`;
}

// Pas de fallback en dur : server.ts vérifie déjà JWT_SECRET au boot. Typé
// `string` (pas `string | undefined`) via l'IIFE ci-dessous pour que le
// contrôle de flux TypeScript reste valable dans les fonctions plus bas.
const JWT_SECRET: string = process.env.JWT_SECRET ?? (() => {
    throw new Error("JWT_SECRET manquant dans l'environnement");
})();
const ACCESS_TOKEN_EXPIRES  = process.env.JWT_PARTNER_ACCESS_EXPIRES  ?? "24h";
const REFRESH_TOKEN_EXPIRES = process.env.JWT_PARTNER_REFRESH_EXPIRES ?? "90d";

export interface PartnerTokenPayload {
    partnerUserId: string;
    partnerId:     string;
    role:          string;
    tokenVersion:  number;
}

// Claim `type` : même remarque que core/utils/jwt.ts — access et refresh
// partagent le même secret et la même forme de payload, ce claim empêche un
// refresh token volé d'être rejoué comme access token.
type SignedPartnerTokenPayload = PartnerTokenPayload & { type: "access" | "refresh" };

function signPartnerAccessToken(payload: PartnerTokenPayload): string {
    return jwt.sign({ ...payload, type: "access" }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES } as never);
}

function signPartnerRefreshToken(payload: PartnerTokenPayload): string {
    return jwt.sign({ ...payload, type: "refresh" }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES } as never);
}

function toSessionUser(user: {
    id: string; email: string; firstName: string; lastName: string;
    role: string; partnerId: string; partner: { name: string; logoUrl?: string | null } | null;
}) {
    return {
        id: user.id, email: user.email,
        firstName: user.firstName, lastName: user.lastName,
        role: user.role, partnerId: user.partnerId,
        partnerName: user.partner?.name ?? "",
        partnerLogoUrl: user.partner?.logoUrl ?? null,
    };
}

export class PartnerPortalService {
    // ── Auth ──────────────────────────────────────────────────────────────────

    async login(email: string, password: string) {
        const user = await repo.findUserByEmail(email);
        if (!user || !user.isActive) throw new AppError("Identifiants invalides", 401);
        if (!user.partner || (user.partner as { status: string }).status === "SUSPENDED") {
            throw new AppError("Accès au portail partenaire désactivé", 403);
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) throw new AppError("Identifiants invalides", 401);

        const payload: PartnerTokenPayload = {
            partnerUserId: user.id,
            partnerId:     user.partnerId,
            role:          user.role,
            tokenVersion:  user.tokenVersion,
        };
        const accessToken  = signPartnerAccessToken(payload);
        const refreshToken = signPartnerRefreshToken(payload);

        await repo.updateRefreshToken(user.id, hashToken(refreshToken));
        await repo.updateUserLastLogin(user.id);

        return {
            accessToken,
            refreshToken,
            user: toSessionUser(user as never),
        };
    }

    /** Renouvelle la paire de tokens via le refresh token (cookie partnerRefreshToken) */
    async refresh(refreshToken: string) {
        let payload: SignedPartnerTokenPayload;
        try {
            payload = jwt.verify(refreshToken, JWT_SECRET) as SignedPartnerTokenPayload;
            if (payload.type !== "refresh") throw new Error("Type de token invalide");
        } catch {
            throw new AppError("Refresh token invalide", 401);
        }

        const user = await repo.findUserById(payload.partnerUserId);
        if (!user || !user.isActive || !user.refreshToken) {
            throw new AppError("Session partenaire expirée, veuillez vous reconnecter", 401);
        }
        if (user.refreshToken !== hashToken(refreshToken)) {
            throw new AppError("Refresh token invalide", 401);
        }
        if (user.tokenVersion !== payload.tokenVersion) {
            throw new AppError("Session partenaire expirée, veuillez vous reconnecter", 401);
        }

        const newPayload: PartnerTokenPayload = {
            partnerUserId: user.id,
            partnerId:     user.partnerId,
            role:          user.role,
            tokenVersion:  user.tokenVersion,
        };
        const newAccessToken  = signPartnerAccessToken(newPayload);
        const newRefreshToken = signPartnerRefreshToken(newPayload);

        // Rotation : le hash en base doit refléter le nouveau refresh token.
        await repo.updateRefreshToken(user.id, hashToken(newRefreshToken));

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    /** Révoque immédiatement tous les tokens (access ET refresh) de la session */
    async logout(partnerUserId: string) {
        await repo.revokeSessions(partnerUserId);
    }

    /**
     * Réinitialise/active le mot de passe d'un PartnerUser via son token
     * (bootstrap à la création du partenaire, ou futur "mot de passe oublié").
     * Délégué depuis AuthService.resetPassword() — même mécanisme que User, cf.
     * AuthService.login() qui délègue déjà de la même façon. Retourne `false`
     * (plutôt que de lever une erreur) quand aucun PartnerUser ne correspond au
     * token, pour laisser l'appelant retomber sur son propre message générique
     * "lien invalide" sans révéler quel système de compte a été essayé.
     */
    async resetPasswordByToken(token: string, password: string): Promise<boolean> {
        const user = await repo.findUserByResetToken(hashToken(token));
        if (!user) return false;
        const hashedPassword = await bcrypt.hash(password, 12);
        await repo.setPasswordFromToken(user.id, hashedPassword);
        return true;
    }

    /** Profil de session courant — utilisé par le frontend pour vérifier/afficher la session */
    async me(partnerUserId: string) {
        const user = await repo.findUserById(partnerUserId);
        if (!user || !user.isActive) throw new AppError("Session expirée, veuillez vous reconnecter", 401);
        return toSessionUser(user as never);
    }

    async createStaff(adminPartnerId: string, adminId: string, data: {
        email: string; password: string; firstName: string; lastName: string;
    }) {
        const existing = await repo.findUserByEmail(data.email);
        if (existing) throw new AppError("Un utilisateur avec cet email existe déjà", 409);
        const passwordHash = await bcrypt.hash(data.password, 12);
        return repo.createUser({
            partnerId:    adminPartnerId,
            email:        data.email,
            passwordHash,
            firstName:    data.firstName,
            lastName:     data.lastName,
            role:         "PARTNER_STAFF",
            invitedById:  adminId,
        });
    }

    async listStaff(partnerId: string) {
        return repo.listStaff(partnerId);
    }

    async deactivateStaff(id: string, partnerId: string) {
        return repo.deactivateUser(id, partnerId);
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    async getProfile(partnerId: string) {
        const partner = await repo.getPartner(partnerId);
        if (!partner) throw new AppError("Partenaire introuvable", 404);
        return partner;
    }

    async updateProfile(partnerId: string, data: Parameters<typeof repo.updatePartnerProfile>[1]) {
        return repo.updatePartnerProfile(partnerId, data);
    }

    // ── Locations ─────────────────────────────────────────────────────────────

    async createLocation(partnerId: string, data: Parameters<typeof repo.createLocation>[1]) {
        return repo.createLocation(partnerId, data);
    }

    async updateLocation(id: string, partnerId: string, data: Parameters<typeof repo.updateLocation>[2]) {
        return repo.updateLocation(id, partnerId, data);
    }

    async deleteLocation(id: string, partnerId: string) {
        return repo.deleteLocation(id, partnerId);
    }

    async setAvailabilities(locationId: string, partnerId: string, slots: Parameters<typeof repo.setAvailabilities>[2]) {
        return repo.setAvailabilities(locationId, partnerId, slots);
    }

    // ── Offers ────────────────────────────────────────────────────────────────

    async listOffers(partnerId: string) {
        return repo.listOffers(partnerId);
    }

    async createOffer(partnerId: string, data: Parameters<typeof repo.createOffer>[2]) {
        // Attach to a default platform-wide org (SA-owned org, nullable workaround)
        // In production, offres partenaires sont liées à une org hôte
        const hostOrg = await this._getHostOrgId();
        return repo.createOffer(partnerId, hostOrg, data);
    }

    async updateOffer(id: string, partnerId: string, data: Parameters<typeof repo.updateOffer>[2]) {
        return repo.updateOffer(id, partnerId, data);
    }

    async uploadOfferImage(partnerId: string, fileBuffer: Buffer) {
        const result = await uploadImageToCloudinary(fileBuffer, `afrikcse/offers/${partnerId}`);
        return { imageUrl: result.secure_url };
    }

    async uploadPartnerLogo(partnerId: string, fileBuffer: Buffer) {
        const result = await uploadImageToCloudinary(fileBuffer, `afrikcse/logos/partners/${partnerId}`);
        const partner = await repo.updatePartnerProfile(partnerId, { logoUrl: result.secure_url });
        return { logoUrl: partner.logoUrl };
    }

    // ── Paramètres ────────────────────────────────────────────────────────────

    async getSettings(partnerId: string) {
        const partner = await repo.getSettingsPartner(partnerId);
        if (!partner) throw new AppError("Partenaire introuvable", 404);
        const { apiKeyEncrypted, ...rest } = partner;
        const paymentMethods = await repo.listPaymentMethods(partnerId);
        return { ...rest, hasApiKey: !!apiKeyEncrypted, paymentMethods };
    }

    async updateCurrency(partnerId: string, currencyCode: string) {
        const partner = await repo.updateCurrency(partnerId, currencyCode);
        return { currencyCode: partner.currencyCode };
    }

    async updateApiIntegration(partnerId: string, data: {
        apiEnabled?: boolean; apiBaseUrl?: string; apiFormat?: string; apiKey?: string;
    }) {
        const { apiKey, ...rest } = data;
        const partner = await repo.updateApiIntegration(partnerId, {
            ...rest,
            ...(apiKey !== undefined ? { apiKeyEncrypted: encrypt(apiKey) } : {}),
        });
        return {
            apiEnabled: partner.apiEnabled,
            apiBaseUrl: partner.apiBaseUrl,
            apiFormat:  partner.apiFormat,
            hasApiKey:  !!partner.apiKeyEncrypted,
        };
    }

    // ── Moyens de réception de paiement ─────────────────────────────────────────

    async listPaymentMethods(partnerId: string) {
        return repo.listPaymentMethods(partnerId);
    }

    async createPaymentMethod(partnerId: string, createdById: string, data: {
        type: PartnerPaymentMethodType; provider: string; label: string; details: Record<string, string>;
    }) {
        return repo.createPaymentMethod(partnerId, createdById, {
            type:             data.type,
            provider:         data.provider,
            label:            data.label,
            detailsEncrypted: encrypt(JSON.stringify(data.details)),
            maskedHint:       maskDetails(data.details),
        });
    }

    async updatePaymentMethod(id: string, partnerId: string, data: {
        label?: string; isActive?: boolean; details?: Record<string, string>;
    }) {
        const { details, ...rest } = data;
        return repo.updatePaymentMethod(id, partnerId, {
            ...rest,
            ...(details ? { detailsEncrypted: encrypt(JSON.stringify(details)), maskedHint: maskDetails(details) } : {}),
        });
    }

    async deletePaymentMethod(id: string, partnerId: string) {
        return repo.deletePaymentMethod(id, partnerId);
    }

    private async _getHostOrgId(): Promise<string> {
        const org = await prisma.organization.findFirst({ where: { isHost: true }, select: { id: true } });
        if (!org) throw new AppError("Organisation hôte introuvable", 500);
        return org.id;
    }
}
