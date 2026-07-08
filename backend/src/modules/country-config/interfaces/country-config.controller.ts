import { Request, Response, NextFunction } from "express";
import * as svc from "../application/country-config.service";

export async function list(_req: Request, res: Response, next: NextFunction) {
    try { res.json(await svc.list()); } catch (e) { next(e); }
}

export async function findByCode(req: Request, res: Response, next: NextFunction) {
    try { res.json(await svc.findByCode(req.params.code as string)); } catch (e) { next(e); }
}

export async function upsert(req: Request, res: Response, next: NextFunction) {
    try { res.json(await svc.upsert({ ...req.body, code: req.params.code })); } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
    try {
        await svc.remove(req.params.code as string);
        res.status(204).send();
    } catch (e) { next(e); }
}
