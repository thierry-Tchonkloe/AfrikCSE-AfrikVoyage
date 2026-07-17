import { Request, Response } from "express";
import { EmployeeService } from "../application/employee.service";
import { IdParamString } from "../../../core/validators/param.validators";

const service = new EmployeeService();

export class EmployeeController {
    async getAll(req: Request, res: Response): Promise<void> {
        const orgId = req.user!.organizationId!;
        const { search, status, role, page, limit } = req.query;

        const result = await service.getAll(orgId, {
        search: search as string,
        status: status as string,
        role: role as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        });

        res.json(result);
    }

    async getStats(req: Request, res: Response): Promise<void> {
        const stats = await service.getStats(req.user!.organizationId!);
        res.json(stats);
    }

    async getById(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
        const emp = await service.getById(req.user!.organizationId!, req.params.id);
        res.json(emp);
        } catch (err: any) {
        res.status(404).json({ message: err.message });
        }
    }
}