import { Request, Response } from "express";
import { TravelRepository } from "../infrastructure/travel.repository";
import { RequestStatus, TravelStatus, Urgency } from "@prisma/client";
import { dispatchNotificationToUsers } from "../../notification/application/notification.service";
import { IdParamString } from "../../../core/validators/param.validators";
import { dispatchWebhook } from "../../../core/services/webhook.service";

const repo = new TravelRepository();

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

    async getById(req: Request<IdParamString>, res: Response): Promise<void> {
        const item = await repo.getById(req.user!.organizationId!, req.params.id);
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

    async approve(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
        const result = await repo.approve(req.params.id, req.user!.organizationId!, req.user!.userId);
        dispatchNotificationToUsers(
            "REQUEST_APPROVED",
            [result.requestedById],
            { requestType: "voyage", subject: result.destination },
            "/employes/voyages"
        ).catch(() => {});
        dispatchWebhook(result.organizationId, "travel.approved", {
            travelRequestId: result.id, destination: result.destination,
            requestedById: result.requestedById, approvedAt: result.approvedAt,
        }).catch(() => {});
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async reject(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
        const result = await repo.reject(req.params.id, req.user!.organizationId!, req.body.note);
        dispatchNotificationToUsers(
            "REQUEST_REJECTED",
            [result.requestedById],
            { requestType: "voyage", subject: result.destination, reason: result.rejectionNote ?? "" },
            "/employes/voyages"
        ).catch(() => {});
        dispatchWebhook(result.organizationId, "travel.rejected", {
            travelRequestId: result.id, destination: result.destination,
            requestedById: result.requestedById, rejectionNote: result.rejectionNote,
        }).catch(() => {});
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async updateStatus(req: Request<IdParamString>, res: Response): Promise<void> {
        const { status } = req.body;
        if (!TRAVEL_STATUSES.includes(status)) {
        res.status(400).json({ message: "Statut invalide" });
        return;
        }
        try {
        const result = await repo.updateStatus(req.params.id, req.user!.organizationId!, status, req.user!.userId);
        if (status === "APPROVED") {
            dispatchNotificationToUsers(
            "REQUEST_APPROVED",
            [result.requestedById],
            { requestType: "voyage", subject: result.destination },
            "/employes/voyages"
            ).catch(() => {});
            dispatchWebhook(result.organizationId, "travel.approved", {
            travelRequestId: result.id, destination: result.destination,
            requestedById: result.requestedById, approvedAt: result.approvedAt,
            }).catch(() => {});
        } else if (status === "REJECTED") {
            dispatchNotificationToUsers(
            "REQUEST_REJECTED",
            [result.requestedById],
            { requestType: "voyage", subject: result.destination, reason: result.rejectionNote ?? "" },
            "/employes/voyages"
            ).catch(() => {});
            dispatchWebhook(result.organizationId, "travel.rejected", {
            travelRequestId: result.id, destination: result.destination,
            requestedById: result.requestedById, rejectionNote: result.rejectionNote,
            }).catch(() => {});
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
        const orgId = req.user!.organizationId!;
        const result = await repo.bulkApprove(orgId, ids, req.user!.userId);
        for (const request of result.requests) {
            dispatchNotificationToUsers(
            "REQUEST_APPROVED",
            [request.requestedById],
            { requestType: "voyage", subject: request.destination },
            "/employes/voyages"
            ).catch(() => {});
            dispatchWebhook(orgId, "travel.approved", {
            travelRequestId: request.id, destination: request.destination,
            requestedById: request.requestedById,
            }).catch(() => {});
        }
        res.json({ count: result.count });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async assignPartner(req: Request<IdParamString>, res: Response): Promise<void> {
        const { partnerId } = req.body as { partnerId?: string };
        if (!partnerId || typeof partnerId !== "string") {
        res.status(400).json({ message: "partnerId requis" });
        return;
        }
        try {
        const result = await repo.assignPartner(req.params.id, req.user!.organizationId!, partnerId);
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async listPartners(_req: Request, res: Response): Promise<void> {
        res.json(await repo.listActivePartners());
    }

    async updatePayment(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
        const { paymentStatus, paymentLink } = req.body;
        const result = await repo.updatePayment(req.params.id, req.user!.organizationId!, { paymentStatus, paymentLink });
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

    async approveExpense(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
        const result = await repo.approveExpense(req.params.id, req.user!.organizationId!, req.user!.userId);
        dispatchNotificationToUsers(
            "REQUEST_APPROVED",
            [result.employee.userId],
            { requestType: "note de frais", subject: result.title },
            "/employes/notes-de-frais"
        ).catch(() => {});
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async rejectExpense(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
        const result = await repo.rejectExpense(req.params.id, req.user!.organizationId!, req.body.note);
        dispatchNotificationToUsers(
            "REQUEST_REJECTED",
            [result.employee.userId],
            { requestType: "note de frais", subject: result.title, reason: result.rejectionNote ?? "" },
            "/employes/notes-de-frais"
        ).catch(() => {});
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }
}