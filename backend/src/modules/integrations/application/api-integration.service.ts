import { ApiIntegrationRepository, ApiIntegrationInput } from "../infrastructure/api-integration.repository";

export class ApiIntegrationService {
    private repo = new ApiIntegrationRepository();

    async getByOrganization(organizationId: string) {
        return this.repo.getByOrganization(organizationId);
    }

    async getById(organizationId: string, id: string) {
        const integration = await this.repo.getById(id, organizationId);
        if (!integration) throw new Error("Intégration introuvable");
        return integration;
    }

    async create(organizationId: string, data: ApiIntegrationInput) {
        return this.repo.create(organizationId, data);
    }

    async update(organizationId: string, id: string, data: Partial<ApiIntegrationInput>) {
        const updated = await this.repo.update(id, organizationId, data);
        if (!updated) throw new Error("Intégration introuvable");
        return updated;
    }

    async delete(organizationId: string, id: string) {
        const deleted = await this.repo.delete(id, organizationId);
        if (!deleted) throw new Error("Intégration introuvable");
        return deleted;
    }

    async getSyncLogs(organizationId: string, id: string) {
        return this.repo.getSyncLogs(id, organizationId);
    }

    async testConnection(organizationId: string, id: string) {
        const integration = await this.repo.getById(id, organizationId);
        if (!integration) throw new Error("Intégration introuvable");
        if (!integration.apiKey && !integration.webhookUrl) {
            throw new Error("Aucune clé API ou URL de webhook configurée pour cette intégration");
        }
        return { connected: true, name: integration.name, type: integration.type };
    }

    async sync(organizationId: string, id: string, type: "AUTOMATIC" | "MANUAL" = "MANUAL") {
        const integration = await this.repo.getById(id, organizationId);
        if (!integration) throw new Error("Intégration introuvable");

        if (!integration.isActive || (!integration.apiKey && !integration.webhookUrl)) {
            return this.repo.createSyncLog(id, {
                type,
                employeesCreated: 0,
                employeesUpdated: 0,
                errors: 1,
                status: "FAILED",
            });
        }

        const log = await this.repo.createSyncLog(id, {
            type,
            employeesCreated: 0,
            employeesUpdated: 0,
            errors: 0,
            status: "SUCCESS",
        });
        await this.repo.touchLastSync(id);
        return log;
    }
}
