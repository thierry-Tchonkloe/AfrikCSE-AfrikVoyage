import { Request, Response } from "express";
import { UserService } from "../application/user.service";
import { createUserSchema, updateUserSchema, changeRoleSchema } from "./user.validator";

const service = new UserService();

export class UserController {
    async getAll(req: Request, res: Response): Promise<void> {
        const users = await service.getAll(req.user!);
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
        res.status(200).json(user);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async deactivate(req: Request, res: Response): Promise<void> {
        try {
        await service.deactivate(req.params.id as string);
        res.status(200).json({ message: "Utilisateur désactivé" });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async activate(req: Request, res: Response): Promise<void> {
        try {
        await service.activate(req.params.id as string);
        res.status(200).json({ message: "Utilisateur activé" });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }
}