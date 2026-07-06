import { createHash } from "crypto";
import { AppError } from "../../../core/errors/app.error";
import { ApiDeveloperRepository } from "../infrastructure/api-developer.repository";
import { z } from "zod";

const repo = new ApiDeveloperRepository();

const createClientSchema = z.object({
    name:      z.string().min(1).max(100),
    scopes:    z.array(z.string()).min(1),
    expiresAt: z.string().datetime().optional(),
});

const createWebhookSchema = z.object({
    url:         z.string().url(),
    events:      z.array(z.string()).min(1),
    apiClientId: z.string().optional(),
});

export async function listClients(orgId: string) {
    return repo.listClients(orgId);
}

export async function createClient(orgId: string, body: unknown) {
    const parsed = createClientSchema.safeParse(body);
    if (!parsed.success) throw new AppError(parsed.error.flatten().fieldErrors as never, 422);
    const d = parsed.data;
    return repo.createClient(orgId, {
        name:      d.name,
        scopes:    d.scopes,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : undefined,
    });
}

export async function revokeClient(id: string, orgId: string) {
    return repo.revokeClient(id, orgId);
}

export async function deleteClient(id: string, orgId: string) {
    return repo.deleteClient(id, orgId);
}

export async function verifyApiKey(rawKey: string) {
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const client  = await repo.findByKeyHash(keyHash);
    if (!client) throw new AppError("Clé API invalide", 401);
    if (!client.isActive) throw new AppError("Clé API révoquée", 401);
    if (client.expiresAt && client.expiresAt < new Date()) throw new AppError("Clé API expirée", 401);
    void repo.touchLastUsed(client.id);
    return client;
}

export async function listWebhooks(orgId: string) {
    return repo.listWebhooks(orgId);
}

export async function createWebhook(orgId: string, body: unknown) {
    const parsed = createWebhookSchema.safeParse(body);
    if (!parsed.success) throw new AppError(parsed.error.flatten().fieldErrors as never, 422);
    return repo.createWebhook(orgId, parsed.data);
}

export async function updateWebhook(id: string, orgId: string, body: unknown) {
    const parsed = createWebhookSchema.partial().safeParse(body);
    if (!parsed.success) throw new AppError(parsed.error.flatten().fieldErrors as never, 422);
    return repo.updateWebhook(id, orgId, parsed.data);
}

export async function deleteWebhook(id: string, orgId: string) {
    return repo.deleteWebhook(id, orgId);
}

export async function listDeliveries(endpointId: string, orgId: string, page: number, limit: number) {
    const result = await repo.listDeliveries(endpointId, orgId, page, limit);
    if (!result) throw new AppError("Endpoint introuvable", 404);
    return result;
}
