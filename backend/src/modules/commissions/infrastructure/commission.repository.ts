import { CommissionStatus, CommissionType, PayoutStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../core/config/prisma";

export class CommissionRepository {
    // ── Rules ─────────────────────────────────────────────────────────────────

    async listRules(partnerId?: string) {
        return prisma.commissionRule.findMany({
            where: { isActive: true, ...(partnerId ? { OR: [{ partnerId }, { partnerId: null }] } : {}) },
            include: { partner: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
        });
    }

    async createRule(data: {
        partnerId?:  string;
        category?:   string;
        type:        CommissionType;
        rate:        Prisma.Decimal;
        fixedAmount?: Prisma.Decimal;
        currencyCode?: string;
    }) {
        return prisma.commissionRule.create({ data });
    }

    async updateRule(id: string, data: Partial<{
        type:        CommissionType;
        rate:        Prisma.Decimal;
        fixedAmount: Prisma.Decimal;
        isActive:    boolean;
        category:    string;
    }>) {
        return prisma.commissionRule.update({ where: { id }, data });
    }

    async deleteRule(id: string) {
        return prisma.commissionRule.delete({ where: { id } });
    }

    // ── Commission calculation ────────────────────────────────────────────────

    /**
     * Finds the applicable rule for a booking:
     * 1. Partner-specific rule first
     * 2. Category-level rule
     * 3. Global rule (partnerId = null AND category = null)
     */
    async findApplicableRule(partnerId: string, category?: string) {
        const rule = await prisma.commissionRule.findFirst({
            where: {
                isActive: true,
                OR: [
                    { partnerId, ...(category ? { category } : {}) },
                    { partnerId },
                    { partnerId: null, category },
                    { partnerId: null, category: null },
                ],
            },
            orderBy: [{ partnerId: "desc" }, { category: "desc" }],
        });
        return rule;
    }

    async createEntry(data: {
        bookingId:        string;
        ruleId:           string;
        partnerId:        string;
        grossAmount:      Prisma.Decimal;
        commissionAmount: Prisma.Decimal;
        netAmount:        Prisma.Decimal;
        currencyCode?:    string;
    }) {
        const existing = await prisma.commissionEntry.findUnique({ where: { bookingId: data.bookingId } });
        if (existing) return existing;
        return prisma.commissionEntry.create({ data });
    }

    async updateEntryStatus(id: string, status: CommissionStatus) {
        return prisma.commissionEntry.update({ where: { id }, data: { status } });
    }

    // ── Payouts ───────────────────────────────────────────────────────────────

    /**
     * Crée le payout et lui rattache atomiquement toutes les CommissionEntry
     * CONFIRMED encore non payées de la période, en une seule transaction :
     *   1. Le payout est créé d'abord (protégé par @@unique([partnerId, period]) —
     *      un 2e appel concurrent échoue ici en P2002, avant tout claim).
     *   2. Le "claim" des entrées se fait par un UPDATE ... WHERE payoutId IS NULL.
     *      Postgres réévalue ce WHERE au moment d'acquérir le verrou de ligne :
     *      si un autre payout a déjà capturé une entrée entre-temps, elle ne
     *      matche plus et n'est jamais comptée deux fois — pas besoin de lock
     *      applicatif ou de Redis, l'atomicité vient de l'UPDATE lui-même.
     * Retourne null si aucune entrée CONFIRMED n'était disponible (payout annulé).
     */
    async createPayoutForPeriod(partnerId: string, period: string, triggeredById?: string) {
        const [year, month] = period.split("-").map(Number);
        const start = new Date(year, month - 1, 1);
        const end   = new Date(year, month, 0, 23, 59, 59);

        return prisma.$transaction(async (tx) => {
            const payout = await tx.partnerPayout.create({
                data: {
                    partnerId,
                    period,
                    totalGross:      new Prisma.Decimal(0),
                    totalCommission: new Prisma.Decimal(0),
                    netAmount:       new Prisma.Decimal(0),
                    triggeredById,
                },
            });

            const { count } = await tx.commissionEntry.updateMany({
                where: {
                    partnerId,
                    status:    CommissionStatus.CONFIRMED,
                    payoutId:  null,
                    createdAt: { gte: start, lte: end },
                },
                data: { payoutId: payout.id },
            });

            if (count === 0) {
                await tx.partnerPayout.delete({ where: { id: payout.id } });
                return null;
            }

            const claimed = await tx.commissionEntry.findMany({ where: { payoutId: payout.id } });
            const totalGross      = claimed.reduce((s, e) => s.add(e.grossAmount),      new Prisma.Decimal(0));
            const totalCommission = claimed.reduce((s, e) => s.add(e.commissionAmount), new Prisma.Decimal(0));
            const netAmount       = totalGross.sub(totalCommission);

            return tx.partnerPayout.update({
                where: { id: payout.id },
                data:  { totalGross, totalCommission, netAmount },
                include: { entries: true },
            });
        });
    }

    async updatePayoutStatus(id: string, status: PayoutStatus, paidAt?: Date) {
        return prisma.partnerPayout.update({
            where: { id },
            data:  { status, ...(paidAt ? { paidAt } : {}) },
        });
    }

    async listPayouts(partnerId?: string, organizationId?: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        // Un partenaire global peut avoir des entrées de plusieurs organisations regroupées
        // dans le même payout (période + partenaire) : on filtre donc aussi les entrées
        // incluses, pas seulement le payout lui-même (sinon les lignes d'une autre org fuitent).
        const entryOrgFilter: Prisma.CommissionEntryWhereInput | undefined = organizationId
            ? { booking: { organizationId } }
            : undefined;
        const where: Prisma.PartnerPayoutWhereInput = {
            ...(partnerId ? { partnerId } : {}),
            ...(entryOrgFilter ? { entries: { some: entryOrgFilter } } : {}),
        };
        const [payouts, total] = await Promise.all([
            prisma.partnerPayout.findMany({
                where,
                include: {
                    partner: { select: { id: true, name: true } },
                    entries: {
                        where:  entryOrgFilter,
                        select: { id: true, grossAmount: true, commissionAmount: true, netAmount: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip, take: limit,
            }),
            prisma.partnerPayout.count({ where }),
        ]);

        // Les totaux stockés sur le payout portent sur TOUTES ses entrées (potentiellement
        // cross-org) ; pour un appel cantonné à une org, on les recalcule à partir des
        // seules entrées visibles pour ne jamais exposer un montant incluant une autre org.
        const scopedPayouts = organizationId
            ? payouts.map((p) => {
                const totalGross      = p.entries.reduce((s, e) => s.add(e.grossAmount), new Prisma.Decimal(0));
                const totalCommission = p.entries.reduce((s, e) => s.add(e.commissionAmount), new Prisma.Decimal(0));
                return { ...p, totalGross, totalCommission, netAmount: totalGross.sub(totalCommission) };
            })
            : payouts;

        return { payouts: scopedPayouts, total, page, limit };
    }

    async listEntries(partnerId?: string, organizationId?: string, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where: Prisma.CommissionEntryWhereInput = {
            ...(partnerId ? { partnerId } : {}),
            ...(organizationId ? { booking: { organizationId } } : {}),
        };
        const [entries, total] = await Promise.all([
            prisma.commissionEntry.findMany({
                where,
                include: {
                    partner: { select: { id: true, name: true } },
                    booking: { select: { id: true, bookingDate: true, status: true, organization: { select: { id: true, name: true } } } },
                    rule:    { select: { id: true, type: true, rate: true } },
                },
                orderBy: { createdAt: "desc" },
                skip, take: limit,
            }),
            prisma.commissionEntry.count({ where }),
        ]);
        return { entries, total, page, limit };
    }
}
