import { Request, Response, NextFunction } from "express";
import * as svc from "../application/flight.service";

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { from, to, departureDate, returnDate, adults, nonStop, currency } = req.query;

    if (!from || !to || !departureDate) {
        res.status(400).json({ message: "Paramètres from, to et departureDate requis" });
        return;
    }

    try {
        const results = await svc.search({
            from:          String(from),
            to:            String(to),
            departureDate: String(departureDate),
            returnDate:    returnDate ? String(returnDate) : undefined,
            adults:        adults ? parseInt(String(adults), 10) : 1,
            nonStop:       nonStop === "true",
            currency:      currency ? String(currency) : "XOF",
        });
        res.json(results);
    } catch (err) { next(err); }
}

export async function airports(req: Request, res: Response, next: NextFunction): Promise<void> {
    const keyword = req.query.keyword;
    if (!keyword || String(keyword).length < 2) { res.json([]); return; }
    try { res.json(await svc.searchAirports(String(keyword))); }
    catch (err) { next(err); }
}

export async function adminListRoutes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminListRoutes()); } catch (err) { next(err); }
}

export async function adminCreateRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminCreateRoute(req.body)); } catch (err) { next(err); }
}

export async function adminUpdateRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminUpdateRoute(req.params.id as string, req.body)); } catch (err) { next(err); }
}

export async function adminDeleteRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { await svc.adminDeleteRoute(req.params.id as string); res.status(204).send(); } catch (err) { next(err); }
}

export async function adminListAirports(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminListAirports()); } catch (err) { next(err); }
}

export async function adminCreateAirport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminCreateAirport(req.body)); } catch (err) { next(err); }
}

export async function adminUpdateAirport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminUpdateAirport(req.params.id as string, req.body)); } catch (err) { next(err); }
}

export async function adminDeleteAirport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { await svc.adminDeleteAirport(req.params.id as string); res.status(204).send(); } catch (err) { next(err); }
}
