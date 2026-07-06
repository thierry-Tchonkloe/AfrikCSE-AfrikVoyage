import { OrderPaymentStatus, OrderStatus, Prisma, WalletEntryType } from "@prisma/client";
import { OrderRepository } from "../infrastructure/order.repository";
import { WalletService } from "../../wallet/application/wallet.service";
import { WalletRepository } from "../../wallet/infrastructure/wallet.repository";
import { AppError } from "../../../core/errors/app.error";
import { createHash } from "crypto";

const repo          = new OrderRepository();
const walletService = new WalletService();

export class OrderService {
    /**
     * Crée une commande et débite le wallet si paymentMethod = WALLET.
     * L'idempotencyKey est fourni par le client pour garantir un seul passage.
     */
    async create(
        userId: string,
        organizationId: string,
        data: {
            offerId?:      string;
            partnerId?:    string;
            amount:        number;
            discountAmount?: number;
            subsidyAmount?:  number;
            currencyCode?:   string;
            paymentMethod:   string;
            idempotencyKey:  string;
        }
    ) {
        const amount        = new Prisma.Decimal(data.amount);
        const discountAmount = new Prisma.Decimal(data.discountAmount ?? 0);
        const subsidyAmount  = new Prisma.Decimal(data.subsidyAmount ?? 0);
        const finalAmount    = amount.sub(discountAmount).sub(subsidyAmount);
        if (finalAmount.lessThan(0)) throw new AppError("Le montant final ne peut pas être négatif", 400);

        const order = await repo.create({
            userId,
            organizationId,
            offerId:       data.offerId,
            partnerId:     data.partnerId,
            amount,
            discountAmount,
            subsidyAmount,
            finalAmount,
            currencyCode:  data.currencyCode ?? "XOF",
            paymentMethod: data.paymentMethod,
            idempotencyKey: data.idempotencyKey,
        });

        // Débit wallet immédiat si paiement par wallet
        if (data.paymentMethod === "WALLET") {
            await walletService.debitForOrder(userId, organizationId, finalAmount, order.id);
            await repo.updateStatus(order.id, OrderStatus.CONFIRMED, OrderPaymentStatus.PAID);
        }

        return repo.findById(order.id, userId);
    }

    async getMyOrders(userId: string, organizationId: string, page = 1, limit = 20) {
        return repo.findByUser(userId, organizationId, page, limit);
    }

    async getOrderById(id: string, userId: string) {
        const order = await repo.findById(id, userId);
        if (!order) throw new AppError("Commande introuvable", 404);
        return order;
    }

    async cancelOrder(id: string, userId: string, organizationId: string) {
        const order = await repo.findById(id, userId);
        if (!order) throw new AppError("Commande introuvable", 404);
        if (order.status === "COMPLETED") throw new AppError("Une commande complétée ne peut pas être annulée", 400);
        if (order.status === "CANCELLED") throw new AppError("Commande déjà annulée", 400);

        // Remboursement wallet si paiement wallet déjà effectué
        if (order.paymentMethod === "WALLET" && order.paymentStatus === "PAID") {
            const ikey = createHash("sha256")
                .update(`refund:order:${order.id}`)
                .digest("hex")
                .slice(0, 32);
            const wallet     = await walletService.getMyWallet(userId, organizationId);
            const walletRepo = new WalletRepository();
            await walletRepo.addEntry(
                wallet.wallet.id,
                WalletEntryType.REFUND,
                order.finalAmount,
                ikey,
                { description: "Remboursement annulation commande", referenceId: order.id, referenceType: "ORDER" }
            );
        }

        return repo.cancel(id, userId, "Annulé par l'utilisateur");
    }
}
