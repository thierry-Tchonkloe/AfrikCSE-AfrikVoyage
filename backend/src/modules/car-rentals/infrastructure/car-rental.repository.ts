import { prisma } from "../../../core/config/prisma";
import { Prisma } from "@prisma/client";

export class CarRentalRepository {
    async searchByCity(city: string, category?: string) {
        return prisma.carRentalVehicle.findMany({
            where: {
                city:     { contains: city, mode: "insensitive" },
                isActive: true,
                ...(category ? { category } : {}),
            },
            include: { partner: { select: { id: true, name: true } } },
            orderBy: { pricePerDay: "asc" },
        });
    }

    async listCities() {
        const rows = await prisma.carRentalVehicle.findMany({
            where: { isActive: true },
            select: { city: true },
            distinct: ["city"],
            orderBy: { city: "asc" },
        });
        return rows.map((r) => r.city);
    }

    // ── Admin CRUD ────────────────────────────────────────────────────────────
    async listVehicles() {
        return prisma.carRentalVehicle.findMany({
            include: { partner: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
        });
    }

    async createVehicle(data: Prisma.CarRentalVehicleUncheckedCreateInput) {
        return prisma.carRentalVehicle.create({ data });
    }

    async updateVehicle(id: string, data: Prisma.CarRentalVehicleUncheckedUpdateInput) {
        return prisma.carRentalVehicle.update({ where: { id }, data });
    }

    async deleteVehicle(id: string) {
        return prisma.carRentalVehicle.delete({ where: { id } });
    }
}
