import { OrderStatus, OrderPaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../core/config/prisma";

export class OrderRepository {
    async create(data: {
        userId:         string;
        organizationId: string;
        offerId?:       string;
        partnerId?:     string;
        amount:         Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        subsidyAmount:  Prisma.Decimal;
        finalAmount:    Prisma.Decimal;
        currencyCode:   string;
        paymentMethod:  string;
        idempotencyKey: string;
    }) {
        return prisma.order.create({
            data: {
                ...data,
                cashbackAmount: new Prisma.Decimal(0),
                paymentStatus:  OrderPaymentStatus.UNPAID,
                status:         OrderStatus.PENDING,
            },
        });
    }

    async findByUser(userId: string, organizationId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: { userId, organizationId },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.order.count({ where: { userId, organizationId } }),
        ]);
        return { orders, total, page, limit };
    }

    async findById(id: string, userId: string) {
        return prisma.order.findFirst({ where: { id, userId } });
    }

    async findByIdInternal(id: string) {
        return prisma.order.findFirst({ where: { id } });
    }

    async findByTransactionId(transactionId: string) {
        return prisma.order.findFirst({ where: { transactionId, paymentStatus: "UNPAID" } });
    }

    async updateStatus(id: string, status: OrderStatus, paymentStatus?: OrderPaymentStatus) {
        return prisma.order.update({
            where: { id },
            data: {
                status,
                ...(paymentStatus ? { paymentStatus } : {}),
            },
        });
    }

    async updateCashbackAmount(id: string, cashbackAmount: Prisma.Decimal) {
        return prisma.order.update({ where: { id }, data: { cashbackAmount } });
    }

    async updateTransactionId(id: string, transactionId: string) {
        return prisma.order.update({ where: { id }, data: { transactionId } });
    }

    async findAllForAdmin(filters: {
        status?:         OrderStatus;
        paymentStatus?:  OrderPaymentStatus;
        organizationId?: string;
        partnerId?:      string;
        from?:           Date;
        to?:             Date;
        page?:           number;
        limit?:          number;
    }) {
        const { status, paymentStatus, organizationId, partnerId, from, to, page = 1, limit = 50 } = filters;
        const skip = (page - 1) * limit;
        const where: Prisma.OrderWhereInput = {
            ...(status         ? { status }         : {}),
            ...(paymentStatus  ? { paymentStatus }  : {}),
            ...(organizationId ? { organizationId } : {}),
            ...(partnerId      ? { partnerId }      : {}),
            ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
        };
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    user:         { select: { id: true, firstName: true, lastName: true, email: true } },
                    organization: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: "desc" },
                skip, take: limit,
            }),
            prisma.order.count({ where }),
        ]);
        return { orders, total, page, limit };
    }

    async cancel(id: string, _userId: string, reason?: string) {
        return prisma.order.update({
            where: { id },
            data: {
                status:      OrderStatus.CANCELLED,
                cancelledAt: new Date(),
                cancelReason: reason,
            },
        });
    }
}
