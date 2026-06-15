import { Request, Response } from "express";
import { AuditLogService } from "../application/audit-log.service";
import { AuditLogFilters } from "../infrastructure/audit-log.repository";
import { toCsv } from "../../../core/utils/csv";

const service = new AuditLogService();

function parseFilters(req: Request): AuditLogFilters {
    return {
        userId: req.query.userId as string | undefined,
        action: req.query.action as string | undefined,
        entity: req.query.entity as string | undefined,
        organizationId: req.query.organizationId as string | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        search: req.query.search as string | undefined,
    };
}

export class AuditLogController {
    async getAll(req: Request, res: Response): Promise<void> {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await service.getPaginated({ page, limit, ...parseFilters(req) });
        res.json(result);
    }

    async getActions(_req: Request, res: Response): Promise<void> {
        const actions = await service.getDistinctActions();
        res.json(actions);
    }

    async exportCsv(req: Request, res: Response): Promise<void> {
        const logs = await service.getAllForExport(parseFilters(req));

        const rows = logs.map((log) => ({
            date: log.createdAt.toISOString().slice(0, 19).replace("T", " "),
            action: log.action,
            entity: log.entity,
            entityId: log.entityId,
            user: log.user ? `${log.user.firstName} ${log.user.lastName}` : "",
            userEmail: log.user?.email ?? "",
            organization: log.organization?.name ?? "",
            ipAddress: log.ipAddress ?? "",
        }));

        const csv = toCsv(rows, [
            { key: "date", label: "Date" },
            { key: "action", label: "Action" },
            { key: "entity", label: "Entité" },
            { key: "entityId", label: "ID entité" },
            { key: "user", label: "Utilisateur" },
            { key: "userEmail", label: "Email" },
            { key: "organization", label: "Organisation" },
            { key: "ipAddress", label: "Adresse IP" },
        ]);

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`);
        res.send(csv);
    }
}
