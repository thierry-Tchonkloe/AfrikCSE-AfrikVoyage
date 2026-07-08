import { prisma } from "../../../core/config/prisma";
import { Prisma } from "@prisma/client";

export class TrainRepository {
    async findRoutes(originCity: string, destinationCity: string) {
        return prisma.trainRoute.findMany({
            where: {
                originCity:      { equals: originCity, mode: "insensitive" },
                destinationCity: { equals: destinationCity, mode: "insensitive" },
                isActive:        true,
            },
            include: { partner: { select: { id: true, name: true } } },
            orderBy: { basePrice: "asc" },
        });
    }

    async listCities() {
        const rows = await prisma.trainRoute.findMany({
            where: { isActive: true },
            select: { originCity: true, destinationCity: true },
        });
        const set = new Set<string>();
        for (const r of rows) { set.add(r.originCity); set.add(r.destinationCity); }
        return Array.from(set).sort();
    }

    // ── Admin CRUD ────────────────────────────────────────────────────────────
    async listRoutes() {
        return prisma.trainRoute.findMany({
            include: { partner: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
        });
    }

    async createRoute(data: Prisma.TrainRouteUncheckedCreateInput) {
        return prisma.trainRoute.create({ data });
    }

    async updateRoute(id: string, data: Prisma.TrainRouteUncheckedUpdateInput) {
        return prisma.trainRoute.update({ where: { id }, data });
    }

    async deleteRoute(id: string) {
        return prisma.trainRoute.delete({ where: { id } });
    }
}
