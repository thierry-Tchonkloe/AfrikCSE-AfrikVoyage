import { Request, Response, NextFunction } from "express";
import * as svc from "../application/api-developer.service";

export async function listClients(req: Request, res: Response, next: NextFunction) {
    try {
        const orgId = req.user!.organizationId!;
        res.json(await svc.listClients(orgId));
    } catch (e) { next(e); }
}

export async function createClient(req: Request, res: Response, next: NextFunction) {
    try {
        const orgId = req.user!.organizationId!;
        const result = await svc.createClient(orgId, req.body);
        res.status(201).json(result);
    } catch (e) { next(e); }
}

export async function revokeClient(req: Request, res: Response, next: NextFunction) {
    try {
        const orgId = req.user!.organizationId!;
        res.json(await svc.revokeClient(req.params.id as string, orgId));
    } catch (e) { next(e); }
}

export async function deleteClient(req: Request, res: Response, next: NextFunction) {
    try {
        const orgId = req.user!.organizationId!;
        await svc.deleteClient(req.params.id as string, orgId);
        res.status(204).send();
    } catch (e) { next(e); }
}

export async function listWebhooks(req: Request, res: Response, next: NextFunction) {
    try {
        const orgId = req.user!.organizationId!;
        res.json(await svc.listWebhooks(orgId));
    } catch (e) { next(e); }
}

export async function createWebhook(req: Request, res: Response, next: NextFunction) {
    try {
        const orgId = req.user!.organizationId!;
        res.status(201).json(await svc.createWebhook(orgId, req.body));
    } catch (e) { next(e); }
}

export async function updateWebhook(req: Request, res: Response, next: NextFunction) {
    try {
        const orgId = req.user!.organizationId!;
        res.json(await svc.updateWebhook(req.params.id as string, orgId, req.body));
    } catch (e) { next(e); }
}

export async function deleteWebhook(req: Request, res: Response, next: NextFunction) {
    try {
        const orgId = req.user!.organizationId!;
        await svc.deleteWebhook(req.params.id as string, orgId);
        res.status(204).send();
    } catch (e) { next(e); }
}

export async function listDeliveries(req: Request, res: Response, next: NextFunction) {
    try {
        const orgId = req.user!.organizationId!;
        const page  = Number(req.query.page)  || 1;
        const limit = Number(req.query.limit) || 30;
        res.json(await svc.listDeliveries(req.params.endpointId as string, orgId, page, limit));
    } catch (e) { next(e); }
}
