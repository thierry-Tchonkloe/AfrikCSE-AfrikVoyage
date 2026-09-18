import { BookingStatus, Prisma, WalletEntryType } from "@prisma/client";
import { BookingRepository } from "../infrastructure/booking.repository";
import { WalletService } from "../../wallet/application/wallet.service";
import { WalletRepository } from "../../wallet/infrastructure/wallet.repository";
import { CommissionService } from "../../commissions/application/commission.service";
import { prisma } from "../../../core/config/prisma";
import { AppError } from "../../../core/errors/app.error";
import { createHash } from "crypto";
import { dispatchNotification } from "../../notification/application/notification.service";
import { dispatchWebhook } from "../../../core/services/webhook.service";

const repo               = new BookingRepository();
const walletService      = new WalletService();
const walletRepo         = new WalletRepository();
const commissionService  = new CommissionService();

export class BookingService {
    async create(
        userId:         string,
        organizationId: string,
        data: {
            partnerId:      string;
            offerId?:       string;
            locationId?:    string;
            travelRequestId?:    string;
            flightRouteId?:      string;
            hotelRoomTypeId?:    string;
            trainRouteId?:       string;
            carRentalVehicleId?: string;
            bookingDate:    string;
            numberOfPersons?: number;
            numberOfNights?:  number;
            numberOfDays?:    number;
            notes?:         string;
            idempotencyKey: string;
            paymentMethod:  "WALLET" | "MOBILE_MONEY" | "CARD";
            amount:         number;
        }
    ) {
        // MOBILE_MONEY/CARD n'ont aucune passerelle de paiement branchée — accepter
        // ces valeurs créerait une réservation "payée" qui ne débite jamais rien
        // réellement, livrant un service partenaire gratuitement. Rejeté avant
        // toute écriture, en attendant l'intégration réelle de ces moyens de paiement.
        if (data.paymentMethod !== "WALLET") {
            throw new AppError("Ce mode de paiement n'est pas encore disponible — utilisez votre Wallet", 400);
        }

        // Un voyage d'affaires lié doit être approuvé — et appartenir au demandeur —
        // AVANT toute création de réservation ou débit, pas seulement avant confirmation
        // partenaire : sinon un employé pourrait payer un voyage jamais validé par son manager.
        if (data.travelRequestId) {
            const travelRequest = await prisma.travelRequest.findUnique({
                where:  { id: data.travelRequestId },
                select: { status: true, requestedById: true, organizationId: true },
            });
            if (!travelRequest || travelRequest.requestedById !== userId || travelRequest.organizationId !== organizationId) {
                throw new AppError("Voyage d'affaires introuvable", 404);
            }
            if (travelRequest.status !== "APPROVED") {
                throw new AppError("Ce voyage d'affaires doit être approuvé avant d'y rattacher une réservation", 400);
            }
        }

        // Le partenaire ET le prix réels viennent TOUJOURS de l'entité catalogue
        // elle-même, jamais du client : `data.amount`/`data.partnerId` ne sont que
        // des valeurs indicatives d'affichage, ignorées ici. Sans ce recalcul, un
        // client pouvait envoyer n'importe quel montant (ex: 1 XOF pour un vol à
        // 250 000 XOF) et le wallet n'était débité que de ce montant falsifié.
        let partnerId = data.partnerId;
        let amount: Prisma.Decimal;
        if (data.flightRouteId) {
            const route = await prisma.flightRoute.findUnique({ where: { id: data.flightRouteId }, select: { partnerId: true, basePrice: true } });
            if (!route) throw new AppError("Route aérienne introuvable", 404);
            partnerId = route.partnerId;
            amount = route.basePrice.mul(data.numberOfPersons ?? 1);
        } else if (data.hotelRoomTypeId) {
            const roomType = await prisma.hotelRoomType.findUnique({
                where: { id: data.hotelRoomTypeId }, select: { pricePerNight: true, hotel: { select: { partnerId: true } } },
            });
            if (!roomType) throw new AppError("Type de chambre introuvable", 404);
            partnerId = roomType.hotel.partnerId;
            amount = roomType.pricePerNight.mul(data.numberOfNights ?? 1);
        } else if (data.trainRouteId) {
            const route = await prisma.trainRoute.findUnique({ where: { id: data.trainRouteId }, select: { partnerId: true, basePrice: true } });
            if (!route) throw new AppError("Trajet ferroviaire introuvable", 404);
            partnerId = route.partnerId;
            amount = route.basePrice.mul(data.numberOfPersons ?? 1);
        } else if (data.carRentalVehicleId) {
            const vehicle = await prisma.carRentalVehicle.findUnique({ where: { id: data.carRentalVehicleId }, select: { partnerId: true, pricePerDay: true } });
            if (!vehicle) throw new AppError("Véhicule introuvable", 404);
            partnerId = vehicle.partnerId;
            amount = vehicle.pricePerDay.mul(data.numberOfDays ?? 1);
        } else if (data.offerId) {
            const offer = await prisma.benefitCatalogItem.findUnique({ where: { id: data.offerId }, select: { partnerId: true, employeePrice: true } });
            if (!offer) throw new AppError("Offre introuvable", 404);
            partnerId = offer.partnerId ?? partnerId;
            amount = new Prisma.Decimal(offer.employeePrice);
        } else {
            // Aucune entité catalogue référencée : impossible de vérifier un prix
            // réel côté serveur — on refuse plutôt que de faire confiance au client.
            throw new AppError("Une réservation doit cibler une offre ou une entité du catalogue", 400);
        }

        const booking = await repo.create({
            userId,
            organizationId,
            partnerId,
            offerId:            data.offerId,
            locationId:         data.locationId,
            travelRequestId:    data.travelRequestId,
            flightRouteId:      data.flightRouteId,
            hotelRoomTypeId:    data.hotelRoomTypeId,
            trainRouteId:       data.trainRouteId,
            carRentalVehicleId: data.carRentalVehicleId,
            bookingDate:    new Date(data.bookingDate),
            numberOfPersons: data.numberOfPersons,
            notes:          data.notes,
            idempotencyKey: data.idempotencyKey,
        });

        // Débit wallet si paiement wallet
        if (data.paymentMethod === "WALLET") {
            const wallet = await walletService.getMyWallet(userId, organizationId);
            const ikey = createHash("sha256")
                .update(`debit:booking:${booking.id}`)
                .digest("hex")
                .slice(0, 32);
            await walletRepo.debit(wallet.wallet.id, amount, ikey, {
                description:   "Paiement réservation",
                referenceId:   booking.id,
                referenceType: "BOOKING",
            });
        }

        return repo.findById(booking.id);
    }

