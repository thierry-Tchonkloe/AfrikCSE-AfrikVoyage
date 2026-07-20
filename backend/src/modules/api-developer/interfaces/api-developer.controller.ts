import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as svc from "../application/api-developer.service";
import { IdParamString } from "../../../core/validators/param.validators";

// Route "/webhooks/:endpointId/deliveries" utilise un nom de param différent de "id"
export const endpointIdParam = z.object({ endpointId: z.string().min(1) });
export type EndpointIdParam = z.infer<typeof endpointIdParam>;

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

export async function revokeClient(req: Request<IdParamString>, res: Response, next: NextFunction) {
    try {
        const orgId = req.user!.organizationId!;
        res.json(await svc.revokeClient(req.params.id, orgId));
    } catch (e) { next(e); }
}

export async function deleteClient(req: Request<IdParamString>, res: Response, next: NextFunction) {
    try {
        const orgId = req.user!.organizationId!;
        await svc.deleteClient(req.params.id, orgId);
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

export async function updateWebhook(req: Request<IdParamString>, res: Response, next: NextFunction) {
    try {
        const orgId = req.user!.organizationId!;
        res.json(await svc.updateWebhook(req.params.id, orgId, req.body));
    } catch (e) { next(e); }
}

export async function deleteWebhook(req: Request<IdParamString>, res: Response, next: NextFunction) {
    try {
        const orgId = req.user!.organizationId!;
        await svc.deleteWebhook(req.params.id, orgId);
        res.status(204).send();
    } catch (e) { next(e); }
}

export async function listDeliveries(req: Request<EndpointIdParam>, res: Response, next: NextFunction) {
    try {
        const orgId = req.user!.organizationId!;
        const page  = Number(req.query.page)  || 1;
        const limit = Number(req.query.limit) || 30;
        res.json(await svc.listDeliveries(req.params.endpointId, orgId, page, limit));
    } catch (e) { next(e); }
}
