import { Prisma, WalletEntryType } from "@prisma/client";
import { prisma } from "../../../core/config/prisma";
import { AppError } from "../../../core/errors/app.error";

export class WalletRepository {
    /** Retourne le wallet de l'utilisateur, le crée s'il n'existe pas */
    async getOrCreate(userId: string, organizationId: string) {
        return prisma.wallet.upsert({
            where: { userId },
            create: { userId, organizationId, currencyCode: "XOF" },
            update: {},
            include: { _count: { select: { entries: true } } },
        });
    }

    /** Solde courant = SUM(amount) sur toutes les entrées actives */
    async getBalance(walletId: string): Promise<Prisma.Decimal> {
        const result = await prisma.walletEntry.aggregate({
            where: { walletId },
            _sum: { amount: true },
        });
        return result._sum.amount ?? new Prisma.Decimal(0);
    }

    /** Solde disponible : exclut les allocations expirées */
    async getAvailableBalance(walletId: string): Promise<Prisma.Decimal> {
        // Les entrées EXPIRY sont déjà négatives — le SUM les prend en compte
        const result = await prisma.walletEntry.aggregate({
            where: {
                walletId,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
            _sum: { amount: true },
        });
        return result._sum.amount ?? new Prisma.Decimal(0);
    }

    async getEntries(walletId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [entries, total] = await Promise.all([
            prisma.walletEntry.findMany({
                where: { walletId },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.walletEntry.count({ where: { walletId } }),
        ]);
        return { entries, total, page, limit };
    }

    /**
     * Ajoute une entrée immuable au ledger.
     * Utilise une transaction Prisma pour lire le solde courant et calculer runningBalance.
     * L'idempotencyKey unique garantit qu'une entrée ne peut être insérée qu'une fois.
     */
    async addEntry(
        walletId: string,
        type: WalletEntryType,
        amount: Prisma.Decimal,
        idempotencyKey: string,
        opts?: {
            description?: string;
            referenceId?: string;
            referenceType?: string;
            expiresAt?: Date;
        }
    ) {
        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Vérifie idempotence — si déjà existant, retourne sans erreur
            const existing = await tx.walletEntry.findUnique({
                where: { idempotencyKey },
            });
            if (existing) return existing;

            const currentBalance = await tx.walletEntry.aggregate({
                where: { walletId },
                _sum: { amount: true },
            });
            const runningBalance = (currentBalance._sum.amount ?? new Prisma.Decimal(0)).add(amount);

            return tx.walletEntry.create({
                data: {
                    walletId,
                    type,
                    amount,
                    runningBalance,
                    idempotencyKey,
                    description:   opts?.description,
                    referenceId:   opts?.referenceId,
                    referenceType: opts?.referenceType,
                    expiresAt:     opts?.expiresAt,
                },
            });
        });
    }

    /**
     * Débite le wallet après vérification du solde.
     * Lève HTTP 422 INSUFFICIENT_WALLET_BALANCE si solde insuffisant.
     */
    async debit(
        walletId: string,
        amount: Prisma.Decimal,
        idempotencyKey: string,
        opts?: { description?: string; referenceId?: string; referenceType?: string }
    ) {
        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const existing = await tx.walletEntry.findUnique({ where: { idempotencyKey } });
            if (existing) return existing;

            const balanceAgg = await tx.walletEntry.aggregate({
                where: { walletId },
                _sum: { amount: true },
            });
            const balance = balanceAgg._sum.amount ?? new Prisma.Decimal(0);
            if (balance.lessThan(amount)) {
                throw new AppError(
                    `Solde insuffisant (disponible : ${balance} XOF, requis : ${amount} XOF)`,
                    422
                );
            }
            const debitAmount   = amount.negated();
            const runningBalance = balance.add(debitAmount);

            return tx.walletEntry.create({
                data: {
                    walletId,
                    type:          WalletEntryType.DEBIT,
                    amount:        debitAmount,
                    runningBalance,
                    idempotencyKey,
                    description:   opts?.description,
                    referenceId:   opts?.referenceId,
                    referenceType: opts?.referenceType,
                },
            });
        });
    }

    async findWalletByUserId(userId: string) {
        return prisma.wallet.findUnique({
            where: { userId },
            include: { _count: { select: { entries: true } } },
        });
    }

    async findWalletsByOrg(organizationId: string) {
        return prisma.wallet.findMany({
            where: { organizationId },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true, department: true } },
                _count: { select: { entries: true } },
            },
        });
    }
}
