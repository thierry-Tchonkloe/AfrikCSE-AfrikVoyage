import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../core/config/prisma";

export class BookingRepository {
    async create(data: {
        userId:         string;
        organizationId: string;
        partnerId:      string;
        offerId?:       string;
        locationId?:    string;
        orderId?:       string;
        bookingDate:    Date;
        numberOfPersons?: number;
        notes?:         string;
        idempotencyKey: string;
    }) {
        // Idempotence check
        const existing = await prisma.booking.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
        if (existing) return existing;
        return prisma.booking.create({ data });
    }

    async findById(id: string) {
        return prisma.booking.findUnique({
            where: { id },
            include: {
                partner:  { select: { id: true, name: true, contactEmail: true } },
                offer:    { select: { id: true, title: true, category: true, imageUrl: true } },
                location: { select: { id: true, name: true, address: true, city: true } },
                order:    { select: { id: true, finalAmount: true } },
                rating:   true,
                commissionEntry: { select: { id: true, commissionAmount: true, netAmount: true, status: true } },
            },
        });
    }

    async findByUser(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where:   { userId },
                include: {
                    partner: { select: { id: true, name: true, logoUrl: true } },
                    offer:   { select: { id: true, title: true, category: true, imageUrl: true } },
                    rating:  { select: { score: true, comment: true } },
                },
                orderBy: { createdAt: "desc" },
                skip, take: limit,
            }),
            prisma.booking.count({ where: { userId } }),
        ]);
        return { bookings, total, page, limit };
    }

    async findByPartner(partnerId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where: { partnerId },
                include: {
                    organization: { select: { id: true, name: true } },
                    offer:  { select: { id: true, title: true, category: true } },
                    location: { select: { id: true, name: true } },
                    rating: { select: { score: true } },
                },
                orderBy: { createdAt: "desc" },
                skip, take: limit,
            }),
            prisma.booking.count({ where: { partnerId } }),
        ]);
        return { bookings, total, page, limit };
    }

    async findAllForAdmin(filters: {
        status?:         BookingStatus;
        partnerId?:      string;
        organizationId?: string;
        page?:           number;
        limit?:          number;
    }) {
        const { status, partnerId, organizationId, page = 1, limit = 50 } = filters;
        const skip = (page - 1) * limit;
        const where: Prisma.BookingWhereInput = {
            ...(status         ? { status }         : {}),
            ...(partnerId      ? { partnerId }      : {}),
            ...(organizationId ? { organizationId } : {}),
        };
        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where,
                include: {
                    partner:      { select: { id: true, name: true } },
                    organization: { select: { id: true, name: true } },
                    offer:        { select: { id: true, title: true } },
                    rating:       { select: { score: true, comment: true } },
                },
                orderBy: { createdAt: "desc" },
                skip, take: limit,
            }),
            prisma.booking.count({ where }),
        ]);
        return { bookings, total, page, limit };
    }

    async updateStatus(id: string, status: BookingStatus, extra?: {
        confirmedAt?: Date;
        completedAt?: Date;
        cancelledAt?: Date;
        cancelReason?: string;
        partnerNotes?: string;
    }) {
        return prisma.booking.update({
            where: { id },
            data: { status, ...extra },
        });
    }

    async addRating(bookingId: string, userId: string, score: number, comment?: string) {
        return prisma.bookingRating.upsert({
            where:  { bookingId },
            create: { bookingId, userId, score, comment },
            update: { score, comment },
        });
    }
}
