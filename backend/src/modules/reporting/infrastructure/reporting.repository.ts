import { prisma } from "../../../core/config/prisma";

export class ReportingRepository {
    // ── Platform-wide KPIs (SA) ───────────────────────────────────────────────

    async getPlatformKpis() {
        const [
            totalOrgs,
            activeOrgs,
            totalUsers,
            activeUsers,
            totalBookings,
            completedBookings,
            totalOrders,
            totalRevenue,
            totalPartners,
            activePartners,
            totalNotificationLogs,
        ] = await Promise.all([
            prisma.organization.count(),
            prisma.organization.count({ where: { status: "ACTIVE" } }),
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true } }),
            prisma.booking.count(),
            prisma.booking.count({ where: { status: "COMPLETED" } }),
            prisma.order.count(),
            prisma.order.aggregate({ _sum: { finalAmount: true }, where: { paymentStatus: "PAID" } }),
            prisma.partner.count(),
            prisma.partner.count({ where: { status: "ACTIVE" } }),
            prisma.notificationLog.count({ where: { status: "SENT" } }),
        ]);

        return {
            organizations: { total: totalOrgs, active: activeOrgs },
            users:         { total: totalUsers, active: activeUsers },
            bookings:      { total: totalBookings, completed: completedBookings },
            orders:        { total: totalOrders, totalRevenue: totalRevenue._sum.finalAmount ?? 0 },
            partners:      { total: totalPartners, active: activePartners },
            notifications: { sent: totalNotificationLogs },
        };
    }

    async getBookingsByStatus() {
        return prisma.booking.groupBy({
            by:     ["status"],
            _count: { id: true },
        });
    }

    async getBookingsPerMonth(months = 6) {
        const since = new Date();
        since.setMonth(since.getMonth() - months);
        const bookings = await prisma.booking.findMany({
            where:  { createdAt: { gte: since } },
            select: { createdAt: true, status: true },
        });
        // Group by month
        const map: Record<string, { month: string; total: number; completed: number }> = {};
        for (const b of bookings) {
            const key = b.createdAt.toISOString().slice(0, 7);
            if (!map[key]) map[key] = { month: key, total: 0, completed: 0 };
            map[key].total++;
            if (b.status === "COMPLETED") map[key].completed++;
        }
        return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
    }

    async getOrdersPerMonth(months = 6) {
        const since = new Date();
        since.setMonth(since.getMonth() - months);
        const orders = await prisma.order.findMany({
            where:  { createdAt: { gte: since } },
            select: { createdAt: true, finalAmount: true, paymentStatus: true },
        });
        const map: Record<string, { month: string; count: number; revenue: number }> = {};
        for (const o of orders) {
            const key = o.createdAt.toISOString().slice(0, 7);
            if (!map[key]) map[key] = { month: key, count: 0, revenue: 0 };
            map[key].count++;
            if (o.paymentStatus === "PAID") map[key].revenue += parseFloat(o.finalAmount.toString());
        }
        return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
    }

    async getTopPartners(limit = 10) {
        return prisma.partner.findMany({
            where: { status: "ACTIVE" },
            select: {
                id: true, name: true, category: true,
                _count: { select: { bookings: true, commissionEntries: true } },
            },
            orderBy: { bookings: { _count: "desc" } },
            take:    limit,
        });
    }

    async getCommissionSummary() {
        const [pending, confirmed, total] = await Promise.all([
            prisma.commissionEntry.aggregate({ _sum: { netAmount: true }, where: { status: "PENDING" } }),
            prisma.commissionEntry.aggregate({ _sum: { netAmount: true }, where: { status: "CONFIRMED" } }),
            prisma.commissionEntry.aggregate({ _sum: { commissionAmount: true } }),
        ]);
        return {
            pendingNet:        pending._sum.netAmount ?? 0,
            confirmedNet:      confirmed._sum.netAmount ?? 0,
            totalCommissions:  total._sum.commissionAmount ?? 0,
        };
    }

    // ── Org-level KPIs (ADMIN/MANAGER) ────────────────────────────────────────

    async getOrgKpis(orgId: string) {
        const [
            totalEmployees,
            activeEmployees,
            totalBookings,
            completedBookings,
            walletAllocations,
            cashbackCredited,
        ] = await Promise.all([
            prisma.user.count({ where: { organizationId: orgId } }),
            prisma.user.count({ where: { organizationId: orgId, isActive: true } }),
            prisma.booking.count({ where: { organizationId: orgId } }),
            prisma.booking.count({ where: { organizationId: orgId, status: "COMPLETED" } }),
            prisma.walletEntry.aggregate({
                _sum: { amount: true },
                where: { wallet: { organizationId: orgId }, type: "ALLOCATION" },
            }),
            prisma.cashbackTransaction.aggregate({
                _sum: { creditedAmount: true },
                where: { organizationId: orgId, status: "CREDITED" },
            }),
        ]);
        return {
            employees:   { total: totalEmployees, active: activeEmployees },
            bookings:    { total: totalBookings,  completed: completedBookings },
            wallet:      { totalAllocated: walletAllocations._sum.amount ?? 0 },
            cashback:    { totalCredited: cashbackCredited._sum.creditedAmount ?? 0 },
        };
    }

    async getOrgBookingsPerMonth(orgId: string, months = 6) {
        const since = new Date();
        since.setMonth(since.getMonth() - months);
        const bookings = await prisma.booking.findMany({
            where:  { organizationId: orgId, createdAt: { gte: since } },
            select: { createdAt: true, status: true },
        });
        const map: Record<string, { month: string; total: number; completed: number }> = {};
        for (const b of bookings) {
            const key = b.createdAt.toISOString().slice(0, 7);
            if (!map[key]) map[key] = { month: key, total: 0, completed: 0 };
            map[key].total++;
            if (b.status === "COMPLETED") map[key].completed++;
        }
        return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
    }
}
