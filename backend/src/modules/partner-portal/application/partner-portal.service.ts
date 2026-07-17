import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PartnerPortalRepository } from "../infrastructure/partner-portal.repository";
import { prisma } from "../../../core/config/prisma";
import { AppError } from "../../../core/errors/app.error";

const repo = new PartnerPortalRepository();

const JWT_SECRET  = process.env.JWT_SECRET  ?? "change-me";
const JWT_EXPIRES = process.env.JWT_PARTNER_EXPIRES ?? "8h";

function signPartnerToken(payload: { partnerUserId: string; partnerId: string; role: string }) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES } as never);
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

        await repo.updateUserLastLogin(user.id);
        const token = signPartnerToken({ partnerUserId: user.id, partnerId: user.partnerId, role: user.role });
        return {
            token,
            user: {
                id: user.id, email: user.email,
                firstName: user.firstName, lastName: user.lastName,
                role: user.role, partnerId: user.partnerId,
            },
        };
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

    private async _getHostOrgId(): Promise<string> {
        const org = await prisma.organization.findFirst({ where: { isHost: true }, select: { id: true } });
        if (!org) throw new AppError("Organisation hôte introuvable", 500);
        return org.id;
    }
}
