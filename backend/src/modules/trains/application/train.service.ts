import { z } from "zod";
import { TrainRepository } from "../infrastructure/train.repository";
import { AppError } from "../../../core/errors/app.error";

const repo = new TrainRepository();

export interface TrainOffer {
    id:              string;
    partnerId:       string;
    routeId:         string;
    operator:        string;
    originCity:      string;
    originStation:   string;
    destinationCity: string;
    destinationStation: string;
    departureTime:   string;
    arriveTime:      string;
    duration:        string;
    travelClass:     string;
    price:           number;
    currency:        string;
}

function formatDurationLabel(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m` : ""}`.trim() || "—";
}

function addMinutes(hhmm: string, minutes: number): string {
    const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
    const total = ((h! * 60 + m! + minutes) % 1440 + 1440) % 1440;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const routeSchema = z.object({
    partnerId:          z.string().min(1),
    originCity:         z.string().min(1),
    originStation:      z.string().min(1),
    destinationCity:    z.string().min(1),
    destinationStation: z.string().min(1),
    departureTime:      z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    durationMinutes:    z.number().int().positive(),
    basePrice:          z.number().positive(),
    currency:           z.string().min(3).max(4).optional(),
    travelClass:        z.string().optional(),
    operatingDays:      z.array(z.number().int().min(0).max(6)).optional(),
    isActive:           z.boolean().optional(),
});

export async function search(originCity: string, destinationCity: string): Promise<TrainOffer[]> {
    const routes = await repo.findRoutes(originCity, destinationCity);
    return routes.map((r) => ({
        id:                 r.id,
        partnerId:          r.partnerId,
        routeId:            r.id,
        operator:           r.partner.name,
        originCity:         r.originCity,
        originStation:      r.originStation,
        destinationCity:    r.destinationCity,
        destinationStation: r.destinationStation,
        departureTime:      r.departureTime,
        arriveTime:         addMinutes(r.departureTime, r.durationMinutes),
        duration:           formatDurationLabel(r.durationMinutes),
        travelClass:        r.travelClass,
        price:              parseFloat(r.basePrice.toString()),
        currency:           r.currency,
    }));
}

export async function listCities() {
    return repo.listCities();
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export async function adminListRoutes() {
    return repo.listRoutes();
}

export async function adminCreateRoute(body: unknown) {
    const parsed = routeSchema.safeParse(body);
    if (!parsed.success) throw new AppError(parsed.error.flatten().fieldErrors as never, 422);
    return repo.createRoute(parsed.data);
}

export async function adminUpdateRoute(id: string, body: unknown) {
    const parsed = routeSchema.partial().safeParse(body);
    if (!parsed.success) throw new AppError(parsed.error.flatten().fieldErrors as never, 422);
    return repo.updateRoute(id, parsed.data);
}

export async function adminDeleteRoute(id: string) {
    return repo.deleteRoute(id);
}
