import { Request, Response } from "express";
import { OrganizationService } from "../application/organization.service";
import { validateOrgSchema, rejectOrgSchema, updateModulesSchema, } from "./organization.validator";
import { OrgStatus } from "@prisma/client";
import { prisma } from "../../../core/config/prisma";

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


    async createByAdmin(req: Request, res: Response): Promise<void> {
        try {
            const result = await service.createByAdmin(req.body);
            res.status(201).json(result);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async validateWithInvitation(req: Request, res: Response): Promise<void> {
        try {
            const result = await service.validateWithInvitation(
            req.params.id as string,
            req.user!.userId,
            req.body
            );
            res.json(result);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async getPaginated(req: Request, res: Response): Promise<void> {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string | undefined;
        const status = req.query.status as string | undefined;
        const module = req.query.module as string | undefined;

        const result = await service.getPaginated({ page, limit, search, status, module });
            res.json(result);
        }

    async softDelete(req: Request, res: Response): Promise<void> {
        try {
            await service.softDelete(req.params.id as string);
            res.json({ message: "Organisation désactivée" });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async getMyDashboard(req: Request, res: Response): Promise<void> {
        try {
            const orgId = req.user!.organizationId;
            if (!orgId) {
                res.status(400).json({ message: "Organisation introuvable" });
                return;
            }
            const [org, userCount] = await Promise.all([
            prisma.organization.findUnique({
                where: { id: orgId },
                select: {
                id: true, name: true, status: true, plan: true,
                hasCSE: true, hasVoyage: true,
                _count: { select: { users: true } },
                },
            }),
            prisma.user.count({ where: { organizationId: orgId, isActive: true } }),
            ]);
            res.json({ org, activeUsers: userCount });
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }
}