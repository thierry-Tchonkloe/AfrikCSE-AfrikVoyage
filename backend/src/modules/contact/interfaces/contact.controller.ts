// modules/contact/interfaces/contact.controller.ts

import { Request, Response, NextFunction } from "express";
import { ContactService } from "../application/contact.service";
import {
    createContactSchema,
    updateStatusSchema,
} from "./contact.validator";
import { IdParamInt } from "../../../core/validators/param.validators";

const contactService = new ContactService();

export class ContactController {
    // POST /api/contact
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
        const parsed = createContactSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
            success: false,
            errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const contact = await contactService.createContact(parsed.data);

        res.status(201).json({
            success: true,
            message: "Votre demande a bien été enregistrée.",
            data: { id: contact.id },
        });
        } catch (err) {
        next(err);
        }
    }

    // GET /api/contact
    async findAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
        const contacts = await contactService.getAllContacts();
        res.json({ success: true, data: contacts });
        } catch (err) {
        next(err);
        }
    }

    // PATCH /api/contact/:id/status
    async updateStatus(
        req: Request<IdParamInt>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
        // `validateParams(idParamInt)` middleware already parsed and validated `req.params.id` as number
        const id = req.params.id;

        const parsed = updateStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
            success: false,
            errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const updated = await contactService.updateStatus(id, parsed.data.status);
        res.json({ success: true, data: updated });
        } catch (err) {
        next(err);
        }
    }
}