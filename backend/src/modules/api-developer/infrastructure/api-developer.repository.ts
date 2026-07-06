import { prisma } from "../../../core/config/prisma";
import { createHash, randomBytes } from "crypto";

function hashKey(rawKey: string): string {
    return createHash("sha256").update(rawKey).digest("hex");
}

export class ApiDeveloperRepository {
    // ── API Clients ───────────────────────────────────────────────────────────

    async listClients(orgId: string) {
        return prisma.apiClient.findMany({
            where:   { orgId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true, name: true, keyPrefix: true, scopes: true,
                isActive: true, lastUsedAt: true, expiresAt: true, createdAt: true,
                _count: { select: { webhooks: true } },
            },
        });
    }

    /** Crée un client API, retourne la clé raw (une seule fois). */
    async createClient(orgId: string, data: { name: string; scopes: string[]; expiresAt?: Date }) {
        const rawKey   = `ak_${randomBytes(24).toString("hex")}`;
        const keyHash  = hashKey(rawKey);
        const keyPrefix = rawKey.slice(0, 12);

        const client = await prisma.apiClient.create({
            data: {
                orgId,
                name:      data.name,
                keyPrefix,
                keyHash,
                scopes:    data.scopes,
                expiresAt: data.expiresAt,
            },
        });
        return { client, rawKey };
    }

    async revokeClient(id: string, orgId: string) {
        return prisma.apiClient.update({
            where: { id, orgId },
            data:  { isActive: false },
        });
    }

    async deleteClient(id: string, orgId: string) {
        return prisma.apiClient.delete({ where: { id, orgId } });
    }

    async findByKeyHash(keyHash: string) {
        return prisma.apiClient.findUnique({
            where: { keyHash },
            include: { org: { select: { id: true, status: true, developerApiEnabled: true } } },
        });
    }

    async touchLastUsed(id: string) {
        return prisma.apiClient.update({ where: { id }, data: { lastUsedAt: new Date() } });
    }

    // ── Webhook Endpoints ─────────────────────────────────────────────────────

    async listWebhooks(orgId: string) {
        return prisma.webhookEndpoint.findMany({
            where:   { orgId },
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { deliveries: true } } },
        });
    }

    async createWebhook(orgId: string, data: { url: string; events: string[]; apiClientId?: string }) {
        const secret = randomBytes(32).toString("hex");
        return prisma.webhookEndpoint.create({
            data: { orgId, url: data.url, events: data.events, secret, apiClientId: data.apiClientId },
        });
    }

    async updateWebhook(id: string, orgId: string, data: { url?: string; events?: string[]; isActive?: boolean }) {
        return prisma.webhookEndpoint.update({ where: { id, orgId }, data });
    }

    async deleteWebhook(id: string, orgId: string) {
        return prisma.webhookEndpoint.delete({ where: { id, orgId } });
    }

    // ── Deliveries ────────────────────────────────────────────────────────────

    async listDeliveries(endpointId: string, orgId: string, page = 1, limit = 30) {
        // Vérifie que l'endpoint appartient à l'org
        const endpoint = await prisma.webhookEndpoint.findUnique({ where: { id: endpointId, orgId } });
        if (!endpoint) return null;
        const skip = (page - 1) * limit;
        const [deliveries, total] = await Promise.all([
            prisma.webhookDelivery.findMany({
                where: { endpointId }, skip, take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.webhookDelivery.count({ where: { endpointId } }),
        ]);
        return { deliveries, total, page, limit };
    }

    async logDelivery(data: {
        endpointId: string;
        event:      string;
        payload:    object;
        statusCode?: number;
        responseBody?: string;
        failed?: boolean;
    }) {
        return prisma.webhookDelivery.create({
            data: {
                endpointId:   data.endpointId,
                event:        data.event,
                payload:      data.payload,
                statusCode:   data.statusCode,
                responseBody: data.responseBody,
                failed:       data.failed ?? false,
                deliveredAt:  data.failed ? undefined : new Date(),
            },
        });
    }

    // ── All webhooks for an event (dispatch) ──────────────────────────────────

    async findActiveWebhooksForEvent(orgId: string, event: string) {
        return prisma.webhookEndpoint.findMany({
            where: {
                orgId,
                isActive: true,
                events:   { has: event },
            },
        });
    }
}
