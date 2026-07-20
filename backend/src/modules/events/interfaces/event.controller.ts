import { Request, Response } from "express";
import { EventRepository } from "../infrastructure/event.repository";
import { NotificationRepository } from "../../notification/infrastructure/notification.repository";
import { sendMail } from "../../../core/services/email.service";
import { eventRegistrationConfirmationEmail } from "../../../core/mailer/email.templates";
import { createEventSchema } from "./event.validator";
import { IdParamString } from "../../../core/validators/param.validators";

const repo = new EventRepository();
const notificationRepo = new NotificationRepository();

export class EventController {
    async getAll(req: Request, res: Response): Promise<void> {
        const month = req.query.month !== undefined ? parseInt(req.query.month as string) : undefined;
        const year  = req.query.year  !== undefined ? parseInt(req.query.year as string)  : undefined;
        const events = await repo.getAll(req.user!.organizationId!, month, year);
        res.json(events);
    }

    async getUpcoming(req: Request, res: Response): Promise<void> {
        const events = await repo.getUpcoming(req.user!.organizationId!);
        res.json(events);
    }

    async getRecent(req: Request, res: Response): Promise<void> {
        const events = await repo.getRecent(req.user!.organizationId!);
        res.json(events);
    }

    async getStats(req: Request, res: Response): Promise<void> {
        const stats = await repo.getStats(req.user!.organizationId!);
        res.json(stats);
    }

    async create(req: Request, res: Response): Promise<void> {
        const parsed = createEventSchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }
        try {
        const event = await repo.create(
            req.user!.organizationId!,
            req.user!.userId,
            parsed.data
        );

        if (["ADMIN", "MANAGER", "RH"].includes(req.user!.role)) {
            const dateLabel = event.startDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
            const body = event.description || `Un nouvel événement est prévu le ${dateLabel}.`;
            await notificationRepo.createForOrg(req.user!.organizationId!, `Nouvel événement : ${event.title}`, body, "NEW_EVENT", req.user!.userId, "/employes/evenements");
        }

        res.status(201).json(event);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async register(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
        const registration = await repo.register(req.params.id, req.user!.userId, req.user!.organizationId!);

        const { subject, html } = eventRegistrationConfirmationEmail({
            firstName: registration.user.firstName,
            eventTitle: registration.event.title,
            startDate: registration.event.startDate,
            endDate: registration.event.endDate,
            location: registration.event.location ?? undefined,
        });
        await sendMail({ to: registration.user.email, subject, html });

        res.json({ success: true });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async unregister(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
        await repo.unregister(req.params.id, req.user!.userId);
        res.json({ success: true });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }
}