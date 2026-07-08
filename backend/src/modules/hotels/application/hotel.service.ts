import { z } from "zod";
import { HotelRepository } from "../infrastructure/hotel.repository";
import { AppError } from "../../../core/errors/app.error";

const repo = new HotelRepository();

export interface HotelOffer {
    id:            string;
    partnerId:     string;
    name:          string;
    city:          string;
    country:       string;
    starRating:    number | null;
    imageUrl:      string | null;
    roomTypeId:    string;
    roomTypeName:  string;
    capacity:      number;
    pricePerNight: number;
    currency:      string;
}

const propertySchema = z.object({
    partnerId:  z.string().min(1),
    name:       z.string().min(1),
    city:       z.string().min(1),
    country:    z.string().min(1),
    address:    z.string().optional(),
    starRating: z.number().int().min(1).max(5).optional(),
    imageUrl:   z.string().url().optional(),
    isActive:   z.boolean().optional(),
});

const roomTypeSchema = z.object({
    hotelId:       z.string().min(1),
    name:          z.string().min(1),
    capacity:      z.number().int().positive().optional(),
    pricePerNight: z.number().positive(),
    currency:      z.string().min(3).max(4).optional(),
    totalRooms:    z.number().int().positive().optional(),
    isActive:      z.boolean().optional(),
});

export async function search(city: string): Promise<HotelOffer[]> {
    const hotels = await repo.searchByCity(city);
    const offers: HotelOffer[] = [];
    for (const hotel of hotels) {
        const cheapest = hotel.roomTypes[0];
        if (!cheapest) continue;
        offers.push({
            id:            hotel.id,
            partnerId:     hotel.partnerId,
            name:          hotel.name,
            city:          hotel.city,
            country:       hotel.country,
            starRating:    hotel.starRating,
            imageUrl:      hotel.imageUrl,
            roomTypeId:    cheapest.id,
            roomTypeName:  cheapest.name,
            capacity:      cheapest.capacity,
            pricePerNight: parseFloat(cheapest.pricePerNight.toString()),
            currency:      cheapest.currency,
        });
    }
    return offers;
}

export async function listCities() {
    return repo.listCities();
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export async function adminListProperties() {
    return repo.listProperties();
}

export async function adminCreateProperty(body: unknown) {
    const parsed = propertySchema.safeParse(body);
    if (!parsed.success) throw new AppError(parsed.error.flatten().fieldErrors as never, 422);
    return repo.createProperty(parsed.data);
}

export async function adminUpdateProperty(id: string, body: unknown) {
    const parsed = propertySchema.partial().safeParse(body);
    if (!parsed.success) throw new AppError(parsed.error.flatten().fieldErrors as never, 422);
    return repo.updateProperty(id, parsed.data);
}

export async function adminDeleteProperty(id: string) {
    return repo.deleteProperty(id);
}

export async function adminListRoomTypes(hotelId: string) {
    return repo.listRoomTypes(hotelId);
}

export async function adminCreateRoomType(body: unknown) {
    const parsed = roomTypeSchema.safeParse(body);
    if (!parsed.success) throw new AppError(parsed.error.flatten().fieldErrors as never, 422);
    return repo.createRoomType(parsed.data);
}

export async function adminUpdateRoomType(id: string, body: unknown) {
    const parsed = roomTypeSchema.partial().safeParse(body);
    if (!parsed.success) throw new AppError(parsed.error.flatten().fieldErrors as never, 422);
    return repo.updateRoomType(id, parsed.data);
}

export async function adminDeleteRoomType(id: string) {
    return repo.deleteRoomType(id);
}
