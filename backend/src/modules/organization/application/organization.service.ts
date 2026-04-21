import { OrganizationRepository } from "../infrastructure/organization.repository";
import { ValidateOrgDto, RejectOrgDto, UpdateModulesDto } from "../interfaces/organization.validator";
import { OrgStatus } from "@prisma/client";

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
}