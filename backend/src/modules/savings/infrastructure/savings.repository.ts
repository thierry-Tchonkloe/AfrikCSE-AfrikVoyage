import { prisma } from "../../../core/config/prisma";
import { Prisma } from "@prisma/client";

export class SavingsRepository {
    async getMySavings(userId: string, organizationId: string) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Wallet du user
        const wallet = await prisma.wallet.findFirst({ where: { userId, organizationId } });

        const [orders, bookings, walletEntries] = await Promise.all([
            prisma.order.findMany({
                where: { userId, organizationId },
                select: {
                    subsidyAmount: true,
                    discountAmount: true,
                    cashbackAmount: true,
                    finalAmount: true,
                    createdAt: true,
                    status: true,
                },
            }),

            // Booking n'a pas de champs monétaires propres : le prix vit sur l'Order
            // lié (order.finalAmount / order.discountAmount), déjà agrégé via la
            // requête `orders` ci-dessus. On ne récupère ici que le nécessaire au comptage.
            prisma.booking.findMany({
                where: { userId, organizationId },
                select: {
                    createdAt: true,
                    status: true,
                },
            }),

            wallet
                ? prisma.walletEntry.findMany({
                      where: { walletId: wallet.id },
                      select: { amount: true, type: true, createdAt: true },
                  })
                : Promise.resolve([]),
        ]);

        // Agrégats globaux
        const sumDecimal = (arr: Prisma.Decimal[]) =>
            arr.reduce((acc, v) => acc.add(v), new Prisma.Decimal(0));

        const totalOrderSubsidy  = sumDecimal(orders.map((o) => o.subsidyAmount));
        const totalOrderDiscount = sumDecimal(orders.map((o) => o.discountAmount));
        const totalCashback = sumDecimal(
            walletEntries
                .filter((e) => e.type === "CASHBACK_CREDIT")
                .map((e) => e.amount)
        );
        const walletBalance = sumDecimal(walletEntries.map((e) => e.amount));

        const totalSaved = totalOrderSubsidy
            .add(totalOrderDiscount)
            .add(totalCashback);

        // Résumé mensuel (6 derniers mois)
        const monthMap: Record<string, { saved: number; cashback: number }> = {};

        const addToMonth = (date: Date, saved: number, cashback: number) => {
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            if (!monthMap[key]) monthMap[key] = { saved: 0, cashback: 0 };
            monthMap[key].saved    += saved;
            monthMap[key].cashback += cashback;
        };

        orders.forEach((o) => {
            if (o.createdAt >= sixMonthsAgo) {
                addToMonth(o.createdAt, Number(o.subsidyAmount) + Number(o.discountAmount), Number(o.cashbackAmount));
            }
        });
        walletEntries.forEach((e) => {
            if (e.type === "CASHBACK_CREDIT" && e.createdAt >= sixMonthsAgo) {
                addToMonth(e.createdAt, 0, Number(e.amount));
            }
        });

        const monthlySummary = Object.entries(monthMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, v]) => ({ month, ...v }));

        return {
            totalSaved:      Number(totalSaved),
            totalSubsidy:    Number(totalOrderSubsidy),
            totalDiscount:   Number(totalOrderDiscount),
            cashbackEarned:  Number(totalCashback),
            walletBalance:   Number(walletBalance),
            totalOrders:     orders.length,
            totalBookings:   bookings.length,
            monthlySummary,
        };
    }
}
