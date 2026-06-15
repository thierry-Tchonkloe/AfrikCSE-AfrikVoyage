import { Request } from "express";
import { prisma } from "../config/prisma";
import { logger } from "./logger";

interface LogAuditParams {
    action: string;
    entity: string;
    entityId: string;
    userId?: string | null;
    organizationId?: string | null;
    oldValue?: unknown;
    newValue?: unknown;
    req?: Request;
}

// Enregistre une action dans le journal d'audit.
// Échoue silencieusement (log console) pour ne jamais bloquer la requête principale.
export async function logAudit(params: LogAuditParams): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                action: params.action,
                entity: params.entity,
                entityId: params.entityId,
                userId: params.userId ?? null,
                organizationId: params.organizationId ?? null,
                oldValue: (params.oldValue ?? undefined) as any,
                newValue: (params.newValue ?? undefined) as any,
                ipAddress: params.req?.ip,
                userAgent: params.req?.headers["user-agent"],
            },
        });
    } catch (err) {
        logger.error({ err }, "Échec de l'enregistrement du log d'audit");
    }
}
