import { CommissionType, Prisma } from "@prisma/client";
import { CommissionRepository } from "../infrastructure/commission.repository";
import { AppError } from "../../../core/errors/app.error";

const repo = new CommissionRepository();

export class CommissionService {
    // ── Rules ─────────────────────────────────────────────────────────────────

    async listRules(partnerId?: string) {
        return repo.listRules(partnerId);
    }

    async createRule(data: {
        partnerId?:   string;
        category?:    string;
        type:         CommissionType;
        rate:         number;
        fixedAmount?: number;
        currencyCode?: string;
    }) {
        return repo.createRule({
            ...data,
            rate:        new Prisma.Decimal(data.rate),
            fixedAmount: data.fixedAmount != null ? new Prisma.Decimal(data.fixedAmount) : undefined,
        });
    }

    async updateRule(id: string, data: Partial<{
        type: CommissionType; rate: number; fixedAmount: number; isActive: boolean; category: string;
    }>) {
        return repo.updateRule(id, {
            ...data,
            rate:        data.rate        != null ? new Prisma.Decimal(data.rate)        : undefined,
            fixedAmount: data.fixedAmount != null ? new Prisma.Decimal(data.fixedAmount) : undefined,
        } as never);
    }

    async deleteRule(id: string) {
        return repo.deleteRule(id);
    }

    // ── Commission on booking completion ──────────────────────────────────────

    /**
     * Called when a Booking transitions to COMPLETED.
     * Finds the applicable rule, calculates commission, creates CommissionEntry.
     */
    async applyCommissionOnBooking(bookingId: string, partnerId: string, grossAmount: Prisma.Decimal, category?: string) {
        const rule = await repo.findApplicableRule(partnerId, category);
        if (!rule) return null; // No rule configured — no commission

        let commissionAmount: Prisma.Decimal;
        if (rule.type === "PERCENTAGE") {
            commissionAmount = grossAmount.mul(rule.rate);
        } else if (rule.type === "FIXED") {
            commissionAmount = rule.fixedAmount ?? new Prisma.Decimal(0);
        } else {
            // MAX_OF_BOTH
            const pct   = grossAmount.mul(rule.rate);
            const fixed = rule.fixedAmount ?? new Prisma.Decimal(0);
            commissionAmount = pct.greaterThan(fixed) ? pct : fixed;
        }

        if (commissionAmount.greaterThan(grossAmount)) commissionAmount = grossAmount;
        const netAmount = grossAmount.sub(commissionAmount);

        return repo.createEntry({
            bookingId,
            ruleId:           rule.id,
            partnerId,
            grossAmount,
            commissionAmount,
            netAmount,
            currencyCode: rule.currencyCode,
        });
    }

    // ── Payouts ───────────────────────────────────────────────────────────────

    /**
     * SUPER_ADMIN/PLATFORM_MANAGER voient toutes les orgs et peuvent filtrer
     * librement ; les autres rôles (ADMIN/FINANCE) sont strictement cantonnés
     * à leur propre organisation (IDOR) — tout organizationId/partnerId fourni
     * en query par un rôle non-plateforme est ignoré au profit de l'org réelle
     * de l'appelant.
     */
    async listEntries(
        requester: { role: string; organizationId: string | null },
        partnerId?: string,
        organizationId?: string,
        page = 1,
        limit = 50
    ) {
        if (requester.role === "SUPER_ADMIN" || requester.role === "PLATFORM_MANAGER") {
            return repo.listEntries(partnerId, organizationId, page, limit);
        }

        if (!requester.organizationId) throw new AppError("Organisation introuvable", 403);
        return repo.listEntries(partnerId, requester.organizationId, page, limit);
    }

    async listPayouts(
        requester: { role: string; organizationId: string | null },
        partnerId?: string,
        page = 1,
        limit = 20
    ) {
        if (requester.role === "SUPER_ADMIN" || requester.role === "PLATFORM_MANAGER") {
            return repo.listPayouts(partnerId, undefined, page, limit);
        }

        if (!requester.organizationId) throw new AppError("Organisation introuvable", 403);
        return repo.listPayouts(partnerId, requester.organizationId, page, limit);
    }

    async triggerPayout(partnerId: string, period: string, triggeredById: string) {
        const entries = await repo.listEntriesForPayout(partnerId, period);
        if (entries.length === 0) throw new AppError("Aucune commission confirmée pour cette période", 400);

        const totalGross      = entries.reduce((s, e) => s.add(e.grossAmount),      new Prisma.Decimal(0));
        const totalCommission = entries.reduce((s, e) => s.add(e.commissionAmount), new Prisma.Decimal(0));
        const netAmount       = totalGross.sub(totalCommission);

        return repo.createPayout({
            partnerId,
            period,
            totalGross,
            totalCommission,
            netAmount,
            triggeredById,
            entryIds: entries.map((e) => e.id),
        });
    }

    async markPayoutPaid(id: string) {
        return repo.updatePayoutStatus(id, "COMPLETED", new Date());
    }
}