    async getMyBookings(userId: string, page = 1, limit = 20) {
        return repo.findByUser(userId, page, limit);
    }

    /**
     * SUPER_ADMIN/PLATFORM_MANAGER voient tout ; ADMIN/MANAGER/FINANCE voient les
     * réservations de leur propre organisation (mêmes rôles que travel.service pour
     * une visibilité "staff" cohérente) ; un simple EMPLOYE ne voit que SA PROPRE
     * réservation, pas celles de ses collègues. Message d'erreur identique dans tous
     * les cas de refus (id inexistant vs appartenant à un autre user/org) — anti-IDOR.
     */

    async getById(requester: { userId: string; role: string; organizationId: string | null }, id: string) {
        const booking = await repo.findById(id);
        if (!booking) throw new AppError("Réservation introuvable", 404);

        const isPlatformRole = requester.role === "SUPER_ADMIN" || requester.role === "PLATFORM_MANAGER";
        const isOwner = booking.userId === requester.userId;
        const isSameOrgStaff =
            ["ADMIN", "MANAGER", "FINANCE"].includes(requester.role) &&
            booking.organizationId === requester.organizationId;

        if (!isPlatformRole && !isOwner && !isSameOrgStaff) {
            throw new AppError("Réservation introuvable", 404);
        }
        return booking;
    }

