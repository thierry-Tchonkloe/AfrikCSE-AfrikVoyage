import { Request, Response, NextFunction } from "express";
import * as svc from "../application/hotel.service";

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { city } = req.query;
    if (!city) { res.status(400).json({ message: "Paramètre city requis" }); return; }
    try { res.json(await svc.search(String(city))); } catch (err) { next(err); }
}

export async function cities(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.listCities()); } catch (err) { next(err); }
}

export async function adminListProperties(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminListProperties()); } catch (err) { next(err); }
}

export async function adminCreateProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminCreateProperty(req.body)); } catch (err) { next(err); }
}

export async function adminUpdateProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminUpdateProperty(req.params.id as string, req.body)); } catch (err) { next(err); }
}

export async function adminDeleteProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { await svc.adminDeleteProperty(req.params.id as string); res.status(204).send(); } catch (err) { next(err); }
}

export async function adminListRoomTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminListRoomTypes(req.params.hotelId as string)); } catch (err) { next(err); }
}

export async function adminCreateRoomType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminCreateRoomType(req.body)); } catch (err) { next(err); }
}

export async function adminUpdateRoomType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminUpdateRoomType(req.params.id as string, req.body)); } catch (err) { next(err); }
}

export async function adminDeleteRoomType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { await svc.adminDeleteRoomType(req.params.id as string); res.status(204).send(); } catch (err) { next(err); }
}
