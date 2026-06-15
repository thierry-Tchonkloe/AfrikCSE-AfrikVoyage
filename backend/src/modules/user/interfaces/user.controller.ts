import { Request, Response } from "express";
import { UserService } from "../application/user.service";
import { createUserSchema, updateUserSchema, changeRoleSchema } from "./user.validator";
import { logAudit } from "../../../core/utils/audit";

const service = new UserService();

export class UserController {
    async getAll(req: Request, res: Response): Promise<void> {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string | undefined;
        const department = req.query.department as string | undefined;

        const users = await service.getAll(req.user!, { page, limit, search, department });
        res.status(200).json(users);
    }

    async getById(req: Request, res: Response): Promise<void> {
        try {
        const user = await service.getById(req.params.id as string);
        res.status(200).json(user);
        } catch (err: any) {
        res.status(404).json({ message: err.message });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        const parsed = createUserSchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }

        try {
        const user = await service.create(req.user!, parsed.data);
        await logAudit({
            action: "USER_CREATED",
            entity: "User",
            entityId: user.id,
            userId: req.user!.userId,
            organizationId: user.organizationId,
            newValue: { email: user.email, role: user.role },
            req,
        });
        res.status(201).json(user);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        const parsed = updateUserSchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }

        try {
        const user = await service.update(req.params.id as string, parsed.data);
        res.status(200).json(user);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async changeRole(req: Request, res: Response): Promise<void> {
        const parsed = changeRoleSchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }

        try {
        const user = await service.changeRole(req.user!, req.params.id as string, parsed.data);
        await logAudit({
            action: "USER_ROLE_CHANGED",
            entity: "User",
            entityId: user.id,
            userId: req.user!.userId,
            organizationId: user.organizationId,
            newValue: { role: user.role },
            req,
        });
        res.status(200).json(user);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async deactivate(req: Request, res: Response): Promise<void> {
        try {
        const user = await service.deactivate(req.params.id as string);
        await logAudit({
            action: "USER_DEACTIVATED",
            entity: "User",
            entityId: user.id,
            userId: req.user!.userId,
            organizationId: user.organizationId,
            req,
        });
        res.status(200).json({ message: "Utilisateur désactivé" });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async activate(req: Request, res: Response): Promise<void> {
        try {
        const user = await service.activate(req.params.id as string);
        await logAudit({
            action: "USER_ACTIVATED",
            entity: "User",
            entityId: user.id,
            userId: req.user!.userId,
            organizationId: user.organizationId,
            req,
        });
        res.status(200).json({ message: "Utilisateur activé" });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    /** Membres de l'organisation hôte (Waxeho) — pour la gestion des accès Super Admin */
    async getHostUsers(_req: Request, res: Response): Promise<void> {
        const users = await service.getHostUsers();
        res.status(200).json(users);
    }
}