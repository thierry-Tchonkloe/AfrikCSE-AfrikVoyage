import { Request, Response, NextFunction } from "express";
import * as svc from "../application/train.service";

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { from, to } = req.query;
    if (!from || !to) { res.status(400).json({ message: "Paramètres from et to requis" }); return; }
    try { res.json(await svc.search(String(from), String(to))); } catch (err) { next(err); }
}

export async function cities(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await svc.listCities()); } catch (err) { next(err); }
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
