import { TicketRepository } from "../infrastructure/ticket.repository";
import { AppError } from "../../../core/errors/app.error";
import { prisma } from "../../../core/config/prisma";

const repo = new TicketRepository();

export class TicketService {
    async generate(data: {
        offerId:        string;
        userId:         string;
        organizationId: string;
        familyMemberId?: string;
        expiresAt?:     Date;
    }) {
        // Vérifier que l'offre requiert bien un ticket
        const offer = await prisma.benefitCatalogItem.findUnique({
            where: { id: data.offerId },
            select: { requiresTicket: true, requiresFamilyMember: true, isActive: true, organizationId: true },
        });
        if (!offer) throw new AppError("Offre introuvable", 404);
        if (!offer.isActive) throw new AppError("Cette offre n'est plus disponible", 422);
        if (!offer.requiresTicket) throw new AppError("Cette offre ne nécessite pas de ticket", 400);

        // Isolation multi-tenant
        if (offer.organizationId !== data.organizationId) throw new AppError("Offre introuvable", 404);

        // Si l'offre requiert un membre de famille
        if (offer.requiresFamilyMember) {
            if (!data.familyMemberId) {
                throw new AppError("Un membre de famille doit être sélectionné pour cette offre", 422);
            }
            const member = await prisma.familyMember.findUnique({
                where: { id: data.familyMemberId },
                select: { userId: true, isActive: true },
            });
            if (!member || member.userId !== data.userId || !member.isActive) {
                throw new AppError("Membre de famille introuvable ou inactif", 404);
            }
        }

        return repo.generate(data);
    }

    async getMyTickets(userId: string) {
        return repo.getMyTickets(userId);
    }

    async getByCode(code: string, userId: string) {
        const ticket = await repo.getByCode(code, userId);
        if (!ticket) throw new AppError("Ticket introuvable", 404);
        return ticket;
    }

    async validate(code: string): Promise<{ valid: boolean; ticket: any; reason?: string }> {
        const ticket = await repo.getByCode(code);
        if (!ticket) return { valid: false, ticket: null, reason: "Ticket introuvable" };

        // Vérification signature HMAC
        let payload: any;
        try {
            payload = JSON.parse(ticket.qrPayload as string);
        } catch {
            return { valid: false, ticket, reason: "Payload QR invalide" };
        }

        if (!repo.verifySignature(payload)) {
            return { valid: false, ticket, reason: "Signature invalide" };
        }

        if (ticket.status === "USED")      return { valid: false, ticket, reason: "Ticket déjà utilisé" };
        if (ticket.status === "CANCELLED") return { valid: false, ticket, reason: "Ticket annulé" };
        if (ticket.status === "EXPIRED")   return { valid: false, ticket, reason: "Ticket expiré" };
        if (ticket.expiresAt && ticket.expiresAt < new Date()) {
            return { valid: false, ticket, reason: "Ticket expiré" };
        }

        // Marquer comme utilisé
        const used = await repo.markUsed(code);
        return { valid: true, ticket: used };
    }

    async cancel(id: string, userId: string) {
        return repo.cancel(id, userId);
    }
}
