import { Request, Response } from "express";
import { TicketService } from "../application/ticket.service";
import { generateTicketSchema, validateTicketSchema } from "./ticket.validator";

const service = new TicketService();

export class TicketController {
    async generate(req: Request, res: Response): Promise<void> {
        const parsed = generateTicketSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const ticket = await service.generate({
                ...parsed.data,
                userId:         req.user!.userId,
                organizationId: req.user!.organizationId!,
            });
            res.status(201).json(ticket);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async getMyTickets(req: Request, res: Response): Promise<void> {
        const tickets = await service.getMyTickets(req.user!.userId);
        res.json(tickets);
    }

    async getByCode(req: Request, res: Response): Promise<void> {
        try {
            const ticket = await service.getByCode(req.params.code as string);
            res.json(ticket);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    // POST /validate — endpoint de scan (pas auth obligatoire, mais HMAC vérifié)
    async validate(req: Request, res: Response): Promise<void> {
        const parsed = validateTicketSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const result = await service.validate(parsed.data.code);
            const status = result.valid ? 200 : 422;
            res.status(status).json(result);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async cancel(req: Request, res: Response): Promise<void> {
        try {
            const ticket = await service.cancel(req.params.id as string, req.user!.userId);
            res.json(ticket);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }
}
