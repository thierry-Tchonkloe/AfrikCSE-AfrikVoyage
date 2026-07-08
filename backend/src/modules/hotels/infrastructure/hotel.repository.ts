import { prisma } from "../../../core/config/prisma";
import { Prisma } from "@prisma/client";

export class HotelRepository {
    async searchByCity(city: string) {
        return prisma.hotelProperty.findMany({
            where: {
                city:     { contains: city, mode: "insensitive" },
                isActive: true,
            },
            include: {
                partner:   { select: { id: true, name: true } },
                roomTypes: { where: { isActive: true }, orderBy: { pricePerNight: "asc" } },
            },
            orderBy: { name: "asc" },
        });
    }

    async listCities() {
        const rows = await prisma.hotelProperty.findMany({
            where: { isActive: true },
            select: { city: true },
            distinct: ["city"],
            orderBy: { city: "asc" },
        });
        return rows.map((r) => r.city);
    }

    // ── Admin CRUD — properties ───────────────────────────────────────────────
    async listProperties() {
        return prisma.hotelProperty.findMany({
            include: { partner: { select: { id: true, name: true } }, roomTypes: true },
            orderBy: { createdAt: "desc" },
        });
    }

    async createProperty(data: Prisma.HotelPropertyUncheckedCreateInput) {
        return prisma.hotelProperty.create({ data });
    }

    async updateProperty(id: string, data: Prisma.HotelPropertyUncheckedUpdateInput) {
        return prisma.hotelProperty.update({ where: { id }, data });
    }

    async deleteProperty(id: string) {
        return prisma.hotelProperty.delete({ where: { id } });
    }

    // ── Admin CRUD — room types ───────────────────────────────────────────────
    async listRoomTypes(hotelId: string) {
        return prisma.hotelRoomType.findMany({ where: { hotelId }, orderBy: { pricePerNight: "asc" } });
    }

    async createRoomType(data: Prisma.HotelRoomTypeUncheckedCreateInput) {
        return prisma.hotelRoomType.create({ data });
    }

    async updateRoomType(id: string, data: Prisma.HotelRoomTypeUncheckedUpdateInput) {
        return prisma.hotelRoomType.update({ where: { id }, data });
    }

    async deleteRoomType(id: string) {
        return prisma.hotelRoomType.delete({ where: { id } });
    }
}
