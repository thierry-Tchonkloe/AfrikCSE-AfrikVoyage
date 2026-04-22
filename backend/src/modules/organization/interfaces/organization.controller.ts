import { Request, Response } from "express";
import { OrganizationService } from "../application/organization.service";
import { validateOrgSchema, rejectOrgSchema, updateModulesSchema, } from "./organization.validator";
import { OrgStatus } from "@prisma/client";

const service = new OrganizationService();

export class OrganizationController {
    async getAll(req: Request, res: Response): Promise<void> {
        const status = req.query.status as OrgStatus | undefined;
        const orgs = await service.getAll(status);
        res.status(200).json(orgs);
    }

    async getById(req: Request, res: Response): Promise<void> {
        try {
        const org = await service.getById(req.params.id as string);
        res.status(200).json(org);
        } catch (err: any) {
        res.status(404).json({ message: err.message });
        }
    }

    async validate(req: Request, res: Response): Promise<void> {
        const parsed = validateOrgSchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }

        try {
        const org = await service.validate(
            req.params.id as string,
            req.user!.userId,
            parsed.data
        );
        res.status(200).json({ message: "Organisation validée", org });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async reject(req: Request, res: Response): Promise<void> {
        const parsed = rejectOrgSchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }

        try {
        const org = await service.reject(req.params.id as string, parsed.data);
        res.status(200).json({ message: "Organisation rejetée", org });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async updateModules(req: Request, res: Response): Promise<void> {
        const parsed = updateModulesSchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }

        try {
        const org = await service.updateModules(req.params.id as string, parsed.data);
        res.status(200).json({ message: "Modules mis à jour", org });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async suspend(req: Request, res: Response): Promise<void> {
        try {
        const org = await service.suspend(req.params.id as string);
        res.status(200).json({ message: "Organisation suspendue", org });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }
}