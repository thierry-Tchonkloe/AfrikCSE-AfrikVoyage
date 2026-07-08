import { Request, Response, NextFunction } from "express";
import * as svc from "../application/car-rental.service";

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { city, category } = req.query;
    if (!city) { res.status(400).json({ message: "Paramètre city requis" }); return; }
    try { res.json(await svc.search(String(city), category ? String(category) : undefined)); } catch (err) { next(err); }
}

export async function cities(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.listCities()); } catch (err) { next(err); }
}

export async function adminListVehicles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminListVehicles()); } catch (err) { next(err); }
}

export async function adminCreateVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminCreateVehicle(req.body)); } catch (err) { next(err); }
}

export async function adminUpdateVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminUpdateVehicle(req.params.id as string, req.body)); } catch (err) { next(err); }
}

export async function adminDeleteVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { await svc.adminDeleteVehicle(req.params.id as string); res.status(204).send(); } catch (err) { next(err); }
}
