import { AuditLogFilters, AuditLogRepository } from "../infrastructure/audit-log.repository";

export class AuditLogService {
    private repo = new AuditLogRepository();

    async getPaginated(params: { page: number; limit: number } & AuditLogFilters) {
        return this.repo.findPaginated(params);
    }

    async getAllForExport(filters: AuditLogFilters) {
        return this.repo.findAllForExport(filters);
    }

    async getDistinctActions() {
        return this.repo.getDistinctActions();
    }
}