    async getPartnerBookings(partnerId: string, page = 1, limit = 20) {
        return repo.findByPartner(partnerId, page, limit);
    }

    async confirm(id: string, partnerId: string, partnerNotes?: string) {
        const booking = await repo.findById(id);
        if (!booking) throw new AppError("Réservation introuvable", 404);
        if (booking.partnerId !== partnerId) throw new AppError("Accès interdit", 403);
        const updated = await repo.updateStatusFrom(id, BookingStatus.PENDING, BookingStatus.CONFIRMED, {
            confirmedAt:  new Date(),
            partnerNotes,
        });
        if (!updated) throw new AppError("Seule une réservation PENDING peut être confirmée", 400);
        // Notify user
        const user = await prisma.user.findUnique({ where: { id: booking.userId }, select: { email: true } });
        dispatchNotification("BOOKING_CONFIRMED", {
            userId: booking.userId,
            email:  user?.email,
            vars:   { bookingId: id, partnerNotes: partnerNotes ?? "" },
        }).catch(() => {});
        dispatchWebhook(booking.organizationId, "booking.confirmed", {
            bookingId: id, partnerId, confirmedAt: updated.confirmedAt, partnerNotes,
        }).catch(() => {});
        return updated;
    }

    async reject(id: string, partnerId: string, reason: string) {
        const booking = await repo.findById(id);
        if (!booking) throw new AppError("Réservation introuvable", 404);
        if (booking.partnerId !== partnerId) throw new AppError("Accès interdit", 403);
        const updated = await repo.updateStatusFrom(id, BookingStatus.PENDING, BookingStatus.REJECTED, {
            cancelledAt:  new Date(),
            cancelReason: reason,
        });
        if (!updated) throw new AppError("Seule une réservation PENDING peut être refusée", 400);
        // Remboursement wallet automatique si paiement wallet
        await this._refundIfWalletPayment(booking.userId, booking.organizationId, booking.id);
        // Notify user
        const user = await prisma.user.findUnique({ where: { id: booking.userId }, select: { email: true } });
        dispatchNotification("BOOKING_REJECTED", {
            userId: booking.userId,
            email:  user?.email,
            vars:   { reason },
        }).catch(() => {});
        dispatchWebhook(booking.organizationId, "booking.rejected", {
            bookingId: id, partnerId, reason,
        }).catch(() => {});
    }

    async complete(id: string, partnerId: string) {
        const booking = await repo.findById(id);
        if (!booking) throw new AppError("Réservation introuvable", 404);
        if (booking.partnerId !== partnerId) throw new AppError("Accès interdit", 403);
        const updated = await repo.updateStatusFrom(id, BookingStatus.CONFIRMED, BookingStatus.COMPLETED, { completedAt: new Date() });
        if (!updated) throw new AppError("Seule une réservation CONFIRMED peut être complétée", 400);

        // Déclenche le calcul de commission — montant brut dérivé soit d'une commande
        // liée (marketplace, rare), soit de l'entrée wallet de débit créée à la
        // réservation (flux catalogue voyage réel, cf. BookingService.create()).
        // Sans ce 2e cas, aucune commission n'était jamais générée en pratique : le
        // flux réel de réservation ne crée jamais d'Order.
        const grossAmount = booking.order?.finalAmount ?? await this._resolveBookingGrossAmount(booking.id);
        if (grossAmount) {
            try {
                const entry = await commissionService.applyCommissionOnBooking(
                    booking.id,
                    booking.partnerId,
                    grossAmount,
                    booking.offer?.category ?? undefined,
                );
                // Confirmation immédiate : la complétion de la réservation EST
                // l'événement qui certifie la commission (service rendu). Sans cet
                // appel, l'entrée restait PENDING indéfiniment — aucun autre code
                // ne la fait jamais passer à CONFIRMED, ce qui bloquait tout
                // déclenchement de Payout pour ce partenaire.
                if (entry) await commissionService.confirmEntry(entry.id);
            } catch { /* best-effort : ne bloque jamais la complétion de la réservation */ }
        }

        // Notify user
        const user = await prisma.user.findUnique({ where: { id: booking.userId }, select: { email: true } });
        dispatchNotification("BOOKING_COMPLETED", {
            userId: booking.userId,
            email:  user?.email,
            vars:   { bookingId: id },
        }).catch(() => {});
        dispatchWebhook(booking.organizationId, "booking.completed", {
            bookingId: id, partnerId, completedAt: updated.completedAt,
        }).catch(() => {});
        return updated;
    }

