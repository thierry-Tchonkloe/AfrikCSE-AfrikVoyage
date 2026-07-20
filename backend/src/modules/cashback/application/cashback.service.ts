import { CashbackType, Prisma } from "@prisma/client";
import { CashbackRepository } from "../infrastructure/cashback.repository";
import { WalletService } from "../../wallet/application/wallet.service";
import { AppError } from "../../../core/errors/app.error";
import { createHash } from "crypto";

const repo          = new CashbackRepository();
const walletService = new WalletService();

// Seuil de fraude : score > 0.7 → mise en PENDING_REVIEW
const FRAUD_THRESHOLD = 0.7;

export class CashbackService {
    // ── Rules ──────────────────────────────────────────────────────────────────

    async listRules(organizationId: string) {
        return repo.listRules(organizationId);
    }

    async createRule(
        organizationId: string | null,
        data: {
            type:           CashbackType;
            rate:           number;
            fixedAmount?:   number;
            maxPerEmployee?: number;
            maxPerPeriod?:  number;
            startDate?:     string;
            endDate?:       string;
            category?:      string;
            partnerId?:     string;
            currencyCode?:  string;
        }
    ) {
        return repo.createRule(organizationId, {
            type:           data.type,
            rate:           new Prisma.Decimal(data.rate),
            fixedAmount:    data.fixedAmount    != null ? new Prisma.Decimal(data.fixedAmount)    : undefined,
            maxPerEmployee: data.maxPerEmployee != null ? new Prisma.Decimal(data.maxPerEmployee) : undefined,
            maxPerPeriod:   data.maxPerPeriod   != null ? new Prisma.Decimal(data.maxPerPeriod)   : undefined,
            startDate:      data.startDate  ? new Date(data.startDate)  : undefined,
            endDate:        data.endDate    ? new Date(data.endDate)    : undefined,
            category:       data.category,
            partnerId:      data.partnerId,
            currencyCode:   data.currencyCode,
        });
    }

    async updateRule(id: string, organizationId: string | null, data: Record<string, unknown>) {
        return repo.updateRule(id, organizationId, data as never);
    }

    async deleteRule(id: string, organizationId: string | null) {
        return repo.deleteRule(id, organizationId);
    }

    // ── Transactions ──────────────────────────────────────────────────────────

    async listMyTransactions(userId: string, page = 1, limit = 20) {
        return repo.listMyTransactions(userId, page, limit);
    }

    async listTransactions(organizationId: string, page = 1, limit = 20) {
        return repo.listTransactions(organizationId, page, limit);
    }

    /**
     * Calcule et crédite le cashback pour une commande.
     * Implémentation du moteur de calcul avec anti-fraude basique.
     */
    async calculateAndCredit(opts: {
        userId:        string;
        organizationId: string;
        ruleId:        string;
        orderAmount:   Prisma.Decimal;
        orderId:       string;
    }) {
        const rules = await repo.listRules(opts.organizationId);
        const rule  = rules.find((r) => r.id === opts.ruleId && r.isActive);
        if (!rule) throw new AppError("Règle cashback introuvable ou inactive", 404);

        // Calcul brut
        let rawCashback = opts.orderAmount.mul(rule.rate);
        if (rule.fixedAmount && rule.fixedAmount.greaterThan(rawCashback)) {
            rawCashback = rule.fixedAmount;
        }

        // Plafond par employé (simplifié : pas de lookup période ici)
        let creditedAmount = rawCashback;
        if (rule.maxPerEmployee && creditedAmount.greaterThan(rule.maxPerEmployee)) {
            creditedAmount = rule.maxPerEmployee;
        }

        // Score fraude basique (placeholder — à enrichir V3 IA)
        const fraudScore = new Prisma.Decimal(0.1);
        const status     = fraudScore.greaterThan(FRAUD_THRESHOLD) ? "PENDING_REVIEW" as const : "CALCULATED" as const;

        const ikey = createHash("sha256")
            .update(`cashback:${opts.orderId}:${opts.ruleId}`)
            .digest("hex")
            .slice(0, 32);

        const txn = await repo.createTransaction({
            userId:         opts.userId,
            organizationId: opts.organizationId,
            ruleId:         opts.ruleId,
            rawAmount:      rawCashback,
            creditedAmount,
            status,
            idempotencyKey: ikey,
            fraudScore,
            orderId:        opts.orderId,
            currencyCode:   rule.currencyCode,
        });

        // Crédite le wallet uniquement si status = CALCULATED
        if (status === "CALCULATED") {
            await walletService.creditCashback(
                opts.userId,
                opts.organizationId,
                creditedAmount,
                txn.id
            );
            await repo.createTransaction({
                userId:         txn.userId,
                organizationId: txn.organizationId,
                ruleId:         txn.ruleId,
                rawAmount:      txn.rawAmount,
                creditedAmount: txn.creditedAmount,
                fraudScore:     txn.fraudScore ?? undefined,
                orderId:        txn.orderId ?? undefined,
                ticketId:       txn.ticketId ?? undefined,
                currencyCode:   txn.currencyCode,
                status:         "CREDITED",
                idempotencyKey: ikey + "_c",
            });
        }

        return txn;
    }

    /**
     * Trouve la meilleure règle active pour l'org et applique le cashback.
     * Retourne le montant crédité ou null si aucune règle n'est configurée.
     */
    async applyForOrder(opts: {
        userId:         string;
        organizationId: string;
        orderAmount:    Prisma.Decimal;
        orderId:        string;
    }): Promise<Prisma.Decimal | null> {
        const rule = await repo.findBestActiveRule(opts.organizationId);
        if (!rule) return null;
        const txn = await this.calculateAndCredit({
            userId:         opts.userId,
            organizationId: opts.organizationId,
            ruleId:         rule.id,
            orderAmount:    opts.orderAmount,
            orderId:        opts.orderId,
        });
        return txn.creditedAmount;
    }

    // ── Fraud Signals ─────────────────────────────────────────────────────────

    async listFraudSignals(reviewed?: boolean, page = 1, limit = 20) {
        return repo.listFraudSignals(reviewed, page, limit);
    }

    async reviewFraudSignal(id: string, reviewedById: string) {
        return repo.reviewFraudSignal(id, reviewedById);
    }
}
