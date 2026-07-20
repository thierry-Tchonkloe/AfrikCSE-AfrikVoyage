import { OrderPaymentStatus, OrderStatus, Prisma, WalletEntryType } from "@prisma/client";
import { OrderRepository } from "../infrastructure/order.repository";
import { WalletService } from "../../wallet/application/wallet.service";
import { WalletRepository } from "../../wallet/infrastructure/wallet.repository";
import { CashbackService } from "../../cashback/application/cashback.service";
import { SubsidyRulesRepository } from "../../subsidy-rules/infrastructure/subsidy-rules.repository";
import { MarketplacePaymentService } from "../../../core/services/marketplace-payment.service";
import { AppError } from "../../../core/errors/app.error";
import { prisma } from "../../../core/config/prisma";
import { createHash } from "crypto";

const repo                    = new OrderRepository();
const walletService           = new WalletService();
const cashbackService         = new CashbackService();
const subsidyRulesRepo        = new SubsidyRulesRepository();
const marketplacePaymentSvc   = new MarketplacePaymentService();

export class OrderService {
    /**
     * Crée une commande.
     * - WALLET : débit immédiat + cashback déclenché.
     * - MOBILE_MONEY (KkiaPay) : si kkiapayTransactionId fourni → vérification
     *   synchrone et confirmation. Sinon → FedaPay : retourne checkoutUrl.
     * - CARD : FedaPay → retourne checkoutUrl.
     */
    async create(
        userId: string,
        organizationId: string,
        data: {
            offerId?:              string;
            partnerId?:            string;
            amount:                number;
            discountAmount?:       number;
            subsidyAmount?:        number;
            currencyCode?:         string;
            paymentMethod:         string;
            idempotencyKey:        string;
            kkiapayTransactionId?: string;
        }
    ) {
        const amount         = new Prisma.Decimal(data.amount);
        const discountAmount = new Prisma.Decimal(data.discountAmount ?? 0);

        // Validation server-side du subsidyAmount contre les SubsidyRules actives
        const validatedSubsidy = await this._validateSubsidy(
            data.subsidyAmount ?? 0,
            amount,
            organizationId,
            data.offerId,
        );
        const subsidyAmount  = validatedSubsidy;
        const finalAmount    = amount.sub(discountAmount).sub(subsidyAmount);
        if (finalAmount.lessThan(0)) throw new AppError("Le montant final ne peut pas être négatif", 400);

        const order = await repo.create({
            userId,
            organizationId,
            offerId:        data.offerId,
            partnerId:      data.partnerId,
            amount,
            discountAmount,
            subsidyAmount,
            finalAmount,
            currencyCode:   data.currencyCode ?? "XOF",
            paymentMethod:  data.paymentMethod,
            idempotencyKey: data.idempotencyKey,
        });

        // ── WALLET ────────────────────────────────────────────────────────────
        if (data.paymentMethod === "WALLET") {
            await walletService.debitForOrder(userId, organizationId, finalAmount, order.id);
            await repo.updateStatus(order.id, OrderStatus.CONFIRMED, OrderPaymentStatus.PAID);
            this._applyCashbackAsync(order.id, userId, organizationId, finalAmount);
            return repo.findById(order.id, userId);
        }

        // ── MOBILE_MONEY — KkiaPay widget (transactionId déjà obtenu côté frontend) ──
        if (data.paymentMethod === "MOBILE_MONEY" && data.kkiapayTransactionId) {
            const verified = await marketplacePaymentSvc.verifyKkiapayTransaction(data.kkiapayTransactionId);
            if (!verified.success) throw new AppError("Transaction KkiaPay invalide ou non complétée", 400);

            await repo.updateTransactionId(order.id, data.kkiapayTransactionId);
            await repo.updateStatus(order.id, OrderStatus.CONFIRMED, OrderPaymentStatus.PAID);
            this._applyCashbackAsync(order.id, userId, organizationId, finalAmount);
            return repo.findById(order.id, userId);
        }

        // ── MOBILE_MONEY sans transactionId / CARD → FedaPay ─────────────────
        const amountCents = finalAmount.toNumber(); // XOF déjà en entier
        const { checkoutUrl, transactionRef } = await marketplacePaymentSvc.initiateFedapayTransaction({
            amount:    amountCents,
            orderId:   order.id,
            userId,
            orgId:     organizationId,
            currency:  data.currencyCode ?? "XOF",
        });

        await repo.updateTransactionId(order.id, transactionRef);

        return {
            ...(await repo.findById(order.id, userId))!,
            checkoutUrl, // FedaPay : frontend redirige l'utilisateur ici
        };
    }

    /**
     * Appelé par les webhooks KkiaPay et FedaPay après confirmation du paiement.
     * Retrouve la commande via transactionId et la confirme.
     */
    async confirmFromWebhook(transactionId: string) {
        const order = await repo.findByTransactionId(transactionId);
        if (!order) return { ignored: true, reason: "Commande introuvable ou déjà payée" };

        await repo.updateStatus(order.id, OrderStatus.CONFIRMED, OrderPaymentStatus.PAID);
        this._applyCashbackAsync(order.id, order.userId, order.organizationId, order.finalAmount);
        return { confirmed: true, orderId: order.id };
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

    async getAllForAdmin(filters: Parameters<typeof repo.findAllForAdmin>[0]) {
        return repo.findAllForAdmin(filters);
    }

    /**
     * Valide le subsidyAmount fourni par le client contre les règles actives.
     * Retourne le montant autorisé (≤ demande, ≤ règle applicable, ≥ 0).
     * Si aucune règle active : subsidyAmount forcé à 0 pour éviter les fraudes.
     */
    private async _validateSubsidy(
        requested: number,
        orderAmount: Prisma.Decimal,
        organizationId: string,
        offerId?: string,
    ): Promise<Prisma.Decimal> {
        if (requested <= 0) return new Prisma.Decimal(0);

        // Lookup de l'offre pour filtrer par catégorie/type si disponible
        let category:  string | null = null;
        let offerType: string | null = null;
        if (offerId) {
            const offer = await prisma.benefitCatalogItem.findUnique({
                where:  { id: offerId },
                select: { category: true, offerType: true },
            });
            category  = offer?.category  ?? null;
            offerType = offer?.offerType  ?? null;
        }

        const rules = await subsidyRulesRepo.findActiveForOrg(
            organizationId,
            category,
            offerType as never,
        );

        if (rules.length === 0) return new Prisma.Decimal(0);

        // Règle de priorité la plus haute
        const rule = rules[0];

        let maxSubsidy: Prisma.Decimal;
        if (rule.subsidyPct != null) {
            maxSubsidy = orderAmount.mul(rule.subsidyPct).div(100);
        } else if (rule.subsidyAmount != null) {
            maxSubsidy = rule.subsidyAmount;
        } else {
            return new Prisma.Decimal(0);
        }

        // Plafond par employé
        if (rule.maxPerEmployee && maxSubsidy.greaterThan(rule.maxPerEmployee)) {
            maxSubsidy = rule.maxPerEmployee;
        }

        const requestedDec = new Prisma.Decimal(requested);
        return requestedDec.greaterThan(maxSubsidy) ? maxSubsidy : requestedDec;
    }

    private _applyCashbackAsync(
        orderId: string,
        userId: string,
        organizationId: string,
        finalAmount: Prisma.Decimal,
    ) {
        cashbackService.applyForOrder({ userId, organizationId, orderAmount: finalAmount, orderId })
            .then(async (credited) => {
                if (credited) await repo.updateCashbackAmount(orderId, credited);
            })
            .catch(() => {});
    }
}
