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
        return prisma.apiIntegration.create({
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
    }

    async update(id: string, data: Partial<ApiIntegrationInput>) {
        return prisma.apiIntegration.update({
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
    }

    async delete(id: string) {
        return prisma.apiIntegration.delete({ where: { id } });
    }
}
