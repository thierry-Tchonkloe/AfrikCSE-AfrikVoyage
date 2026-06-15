import { Request, Response } from "express";
import { TravelRepository } from "../infrastructure/travel.repository";
import { RequestStatus, TravelStatus, Urgency } from "@prisma/client";
import { NotificationRepository } from "../../notification/infrastructure/notification.repository";

const repo = new TravelRepository();
const notificationRepo = new NotificationRepository();

const TRAVEL_STATUSES: TravelStatus[] = [
    "PENDING", "APPROVED", "REJECTED", "CANCELLED", "IN_PROGRESS", "COMPLETED",
];

export class TravelController {
    async getAll(req: Request, res: Response): Promise<void> {
        const { status, department, urgency, minAmount, maxAmount, search, startDate, endDate, page, limit } = req.query;
        const data = await repo.getAll(req.user!.organizationId!, {
        status: status as TravelStatus,
        department: department as string,
        urgency: urgency as Urgency,
        minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
        search: search as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        });
        res.json(data);
    }

    async getById(req: Request, res: Response): Promise<void> {
        const item = await repo.getById(req.user!.organizationId!, req.params.id as string);
        if (!item) {
        res.status(404).json({ message: "Réservation introuvable" });
        return;
        }
        res.json(item);
    }

    async getStats(req: Request, res: Response): Promise<void> {
        const stats = await repo.getStats(req.user!.organizationId!);
        res.json(stats);
    }

    async approve(req: Request, res: Response): Promise<void> {
        try {
        const result = await repo.approve(req.params.id as string, req.user!.userId);
        await notificationRepo.createForUsers(
            [result.requestedById],
            "Voyage approuvé",
            `Votre demande de voyage pour ${result.destination} a été approuvée.`,
            "REQUEST_APPROVED",
            "/employes/voyages"
        );
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async reject(req: Request, res: Response): Promise<void> {
        try {
        const result = await repo.reject(req.params.id as string, req.body.note);
        await notificationRepo.createForUsers(
            [result.requestedById],
            "Voyage rejeté",
            `Votre demande de voyage pour ${result.destination} a été rejetée. Motif : ${result.rejectionNote}`,
            "REQUEST_REJECTED",
            "/employes/voyages"
        );
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async updateStatus(req: Request, res: Response): Promise<void> {
        const { status } = req.body;
        if (!TRAVEL_STATUSES.includes(status)) {
        res.status(400).json({ message: "Statut invalide" });
        return;
        }
        try {
        const result = await repo.updateStatus(req.params.id as string, status, req.user!.userId);
        if (status === "APPROVED") {
            await notificationRepo.createForUsers(
            [result.requestedById],
            "Voyage approuvé",
            `Votre demande de voyage pour ${result.destination} a été approuvée.`,
            "REQUEST_APPROVED",
            "/employes/voyages"
            );
        } else if (status === "REJECTED") {
            await notificationRepo.createForUsers(
            [result.requestedById],
            "Voyage rejeté",
            `Votre demande de voyage pour ${result.destination} a été rejetée.`,
            "REQUEST_REJECTED",
            "/employes/voyages"
            );
        }
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async getApprovalStats(req: Request, res: Response): Promise<void> {
        const stats = await repo.getApprovalStats(req.user!.organizationId!);
        res.json(stats);
    }

    async bulkApprove(req: Request, res: Response): Promise<void> {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ message: "Aucune demande sélectionnée" });
        return;
        }
        try {
        const result = await repo.bulkApprove(req.user!.organizationId!, ids, req.user!.userId);
        for (const request of result.requests) {
            await notificationRepo.createForUsers(
            [request.requestedById],
            "Voyage approuvé",
            `Votre demande de voyage pour ${request.destination} a été approuvée.`,
            "REQUEST_APPROVED",
            "/employes/voyages"
            );
        }
        res.json({ count: result.count });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async assignPartner(req: Request, res: Response): Promise<void> {
        try {
        const result = await repo.assignPartner(req.params.id as string, req.body.partnerName);
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async updatePayment(req: Request, res: Response): Promise<void> {
        try {
        const { paymentStatus, paymentLink } = req.body;
        const result = await repo.updatePayment(req.params.id as string, { paymentStatus, paymentLink });
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async getExpenses(req: Request, res: Response): Promise<void> {
        const { status, department, page, limit } = req.query;
        const data = await repo.getExpenses(req.user!.organizationId!, {
        status: status as RequestStatus,
        department: department as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        });
        res.json(data);
    }

    async getExpenseStats(req: Request, res: Response): Promise<void> {
        const stats = await repo.getExpenseStats(req.user!.organizationId!);
        res.json(stats);
    }

    async approveExpense(req: Request, res: Response): Promise<void> {
        try {
        const result = await repo.approveExpense(req.params.id as string, req.user!.userId);
        await notificationRepo.createForUsers(
            [result.employee.userId],
            "Note de frais approuvée",
            `Votre note de frais « ${result.title} » a été approuvée.`,
            "REQUEST_APPROVED",
            "/employes/notes-de-frais"
        );
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async rejectExpense(req: Request, res: Response): Promise<void> {
        try {
        const result = await repo.rejectExpense(req.params.id as string, req.body.note);
        await notificationRepo.createForUsers(
            [result.employee.userId],
            "Note de frais rejetée",
            `Votre note de frais « ${result.title} » a été rejetée. Motif : ${result.rejectionNote}`,
            "REQUEST_REJECTED",
            "/employes/notes-de-frais"
        );
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }
}