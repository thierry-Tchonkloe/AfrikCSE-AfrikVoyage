import { PartnerRepository, PartnerFilters, PartnerInput } from "../infrastructure/partner.repository";
import { AppError } from "../../../core/errors/app.error";

const repo = new PartnerRepository();

export class PartnerService {
    async list(filters: PartnerFilters) {
        return repo.findAll(filters);
    }

    async getById(id: string) {
        const partner = await repo.findById(id);
        if (!partner) throw new AppError("Partenaire introuvable", 404);
        return partner;
    }

    async create(userId: string, data: PartnerInput) {
        return repo.create(userId, data);
    }

    async update(id: string, data: Partial<PartnerInput>) {
        await this.getById(id);
        return repo.update(id, data);
    }

    async delete(id: string) {
        await this.getById(id);
        try {
            await repo.delete(id);
        } catch (err: any) {
            if (err.message === "PARTNER_HAS_ACTIVE_OFFERS") {
                throw new AppError(
                    "Impossible de supprimer : le partenaire a des offres actives. Désactivez-les d'abord ou passez le partenaire en INACTIVE.",
                    409
                );
            }
            throw err;
        }
    }

    async sync(id: string) {
        const partner = await repo.findById(id);
        if (!partner) throw new AppError("Partenaire introuvable", 404);
        if (!(partner as any).apiEnabled) {
            throw new AppError("Ce partenaire n'a pas d'API configurée", 400);
        }

        // Récupère la clé API déchiffrée pour appeler l'API externe
        const apiKey = await repo.getDecryptedApiKey(id);
        if (!apiKey) throw new AppError("Clé API partenaire manquante", 400);

        // Stub de sync — à brancher sur l'API partenaire réelle au cas par cas
        const log = await repo.createSyncLog(id, {
            type: "MANUAL",
            offersCreated: 0,
            offersUpdated: 0,
            errors: 0,
            status: "SUCCESS",
        });
        return { message: "Synchronisation déclenchée", log };
    }

    async getSyncLogs(id: string) {
        await this.getById(id);
        return repo.getSyncLogs(id);
    }
}
