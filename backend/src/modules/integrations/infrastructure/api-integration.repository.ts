import { prisma } from "../../../core/config/prisma";
import { encrypt, decrypt } from "../../../core/utils/crypto";

export interface ApiIntegrationInput {
    name:             string;
    type:             string;
    apiKey?:          string;
    webhookUrl?:      string;
    isActive?:        boolean;
    syncConfig?:      Record<string, unknown>;
    integrationType?: string;
}

function encryptSyncConfig(raw?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!raw) return undefined;
    const out: Record<string, unknown> = { ...raw };
    if (typeof out.apiSecret === "string" && out.apiSecret) {
        out.apiSecret = encrypt(out.apiSecret);
    }
    return out;
}

function maskSyncConfig(raw: unknown): Record<string, unknown> | null {
    if (!raw || typeof raw !== "object") return null;
    const obj = raw as Record<string, unknown>;
    const masked: Record<string, unknown> = { ...obj };
    if (masked.apiSecret) {
        masked.hasApiSecret = true;
        delete masked.apiSecret;
    } else {
        masked.hasApiSecret = false;
    }
    return masked;
}

export class ApiIntegrationRepository {
    async getByOrganization(organizationId: string) {
        const integrations = await prisma.apiIntegration.findMany({
            where: { organizationId },
            orderBy: { createdAt: "desc" },
        });
        return integrations.map((it) => ({
            ...it,
            apiKey:     it.apiKey ? decrypt(it.apiKey) : null,
            syncConfig: maskSyncConfig(it.syncConfig),
        }));
    }

    async getById(id: string) {
        const it = await prisma.apiIntegration.findUnique({ where: { id } });
        if (!it) return null;
        return {
            ...it,
            apiKey:     it.apiKey ? decrypt(it.apiKey) : null,
            syncConfig: maskSyncConfig(it.syncConfig),
        };
    }

    async create(organizationId: string, data: ApiIntegrationInput) {
        const it = await prisma.apiIntegration.create({
            data: {
                organizationId,
                name:            data.name,
                type:            data.type,
                apiKey:          data.apiKey ? encrypt(data.apiKey) : undefined,
                webhookUrl:      data.webhookUrl,
                isActive:        data.isActive,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                syncConfig:      encryptSyncConfig(data.syncConfig) as any,
                integrationType: data.integrationType,
            },
        });
        return {
            ...it,
            apiKey:     it.apiKey ? decrypt(it.apiKey) : null,
            syncConfig: maskSyncConfig(it.syncConfig),
        };
    }

    async update(id: string, data: Partial<ApiIntegrationInput>) {
        // Récupère le syncConfig existant pour le merge si pas fourni
        const existing = await prisma.apiIntegration.findUniqueOrThrow({
            where: { id },
            select: { syncConfig: true },
        });

        let newSyncConfig: Record<string, unknown> | undefined;
        if (data.syncConfig !== undefined) {
            const existingConfig = (existing.syncConfig as Record<string, unknown>) ?? {};
            // Fusionne l'existant et le nouveau (préserve apiSecret chiffrée si pas remplacée)
            const merged: Record<string, unknown> = { ...existingConfig, ...data.syncConfig };
            if (data.syncConfig.apiSecret && typeof data.syncConfig.apiSecret === "string") {
                merged.apiSecret = encrypt(data.syncConfig.apiSecret as string);
            } else if (!data.syncConfig.apiSecret && existingConfig.apiSecret) {
                // Aucun nouveau secret fourni → garde l'existant chiffré
                merged.apiSecret = existingConfig.apiSecret;
            }
            newSyncConfig = merged;
        }

        const it = await prisma.apiIntegration.update({
            where: { id },
            data: {
                name:            data.name,
                type:            data.type,
                apiKey:          data.apiKey !== undefined ? encrypt(data.apiKey) : undefined,
                webhookUrl:      data.webhookUrl,
                isActive:        data.isActive,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                syncConfig:      newSyncConfig as any,
                integrationType: data.integrationType,
            },
        });
        return {
            ...it,
            apiKey:     it.apiKey ? decrypt(it.apiKey) : null,
            syncConfig: maskSyncConfig(it.syncConfig),
        };
    }

    async delete(id: string) {
        return prisma.apiIntegration.delete({ where: { id } });
    }

    async touchLastSync(id: string) {
        return prisma.apiIntegration.update({
            where: { id },
            data: { lastSyncAt: new Date() },
        });
    }

    async getSyncLogs(integrationId: string) {
        return prisma.syncLog.findMany({
            where: { integrationId },
            orderBy: { createdAt: "desc" },
        });
    }

    async createSyncLog(integrationId: string, data: {
        type: string;
        employeesCreated?: number;
        employeesUpdated?: number;
        errors?: number;
        status: string;
    }) {
        return prisma.syncLog.create({
            data: {
                integrationId,
                type:             data.type,
                employeesCreated: data.employeesCreated ?? 0,
                employeesUpdated: data.employeesUpdated ?? 0,
                errors:           data.errors ?? 0,
                status:           data.status,
            },
        });
    }
}
