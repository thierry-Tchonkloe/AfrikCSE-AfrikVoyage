import { Request, Response, NextFunction } from "express";
import { BookingService } from "../application/booking.service";
import { createBookingSchema, rateSchema, rejectSchema } from "./booking.validator";

const service = new BookingService();

export class BookingController {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, organizationId } = req.user!;
            if (!organizationId) { res.status(400).json({ message: "Organisation requise" }); return; }
            const parsed = createBookingSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            res.status(201).json(await service.create(userId, organizationId, parsed.data));
        } catch (err) { next(err); }
    }

    async getMyBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId } = req.user!;
            const page  = parseInt(req.query.page  as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            res.json(await service.getMyBookings(userId, page, limit));
        } catch (err) { next(err); }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            res.json(await service.getById(req.params.id as string));
        } catch (err) { next(err); }
    }

    async cancelByUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId } = req.user!;
            const reason = (req.body as { reason?: string }).reason;
            await service.cancelByUser(req.params.id as string, userId, reason);
            res.status(204).send();
        } catch (err) { next(err); }
    }

    async rate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId } = req.user!;
            const parsed = rateSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            res.json(await service.rate(req.params.id as string, userId, parsed.data.score, parsed.data.comment));
        } catch (err) { next(err); }
    }

    // ── Partner portal actions ────────────────────────────────────────────────

    async getPartnerBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const partnerId = req.partnerUser?.partnerId ?? (req.query.partnerId as string);
            const page  = parseInt(req.query.page  as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            res.json(await service.getPartnerBookings(partnerId, page, limit));
        } catch (err) { next(err); }
    }

    async confirmBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const partnerId  = req.partnerUser!.partnerId;
            const partnerNotes = (req.body as { notes?: string }).notes;
            res.json(await service.confirm(req.params.id as string, partnerId, partnerNotes));
        } catch (err) { next(err); }
    }

    async rejectBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const partnerId = req.partnerUser!.partnerId;
            const parsed = rejectSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            await service.reject(req.params.id as string, partnerId, parsed.data.reason);
            res.status(204).send();
        } catch (err) { next(err); }
    }

    async completeBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            res.json(await service.complete(req.params.id as string));
        } catch (err) { next(err); }
    }

    // ── Admin actions ─────────────────────────────────────────────────────────

    async getAllForAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { status, partnerId, organizationId } = req.query as Record<string, string | undefined>;
            const page  = parseInt(req.query.page  as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const { BookingStatus } = await import("@prisma/client");
            res.json(await service.getAllForAdmin({
                status:         status ? (BookingStatus[status as keyof typeof BookingStatus] ?? undefined) : undefined,
                partnerId,
                organizationId,
                page,
                limit,
            }));
        } catch (err) { next(err); }
    }
}
