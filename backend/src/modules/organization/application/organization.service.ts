import { OrganizationRepository } from "../infrastructure/organization.repository";
import { ValidateOrgDto, RejectOrgDto, UpdateModulesDto } from "../interfaces/organization.validator";
import { OrgStatus } from "@prisma/client";
import { prisma } from "../../../core/config/prisma";

export class OrganizationService {
    private repo = new OrganizationRepository();

    /** Liste les organisations (filtre optionnel par statut) */
    async getAll(status?: OrgStatus) {
        return this.repo.findAll(status ? { status } : undefined);
    }

    /** Détail d'une organisation */
    async getById(id: string) {
        const org = await this.repo.findById(id);
        if (!org) throw new Error("Organisation introuvable");
        return org;
    }

    /** Valide une organisation — réservé SUPER_ADMIN */
    async validate(id: string, superAdminId: string, dto: ValidateOrgDto) {
        const org = await this.repo.findById(id);
        if (!org) throw new Error("Organisation introuvable");

        if (org.status !== "PENDING") {
        throw new Error(`Impossible de valider une organisation au statut "${org.status}"`);
        }

        const updated = await this.repo.validate(id, superAdminId, dto.hasVoyage, dto.hasCSE);

        // TODO: Envoyer email de confirmation à l'admin de l'organisation
        // TODO: Créer un audit log

        return updated;
    }

    /** Rejette une organisation — réservé SUPER_ADMIN */
    async reject(id: string, dto: RejectOrgDto) {
        const org = await this.repo.findById(id);
        if (!org) throw new Error("Organisation introuvable");

        if (org.status !== "PENDING") {
        throw new Error(`Impossible de rejeter une organisation au statut "${org.status}"`);
        }

        const updated = await this.repo.reject(id, dto.rejectionNote);

        // TODO: Envoyer email de refus à l'admin avec la note

        return updated;
    }

    /** Met à jour les modules — réservé SUPER_ADMIN */
    async updateModules(id: string, dto: UpdateModulesDto) {
        const org = await this.repo.findById(id);
        if (!org) throw new Error("Organisation introuvable");

        if (org.status !== "ACTIVE") {
        throw new Error("L'organisation doit être active pour modifier ses modules");
        }

        return this.repo.updateModules(id, dto.hasVoyage, dto.hasCSE);
    }

    /** Suspend une organisation */
    async suspend(id: string) {
        const org = await this.repo.findById(id);
        if (!org) throw new Error("Organisation introuvable");
        return this.repo.suspend(id);
    }


    // ── Méthodes supplémentaires ──

    async createByAdmin(dto: {
        name: string;
        businessEmail?: string;
        country?: string;
        phone?: string;
        city?: string;
        plan: string;
        status: string;
        hasVoyage: boolean;
        hasCSE: boolean;
        adminFirstName: string;
        adminLastName: string;
        adminEmail: string;
    }) {
        // Vérifie email unique
        const existingUser = await prisma.user.findUnique({
            where: { email: dto.adminEmail }
        });
        if (existingUser) throw new Error("Cet email admin est déjà utilisé");

        const slug = dto.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            + "-" + Date.now().toString(36); // garantit l'unicité

        const result = await this.repo.createByAdmin({ ...dto, slug });

        // Lien d'invitation
        const invitationLink =
            `${process.env.FRONTEND_URL}/activate?token=${result.invitationToken}`;

        if (process.env.NODE_ENV !== "production") {
            console.log(`[DEV] Lien d'invitation : ${invitationLink}`);
        }
        // TODO: Envoyer par email

        return { ...result, invitationLink };
    }

    async validateWithInvitation(
        id: string,
        superAdminId: string,
        dto: { hasVoyage: boolean; hasCSE: boolean }
    ) {
        const org = await this.repo.findById(id);
        if (!org) throw new Error("Organisation introuvable");
        if (org.status !== "PENDING") throw new Error("Organisation non en attente");

        const result = await this.repo.validateWithInvitation(
            id,
            superAdminId,
            dto.hasVoyage,
            dto.hasCSE
        );

        const invitationLink =
            `${process.env.FRONTEND_URL}/activate?token=${result.invitationToken}`;

        if (process.env.NODE_ENV !== "production") {
            console.log(`[DEV] Lien activation : ${invitationLink}`);
        }
        // TODO: Envoyer par email à l'admin de l'org

        return { ...result.org, invitationLink };
    }

    async getPaginated(params: Parameters<OrganizationRepository["findPaginated"]>[0]) {
        return this.repo.findPaginated(params);
    }

    async softDelete(id: string) {
        const org = await this.repo.findById(id);
        if (!org) throw new Error("Organisation introuvable");
        return this.repo.softDelete(id);
    }
}