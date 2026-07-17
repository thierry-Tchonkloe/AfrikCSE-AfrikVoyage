import { Request, Response } from "express";
import { ApiIntegrationService } from "../application/api-integration.service";
import {
    createApiIntegrationSchema,
    updateApiIntegrationSchema,
    syncIntegrationSchema,
} from "./api-integration.validator";
import { IdParamString } from "../../../core/validators/param.validators";

const service = new ApiIntegrationService();

export class ApiIntegrationController {
    async getAll(req: Request, res: Response): Promise<void> {
        const data = await service.getByOrganization(req.user!.organizationId!);
        res.json(data);
    }

    async getById(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            const data = await service.getById(req.user!.organizationId!, req.params.id);
            res.json(data);
        } catch (err: any) {
            res.status(404).json({ message: err.message });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        const parsed = createApiIntegrationSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const integration = await service.create(req.user!.organizationId!, parsed.data);
            res.status(201).json(integration);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async update(req: Request<IdParamString>, res: Response): Promise<void> {
        const parsed = updateApiIntegrationSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const integration = await service.update(req.user!.organizationId!, req.params.id, parsed.data);
            res.json(integration);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async delete(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            await service.delete(req.user!.organizationId!, req.params.id);
            res.json({ message: "Intégration supprimée" });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async getSyncLogs(req: Request<IdParamString>, res: Response): Promise<void> {
        const data = await service.getSyncLogs(req.user!.organizationId!, req.params.id);
        res.json(data);
    }

    async testConnection(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            const result = await service.testConnection(req.user!.organizationId!, req.params.id);
            res.json(result);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async sync(req: Request<IdParamString>, res: Response): Promise<void> {
        const parsed = syncIntegrationSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const log = await service.sync(req.user!.organizationId!, req.params.id, parsed.data.type);
            res.json(log);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }
}
