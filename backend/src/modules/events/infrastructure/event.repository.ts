import { prisma } from "../../../core/config/prisma";

export class EventRepository {
    async getAll(orgId: string, month?: number, year?: number) {
        const where: any = { organizationId: orgId, status: "PUBLISHED" };

        if (month !== undefined && year !== undefined) {
        const start = new Date(year, month, 1);
        const end   = new Date(year, month + 1, 0, 23, 59, 59);
        where.startDate = { gte: start, lte: end };
        }

        return prisma.event.findMany({
        where,
        include: {
            _count: { select: { registrations: true } },
            registrations: { select: { userId: true } },
        },
        orderBy: { startDate: "asc" },
        });
    }

    async getUpcoming(orgId: string, limit = 3) {
        return prisma.event.findMany({
        where: { organizationId: orgId, status: "PUBLISHED", startDate: { gte: new Date() } },
        include: { _count: { select: { registrations: true } } },
        orderBy: { startDate: "asc" },
        take: limit,
        });
    }

    async register(eventId: string, userId: string) {
        // Vérifie la capacité
        const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { _count: { select: { registrations: true } } },
        });

        if (!event) throw new Error("Événement introuvable");
        if (event.maxParticipants && event._count.registrations >= event.maxParticipants) {
        throw new Error("Événement complet");
        }

        return prisma.eventRegistration.create({
        data: { eventId, userId },
        });
    }

    async unregister(eventId: string, userId: string) {
        return prisma.eventRegistration.deleteMany({
        where: { eventId, userId },
        });
    }

    async create(orgId: string, userId: string, data: {
        title: string;
        description?: string;
        startDate: Date;
        endDate: Date;
        location?: string;
        maxParticipants?: number;
        icon?: string;
        color?: string;
    }) {
        return prisma.event.create({
        data: { ...data, organizationId: orgId, createdById: userId },
        });
    }

    async getStats(orgId: string) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const [eventsThisMonth, totalRegistrations, budget] = await Promise.all([
        prisma.event.count({
            where: { organizationId: orgId, startDate: { gte: monthStart, lte: monthEnd } },
        }),
        prisma.eventRegistration.count({
            where: { event: { organizationId: orgId } },
        }),
        // Mock budget pour l'instant
        Promise.resolve(15240),
        ]);

        return { eventsThisMonth, totalRegistrations, budget };
    }
}