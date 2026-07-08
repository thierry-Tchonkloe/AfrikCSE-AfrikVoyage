import { prisma } from "../../../core/config/prisma";
import { Prisma } from "@prisma/client";

export class FlightRepository {
    async searchAirports(keyword: string) {
        return prisma.airport.findMany({
            where: {
                OR: [
                    { iataCode: { contains: keyword, mode: "insensitive" } },
                    { name:     { contains: keyword, mode: "insensitive" } },
                    { city:     { contains: keyword, mode: "insensitive" } },
                ],
            },
            take: 8,
            orderBy: { city: "asc" },
        });
    }

    async findRoutes(originIata: string, destinationIata: string) {
        return prisma.flightRoute.findMany({
            where: {
                originIata:      originIata.toUpperCase(),
                destinationIata: destinationIata.toUpperCase(),
                isActive:        true,
            },
            include: { partner: { select: { id: true, name: true } } },
            orderBy: { basePrice: "asc" },
        });
    }

    // ── Admin CRUD — routes ──────────────────────────────────────────────────
    async listRoutes() {
        return prisma.flightRoute.findMany({
            include: { partner: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
        });
    }

    async createRoute(data: Prisma.FlightRouteUncheckedCreateInput) {
        return prisma.flightRoute.create({ data });
    }

    async updateRoute(id: string, data: Prisma.FlightRouteUncheckedUpdateInput) {
        return prisma.flightRoute.update({ where: { id }, data });
    }

    async deleteRoute(id: string) {
        return prisma.flightRoute.delete({ where: { id } });
    }

    // ── Admin CRUD — airports ────────────────────────────────────────────────
    async listAirports() {
        return prisma.airport.findMany({ orderBy: { city: "asc" } });
    }

    async createAirport(data: Prisma.AirportCreateInput) {
        return prisma.airport.create({ data });
    }

    async updateAirport(id: string, data: Prisma.AirportUpdateInput) {
        return prisma.airport.update({ where: { id }, data });
    }

    async deleteAirport(id: string) {
        return prisma.airport.delete({ where: { id } });
    }
}
