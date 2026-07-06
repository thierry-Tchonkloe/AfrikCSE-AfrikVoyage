import api from "@/lib/api";
// import axios from "axios";

// const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
// const URL  = `${BASE}/api/developer`;

function cfg() {
    return { withCredentials: true };
}

export interface ApiClientItem {
    id: string;
    name: string;
    keyPrefix: string;
    scopes: string[];
    isActive: boolean;
    lastUsedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    _count: { webhooks: number };
}

export interface ApiClientCreated {
    client: ApiClientItem;
    rawKey: string;
}

export interface WebhookEndpoint {
    id: string;
    orgId: string;
    apiClientId: string | null;
    url: string;
    secret: string;
    events: string[];
    isActive: boolean;
    createdAt: string;
    _count: { deliveries: number };
}

export interface WebhookDelivery {
    id: string;
    endpointId: string;
    event: string;
    payload: object;
    statusCode: number | null;
    responseBody: string | null;
    attempts: number;
    deliveredAt: string | null;
    failed: boolean;
    createdAt: string;
}

export const developerService = {
    // Clients
    async listClients(): Promise<ApiClientItem[]> {
        const r = await api.get(`/clients`, cfg());
        return r.data;
    },
    async createClient(body: { name: string; scopes: string[]; expiresAt?: string }): Promise<ApiClientCreated> {
        const r = await api.post(`/clients`, body, cfg());
        return r.data;
    },
    async revokeClient(id: string): Promise<void> {
        await api.patch(`/clients/${id}/revoke`, {}, cfg());
    },
    async deleteClient(id: string): Promise<void> {
        await api.delete(`/clients/${id}`, cfg());
    },

    // Webhooks
    async listWebhooks(): Promise<WebhookEndpoint[]> {
        const r = await api.get(`/webhooks`, cfg());
        return r.data;
    },
    async createWebhook(body: { url: string; events: string[]; apiClientId?: string }): Promise<WebhookEndpoint> {
        const r = await api.post(`/webhooks`, body, cfg());
        return r.data;
    },
    async updateWebhook(id: string, body: Partial<{ url: string; events: string[]; isActive: boolean }>): Promise<WebhookEndpoint> {
        const r = await api.patch(`/webhooks/${id}`, body, cfg());
        return r.data;
    },
    async deleteWebhook(id: string): Promise<void> {
        await api.delete(`/webhooks/${id}`, cfg());
    },

    // Deliveries
    async listDeliveries(endpointId: string, page = 1): Promise<{ deliveries: WebhookDelivery[]; total: number; page: number; limit: number }> {
        const r = await api.get(`/webhooks/${endpointId}/deliveries`, { ...cfg(), params: { page } });
        return r.data;
    },
};
