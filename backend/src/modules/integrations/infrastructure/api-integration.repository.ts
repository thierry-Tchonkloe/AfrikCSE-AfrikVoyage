import { prisma } from "../../../core/config/prisma";
import { encrypt, decrypt } from "../../../core/utils/crypto";

export interface ApiIntegrationInput {
    name: string;
    type: string;
    apiKey?: string;
    webhookUrl?: string;
    isActive?: boolean;
    syncConfig?: object;
}

export class ApiIntegrationRepository {
    async getByOrganization(organizationId: string) {
        const integrations = await prisma.apiIntegration.findMany({
            where: { organizationId },
            orderBy: { createdAt: "desc" },
        });
        return integrations.map((integration) => ({
            ...integration,
            apiKey: integration.apiKey ? decrypt(integration.apiKey) : null,
        }));
    }

    async getById(id: string) {
        const integration = await prisma.apiIntegration.findUnique({ where: { id } });
        if (!integration) return null;
        return {
            ...integration,
            apiKey: integration.apiKey ? decrypt(integration.apiKey) : null,
        };
    }

    async create(organizationId: string, data: ApiIntegrationInput) {
        const integration = await prisma.apiIntegration.create({
            data: {
                organizationId,
                name: data.name,
                type: data.type,
                apiKey: data.apiKey ? encrypt(data.apiKey) : undefined,
                webhookUrl: data.webhookUrl,
                isActive: data.isActive,
                syncConfig: data.syncConfig,
            },
        });
        return {
            ...integration,
            apiKey: integration.apiKey ? decrypt(integration.apiKey) : null,
        };
    }

    async update(id: string, data: Partial<ApiIntegrationInput>) {
        const integration = await prisma.apiIntegration.update({
            where: { id },
            data: {
                name: data.name,
                type: data.type,
                apiKey: data.apiKey !== undefined ? encrypt(data.apiKey) : undefined,
                webhookUrl: data.webhookUrl,
                isActive: data.isActive,
                syncConfig: data.syncConfig,
            },
        });
        return {
            ...integration,
            apiKey: integration.apiKey ? decrypt(integration.apiKey) : null,
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
                type: data.type,
                employeesCreated: data.employeesCreated ?? 0,
                employeesUpdated: data.employeesUpdated ?? 0,
                errors: data.errors ?? 0,
                status: data.status,
            },
        });
    }
}
