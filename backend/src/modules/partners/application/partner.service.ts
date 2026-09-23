import { PartnerRepository, PartnerFilters, PartnerInput } from "../infrastructure/partner.repository";
import { AppError } from "../../../core/errors/app.error";
import { sendMail } from "../../../core/services/email.service";
import { partnerAccountActivationEmail } from "../../../core/mailer/email.templates";
import { logger } from "../../../core/utils/logger";

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
        const partner = await repo.create(userId, data);

        // Bootstrap du compte de connexion du partenaire — best-effort : n'échoue
        // jamais la création du partenaire elle-même (ex: email déjà utilisé par
        // un autre PartnerUser). Sans contactEmail, impossible de créer un
        // compte (email de connexion requis) — le SA devra en ajouter un puis
        // réessayer manuellement (pas encore d'action dédiée pour ça).
        let activationLink: string | undefined;
        if (data.contactEmail) {
            try {
                const { rawToken } = await repo.createBootstrapPartnerUser(partner.id, {
                    email:     data.contactEmail,
                    firstName: "Administrateur",
                    lastName:  data.name,
                });
                activationLink = `${process.env.FRONTEND_URL}/activate?token=${rawToken}`;
                const { subject, html } = partnerAccountActivationEmail({
                    partnerName: data.name,
                    activationLink,
                });
                await sendMail({ to: data.contactEmail, subject, html });
            } catch (err) {
                logger.warn(`Bootstrap du compte partenaire échoué pour ${partner.id} : ${err}`);
                activationLink = undefined;
            }
        }

        return { ...partner, activationLink };
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

    async listPendingOffers() {
        return repo.listPendingOffers();
    }

    async approveOffer(offerId: string, adminUserId: string) {
        return repo.approveOffer(offerId, adminUserId);
    }

    async rejectOffer(offerId: string, adminUserId: string, note: string) {
        return repo.rejectOffer(offerId, adminUserId, note);
    }
}
