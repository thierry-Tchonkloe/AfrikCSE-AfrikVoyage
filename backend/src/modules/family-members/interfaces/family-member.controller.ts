import { Request, Response } from "express";
import { FamilyMemberService } from "../application/family-member.service";
import { createFamilyMemberSchema, updateFamilyMemberSchema } from "./family-member.validator";
import { IdParamString } from "../../../core/validators/param.validators";

const service = new FamilyMemberService();

export class FamilyMemberController {
    async list(req: Request, res: Response): Promise<void> {
        const members = await service.list(req.user!.userId, req.user!.organizationId!);
        res.json(members);
    }

    async getById(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            const member = await service.getById(req.params.id, req.user!.userId);
            res.json(member);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        const parsed = createFamilyMemberSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const member = await service.create(
                req.user!.userId,
                req.user!.organizationId!,
                parsed.data as any
            );
            res.status(201).json(member);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async update(req: Request<IdParamString>, res: Response): Promise<void> {
        const parsed = updateFamilyMemberSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const member = await service.update(req.params.id, req.user!.userId, parsed.data as any);
            res.json(member);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async delete(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            await service.delete(req.params.id, req.user!.userId);
            res.json({ message: "Membre de famille supprimé" });
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }
}
