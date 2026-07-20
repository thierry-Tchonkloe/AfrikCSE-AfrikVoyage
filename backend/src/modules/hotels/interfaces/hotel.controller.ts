import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as svc from "../application/hotel.service";
import { IdParamString } from "../../../core/validators/param.validators";

// La route "/admin/properties/:hotelId/room-types" utilise un nom de paramètre
// différent de "id" — idParamString ne s'applique donc pas ; schéma local minimal.
export const hotelIdParam = z.object({ hotelId: z.string().min(1) });
export type HotelIdParam = z.infer<typeof hotelIdParam>;

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

export async function adminUpdateProperty(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminUpdateProperty(req.params.id, req.body)); } catch (err) { next(err); }
}

export async function adminDeleteProperty(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
    try { await svc.adminDeleteProperty(req.params.id); res.status(204).send(); } catch (err) { next(err); }
}

export async function adminListRoomTypes(req: Request<HotelIdParam>, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminListRoomTypes(req.params.hotelId)); } catch (err) { next(err); }
}

export async function adminCreateRoomType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminCreateRoomType(req.body)); } catch (err) { next(err); }
}

export async function adminUpdateRoomType(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.adminUpdateRoomType(req.params.id, req.body)); } catch (err) { next(err); }
}

export async function adminDeleteRoomType(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
    try { await svc.adminDeleteRoomType(req.params.id); res.status(204).send(); } catch (err) { next(err); }
}
