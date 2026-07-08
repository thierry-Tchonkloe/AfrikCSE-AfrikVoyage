import { z } from "zod";
import { FlightRepository } from "../infrastructure/flight.repository";
import { AppError } from "../../../core/errors/app.error";

const repo = new FlightRepository();

export interface FlightLeg {
    from:       string;
    to:         string;
    departTime: string;
    arriveTime: string;
    departDate: string;
    duration:   string;
    stops:      number;
}

export interface FlightOffer {
    id:          string;
    partnerId:   string;
    routeId:     string;
    airline:     string;
    airlineCode: string;
    price:       number;
    currency:    string;
    outbound:    FlightLeg;
    inbound?:    FlightLeg;
}

function formatDurationLabel(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m` : ""}`.trim() || "—";
}

function addMinutes(hhmm: string, minutes: number): string {
    const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
    const total = ((h! * 60 + m! + minutes) % 1440 + 1440) % 1440;
    const outH = Math.floor(total / 60);
    const outM = total % 60;
    return `${String(outH).padStart(2, "0")}:${String(outM).padStart(2, "0")}`;
}

function buildLeg(route: {
    originIata: string; destinationIata: string; departureTime: string;
    durationMinutes: number; stops: number;
}, date: string): FlightLeg {
    return {
        from:       route.originIata,
        to:         route.destinationIata,
        departTime: route.departureTime,
        arriveTime: addMinutes(route.departureTime, route.durationMinutes),
        departDate: date,
        duration:   formatDurationLabel(route.durationMinutes),
        stops:      route.stops,
    };
}

const routeSchema = z.object({
    partnerId:       z.string().min(1),
    airlineCode:     z.string().min(2).max(4),
    originIata:      z.string().length(3),
    destinationIata: z.string().length(3),
    originCity:      z.string().min(1),
    destinationCity: z.string().min(1),
    departureTime:   z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    durationMinutes: z.number().int().positive(),
    stops:           z.number().int().min(0).optional(),
    basePrice:       z.number().positive(),
    currency:        z.string().min(3).max(4).optional(),
    operatingDays:   z.array(z.number().int().min(0).max(6)).optional(),
    isActive:        z.boolean().optional(),
});

const airportSchema = z.object({
    iataCode: z.string().length(3),
    name:     z.string().min(1),
    city:     z.string().min(1),
    country:  z.string().min(1),
});

export async function searchAirports(keyword: string) {
    if (keyword.length < 2) return [];
    const airports = await repo.searchAirports(keyword);
    return airports.map((a) => ({
        iataCode: a.iataCode,
        name:     a.name,
        city:     a.city,
        country:  a.country,
    }));
}

export async function search(params: {
    from: string; to: string; departureDate: string; returnDate?: string;
    adults: number; nonStop: boolean; currency: string;
}): Promise<FlightOffer[]> {
    const outboundRoutes = await repo.findRoutes(params.from, params.to);
    const inboundRoutes  = params.returnDate ? await repo.findRoutes(params.to, params.from) : [];

    const filtered = params.nonStop ? outboundRoutes.filter((r) => r.stops === 0) : outboundRoutes;

    return filtered.map((route) => {
        const inbound = params.returnDate
            ? inboundRoutes.find((r) => r.partnerId === route.partnerId) ?? inboundRoutes[0]
            : undefined;

        const outboundPrice = parseFloat(route.basePrice.toString());
        const inboundPrice  = inbound ? parseFloat(inbound.basePrice.toString()) : 0;

        return {
            id:          route.id,
            partnerId:   route.partnerId,
            routeId:     route.id,
            airline:     route.partner.name,
            airlineCode: route.airlineCode,
            // Prix total par personne (aller + retour si applicable) — le frontend multiplie par `adults`.
            price:       outboundPrice + inboundPrice,
            currency:    route.currency,
            outbound:    buildLeg(route, params.departureDate),
            inbound:     inbound ? buildLeg(inbound, params.returnDate!) : undefined,
        };
    });
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export async function adminListRoutes() {
    return repo.listRoutes();
}

export async function adminCreateRoute(body: unknown) {
    const parsed = routeSchema.safeParse(body);
    if (!parsed.success) throw new AppError(parsed.error.flatten().fieldErrors as never, 422);
    const d = parsed.data;
    return repo.createRoute({
        ...d,
        originIata:      d.originIata.toUpperCase(),
        destinationIata: d.destinationIata.toUpperCase(),
        airlineCode:     d.airlineCode.toUpperCase(),
    });
}

export async function adminUpdateRoute(id: string, body: unknown) {
    const parsed = routeSchema.partial().safeParse(body);
    if (!parsed.success) throw new AppError(parsed.error.flatten().fieldErrors as never, 422);
    return repo.updateRoute(id, parsed.data);
}

export async function adminDeleteRoute(id: string) {
    return repo.deleteRoute(id);
}

export async function adminListAirports() {
    return repo.listAirports();
}

export async function adminCreateAirport(body: unknown) {
    const parsed = airportSchema.safeParse(body);
    if (!parsed.success) throw new AppError(parsed.error.flatten().fieldErrors as never, 422);
    const d = parsed.data;
    return repo.createAirport({ ...d, iataCode: d.iataCode.toUpperCase() });
}

export async function adminUpdateAirport(id: string, body: unknown) {
    const parsed = airportSchema.partial().safeParse(body);
    if (!parsed.success) throw new AppError(parsed.error.flatten().fieldErrors as never, 422);
    return repo.updateAirport(id, parsed.data);
}

export async function adminDeleteAirport(id: string) {
    return repo.deleteAirport(id);
}