    async cancelByUser(id: string, userId: string, reason?: string) {
        const booking = await repo.findById(id);
        if (!booking) throw new AppError("Réservation introuvable", 404);
        if (booking.userId !== userId) throw new AppError("Accès interdit", 403);
        if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
            throw new AppError("Cette réservation ne peut pas être annulée", 400);
        }
        await repo.updateStatus(id, BookingStatus.CANCELLED, {
            cancelledAt:  new Date(),
            cancelReason: reason ?? "Annulé par l'utilisateur",
        });
        // Remboursement si avant confirmation (ou toujours si politique le permet)
        if (booking.status === "PENDING" || booking.status === "CONFIRMED") {
            await this._refundIfWalletPayment(booking.userId, booking.organizationId, booking.id);
        }
        // Notify user
        dispatchNotification("BOOKING_CANCELLED", {
            userId,
            vars: { reason: reason ?? "Annulé par l'utilisateur" },
        }).catch(() => {});
        dispatchWebhook(booking.organizationId, "booking.cancelled", {
            bookingId: id, reason: reason ?? "Annulé par l'utilisateur",
        }).catch(() => {});
    }

    async rate(bookingId: string, userId: string, score: number, comment?: string) {
        const booking = await repo.findById(bookingId);
        if (!booking) throw new AppError("Réservation introuvable", 404);
        if (booking.userId !== userId) throw new AppError("Accès interdit", 403);
        if (booking.status !== "COMPLETED") throw new AppError("Vous ne pouvez noter qu'une réservation complétée", 400);
        return repo.addRating(bookingId, userId, score, comment);
    }

    async getAllForAdmin(filters: Parameters<typeof repo.findAllForAdmin>[0]) {
        return repo.findAllForAdmin(filters);
    }

    async getCompletedGrossRevenueForPartner(partnerId: string): Promise<number> {
        return repo.getCompletedGrossRevenueForPartner(partnerId);
    }

    /** Montant brut d'une réservation payée par wallet — dérivé de l'entrée de
     *  débit créée à la création (aucun montant n'est stocké sur Booking lui-même). */
    private async _resolveBookingGrossAmount(bookingId: string): Promise<Prisma.Decimal | null> {
        const debitEntry = await prisma.walletEntry.findFirst({
            where: { referenceId: bookingId, referenceType: "BOOKING", amount: { lt: 0 } },
        });
        return debitEntry ? debitEntry.amount.negated() : null;
    }

    private async _refundIfWalletPayment(userId: string, organizationId: string, bookingId: string) {
        try {
            const debitEntry = await prisma.walletEntry.findFirst({
                where: { referenceId: bookingId, referenceType: "BOOKING", amount: { lt: 0 } },
            });
            if (!debitEntry) return;
            const wallet = await walletService.getMyWallet(userId, organizationId);
            const ikey   = createHash("sha256")
                .update(`refund:booking:${bookingId}`)
                .digest("hex")
                .slice(0, 32);
            await walletRepo.addEntry(
                wallet.wallet.id,
                WalletEntryType.REFUND,
                debitEntry.amount.negated(),
                ikey,
                { description: `Remboursement réservation ${bookingId}`, referenceId: bookingId, referenceType: "BOOKING" }
            );
        } catch { /* refund best-effort */ }
    }
}
