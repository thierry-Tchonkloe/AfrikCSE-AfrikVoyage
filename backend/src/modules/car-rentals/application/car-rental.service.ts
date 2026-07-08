import { z } from "zod";
import { CarRentalRepository } from "../infrastructure/car-rental.repository";
import { AppError } from "../../../core/errors/app.error";

const repo = new CarRentalRepository();

export interface CarRentalOffer {
    id:           string;
    partnerId:    string;
    agency:       string;
    category:     string;
    brand:        string;
    model:        string;
    city:         string;
    country:      string;
    seats:        number;
    transmission: string;
    imageUrl:     string | null;
    pricePerDay:  number;
    currency:     string;
}

const vehicleSchema = z.object({
    partnerId:    z.string().min(1),
    category:     z.string().min(1),
    brand:        z.string().min(1),
    model:        z.string().min(1),
    city:         z.string().min(1),
    country:      z.string().min(1),
    pricePerDay:  z.number().positive(),
    currency:     z.string().min(3).max(4).optional(),
    seats:        z.number().int().positive().optional(),
    transmission: z.enum(["MANUELLE", "AUTOMATIQUE"]).optional(),
    imageUrl:     z.string().url().optional(),
    isActive:     z.boolean().optional(),
});

export async function search(city: string, category?: string): Promise<CarRentalOffer[]> {
    const vehicles = await repo.searchByCity(city, category);
    return vehicles.map((v) => ({
        id:           v.id,
        partnerId:    v.partnerId,
        agency:       v.partner.name,
        category:     v.category,
        brand:        v.brand,
        model:        v.model,
        city:         v.city,
        country:      v.country,
        seats:        v.seats,
        transmission: v.transmission,
        imageUrl:     v.imageUrl,
        pricePerDay:  parseFloat(v.pricePerDay.toString()),
        currency:     v.currency,
    }));
}

export async function listCities() {
    return repo.listCities();
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export async function adminListVehicles() {
    return repo.listVehicles();
}

export async function adminCreateVehicle(body: unknown) {
    const parsed = vehicleSchema.safeParse(body);
    if (!parsed.success) throw new AppError(parsed.error.flatten().fieldErrors as never, 422);
    return repo.createVehicle(parsed.data);
}

export async function adminUpdateVehicle(id: string, body: unknown) {
    const parsed = vehicleSchema.partial().safeParse(body);
    if (!parsed.success) throw new AppError(parsed.error.flatten().fieldErrors as never, 422);
    return repo.updateVehicle(id, parsed.data);
}

export async function adminDeleteVehicle(id: string) {
    return repo.deleteVehicle(id);
}
