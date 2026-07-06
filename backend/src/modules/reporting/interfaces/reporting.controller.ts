import { Request, Response, NextFunction } from "express";
import { ReportingRepository } from "../infrastructure/reporting.repository";

const repo = new ReportingRepository();

export class ReportingController {
    async platformKpis(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try { res.json(await repo.getPlatformKpis()); }
        catch (err) { next(err); }
    }

    async bookingsByStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try { res.json(await repo.getBookingsByStatus()); }
        catch (err) { next(err); }
    }

    async bookingsPerMonth(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const months = parseInt(req.query.months as string) || 6;
            res.json(await repo.getBookingsPerMonth(months));
        } catch (err) { next(err); }
    }

    async ordersPerMonth(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const months = parseInt(req.query.months as string) || 6;
            res.json(await repo.getOrdersPerMonth(months));
        } catch (err) { next(err); }
    }

    async topPartners(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try { res.json(await repo.getTopPartners(10)); }
        catch (err) { next(err); }
    }

    async commissionSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try { res.json(await repo.getCommissionSummary()); }
        catch (err) { next(err); }
    }

    async orgKpis(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const orgId = req.user!.organizationId;
            if (!orgId) { res.status(400).json({ message: "Organisation requise" }); return; }
            res.json(await repo.getOrgKpis(orgId));
        } catch (err) { next(err); }
    }

    async orgBookingsPerMonth(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const orgId  = req.user!.organizationId;
            const months = parseInt(req.query.months as string) || 6;
            if (!orgId) { res.status(400).json({ message: "Organisation requise" }); return; }
            res.json(await repo.getOrgBookingsPerMonth(orgId, months));
        } catch (err) { next(err); }
    }
}
