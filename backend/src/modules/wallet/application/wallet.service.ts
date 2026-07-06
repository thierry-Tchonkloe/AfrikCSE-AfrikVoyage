import { Prisma, WalletEntryType } from "@prisma/client";
import { WalletRepository } from "../infrastructure/wallet.repository";
import { AppError } from "../../../core/errors/app.error";
import { createHash } from "crypto";
import { dispatchNotification } from "../../notification/application/notification.service";
import { prisma } from "../../../core/config/prisma";

const repo = new WalletRepository();

function allocationKey(userId: string, period: string): string {
    return createHash("sha256").update(`alloc:${userId}:${period}`).digest("hex").slice(0, 32);
}

export class WalletService {
    /** Retourne le wallet et son solde calculé (solde = SUM entrées) */
    async getMyWallet(userId: string, organizationId: string) {
        const wallet  = await repo.getOrCreate(userId, organizationId);
        const balance = await repo.getBalance(wallet.id);
        return { wallet, balance };
    }

    async getMyEntries(userId: string, organizationId: string, page = 1, limit = 20) {
        const wallet = await repo.getOrCreate(userId, organizationId);
        return repo.getEntries(wallet.id, page, limit);
    }

    /**
     * Allocation de budget par un admin : crée un ALLOCATION pour chaque userId.
     * La période (YYYY-MM ou un libellé libre) est incluse dans l'idempotencyKey.
     */
    async allocate(
        organizationId: string,
        userIds: string[],
        amount: Prisma.Decimal,
        period: string,
        description?: string,
        expiresAt?: Date
    ) {
        if (amount.lessThanOrEqualTo(0)) {
            throw new AppError("Le montant d'allocation doit être positif", 400);
        }
        const results = await Promise.allSettled(
            userIds.map(async (userId) => {
                const wallet = await repo.getOrCreate(userId, organizationId);
                const key    = allocationKey(userId, period);
                return repo.addEntry(wallet.id, WalletEntryType.ALLOCATION, amount, key, {
                    description: description ?? `Allocation ${period}`,
                    referenceType: "ALLOCATION",
                    expiresAt,
                });
            })
        );
        const succeeded = results.filter((r) => r.status === "fulfilled").length;
        const failed    = results.filter((r) => r.status === "rejected").length;

        // Notify allocated users
        const users = await prisma.user.findMany({
            where:  { id: { in: userIds } },
            select: { id: true, email: true },
        });
        for (const user of users) {
            dispatchNotification("WALLET_CREDITED", {
                userId: user.id,
                email:  user.email,
                vars:   { amount: amount.toString(), period },
            }).catch(() => {});
        }

        return { succeeded, failed, total: userIds.length };
    }

    /**
     * Débit du wallet pour une commande.
     * Retourne l'entrée créée.
     */
    async debitForOrder(
        userId: string,
        _organizationId: string,
        amount: Prisma.Decimal,
        orderId: string
    ) {
        const wallet = await repo.findWalletByUserId(userId);
        if (!wallet) throw new AppError("Wallet introuvable", 404);
        const ikey = createHash("sha256").update(`debit:order:${orderId}`).digest("hex").slice(0, 32);
        return repo.debit(wallet.id, amount, ikey, {
            description:   "Paiement commande",
            referenceId:   orderId,
            referenceType: "ORDER",
        });
    }

    /** Crédit cashback — appelé par le moteur cashback */
    async creditCashback(
        userId: string,
        organizationId: string,
        amount: Prisma.Decimal,
        transactionId: string
    ) {
        const wallet = await repo.getOrCreate(userId, organizationId);
        const ikey   = createHash("sha256").update(`cashback:${transactionId}`).digest("hex").slice(0, 32);
        return repo.addEntry(wallet.id, WalletEntryType.CASHBACK_CREDIT, amount, ikey, {
            description:   "Cashback crédité",
            referenceId:   transactionId,
            referenceType: "CASHBACK",
        });
    }

    async getOrgWallets(organizationId: string) {
        const wallets = await repo.findWalletsByOrg(organizationId);
        const result  = await Promise.all(
            wallets.map(async (w) => {
                const balance = await repo.getBalance(w.id);
                return { ...w, balance };
            })
        );
        return result;
    }
}
