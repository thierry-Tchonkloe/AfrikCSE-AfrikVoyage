import { BookingStatus, Prisma, WalletEntryType } from "@prisma/client";
import { BookingRepository } from "../infrastructure/booking.repository";
import { WalletService } from "../../wallet/application/wallet.service";
import { WalletRepository } from "../../wallet/infrastructure/wallet.repository";
import { prisma } from "../../../core/config/prisma";
import { AppError } from "../../../core/errors/app.error";
import { createHash } from "crypto";
import { dispatchNotification } from "../../notification/application/notification.service";

const repo          = new BookingRepository();
const walletService = new WalletService();
const walletRepo    = new WalletRepository();

export class BookingService {
    async create(
        userId:         string,
        organizationId: string,
        data: {
            partnerId:      string;
            offerId?:       string;
            locationId?:    string;
            bookingDate:    string;
            numberOfPersons?: number;
            notes?:         string;
            idempotencyKey: string;
            paymentMethod:  "WALLET" | "MOBILE_MONEY" | "CARD";
            amount:         number;
        }
    ) {
        const amount  = new Prisma.Decimal(data.amount);
        const booking = await repo.create({
            userId,
            organizationId,
            partnerId:      data.partnerId,
            offerId:        data.offerId,
            locationId:     data.locationId,
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
        if (booking.status !== "PENDING") throw new AppError("Seule une réservation PENDING peut être confirmée", 400);
        const updated = await repo.updateStatus(id, BookingStatus.CONFIRMED, {
            confirmedAt:  new Date(),
            partnerNotes,
        });
        // Notify user
        const user = await prisma.user.findUnique({ where: { id: booking.userId }, select: { email: true } });
        dispatchNotification("BOOKING_CONFIRMED", {
            userId: booking.userId,
            email:  user?.email,
            vars:   { bookingId: id, partnerNotes: partnerNotes ?? "" },
        }).catch(() => {});
        return updated;
    }

    async reject(id: string, partnerId: string, reason: string) {
        const booking = await repo.findById(id);
        if (!booking) throw new AppError("Réservation introuvable", 404);
        if (booking.partnerId !== partnerId) throw new AppError("Accès interdit", 403);
        if (booking.status !== "PENDING") throw new AppError("Seule une réservation PENDING peut être refusée", 400);
        await repo.updateStatus(id, BookingStatus.REJECTED, {
            cancelledAt:  new Date(),
            cancelReason: reason,
        });
        // Remboursement wallet automatique si paiement wallet
        await this._refundIfWalletPayment(booking.userId, booking.organizationId, booking.id);
        // Notify user
        const user = await prisma.user.findUnique({ where: { id: booking.userId }, select: { email: true } });
        dispatchNotification("BOOKING_REJECTED", {
            userId: booking.userId,
            email:  user?.email,
            vars:   { reason },
        }).catch(() => {});
    }

    async complete(id: string, partnerId: string) {
        const booking = await repo.findById(id);
        if (!booking) throw new AppError("Réservation introuvable", 404);
        if (booking.partnerId !== partnerId) throw new AppError("Accès interdit", 403);
        if (booking.status !== "CONFIRMED") throw new AppError("Seule une réservation CONFIRMED peut être complétée", 400);
        const updated = await repo.updateStatus(id, BookingStatus.COMPLETED, { completedAt: new Date() });
        // Notify user
        const user = await prisma.user.findUnique({ where: { id: booking.userId }, select: { email: true } });
        dispatchNotification("BOOKING_COMPLETED", {
            userId: booking.userId,
            email:  user?.email,
            vars:   { bookingId: id },
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
                { description: "Remboursement réservation", referenceId: bookingId, referenceType: "BOOKING" }
            );
        } catch { /* refund best-effort */ }
    }
}
