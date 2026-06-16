import { Request, Response } from "express";
import { OrganizationService } from "../application/organization.service";
import { validateOrgSchema, rejectOrgSchema, updateModulesSchema, updateOrgSchema, } from "./organization.validator";
import { OrgStatus } from "@prisma/client";
import { prisma } from "../../../core/config/prisma";
import { toCsv } from "../../../core/utils/csv";
import { logAudit } from "../../../core/utils/audit";
import { cloudinary } from "../../../core/config/cloudinary";
import { UploadApiResponse } from "cloudinary";

const STATUS_LABELS: Record<string, string> = {
    PENDING: "En attente",
    ACTIVE: "Active",
    SUSPENDED: "Suspendue",
    REJECTED: "Refusée",
};

const service = new OrganizationService();

export class OrganizationController {
    async getAll(req: Request, res: Response): Promise<void> {
        const status = req.query.status as OrgStatus | undefined;
        const orgs = await service.getAll(status);
        res.status(200).json(orgs);
    }

    async getById(req: Request, res: Response): Promise<void> {
        try {
        const org = await service.getById(req.params.id as string);
        res.status(200).json(org);
        } catch (err: any) {
        res.status(404).json({ message: err.message });
        }
    }

    async validate(req: Request, res: Response): Promise<void> {
        const parsed = validateOrgSchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }

        try {
        const org = await service.validate(
            req.params.id as string,
            req.user!.userId,
            parsed.data
        );
        await logAudit({
            action: "ORG_VALIDATED",
            entity: "Organization",
            entityId: org.id,
            userId: req.user!.userId,
            organizationId: org.id,
            newValue: parsed.data,
            req,
        });
        res.status(200).json({ message: "Organisation validée", org });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async reject(req: Request, res: Response): Promise<void> {
        const parsed = rejectOrgSchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }

        try {
        const org = await service.reject(req.params.id as string, parsed.data);
        await logAudit({
            action: "ORG_REJECTED",
            entity: "Organization",
            entityId: org.id,
            userId: req.user!.userId,
            organizationId: org.id,
            newValue: parsed.data,
            req,
        });
        res.status(200).json({ message: "Organisation rejetée", org });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async updateModules(req: Request, res: Response): Promise<void> {
        const parsed = updateModulesSchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }

        try {
        const org = await service.updateModules(req.params.id as string, parsed.data);
        await logAudit({
            action: "ORG_MODULES_UPDATED",
            entity: "Organization",
            entityId: org.id,
            userId: req.user!.userId,
            organizationId: org.id,
            newValue: parsed.data,
            req,
        });
        res.status(200).json({ message: "Modules mis à jour", org });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async suspend(req: Request, res: Response): Promise<void> {
        try {
        const org = await service.suspend(req.params.id as string);
        await logAudit({
            action: "ORG_SUSPENDED",
            entity: "Organization",
            entityId: org.id,
            userId: req.user!.userId,
            organizationId: org.id,
            req,
        });
        res.status(200).json({ message: "Organisation suspendue", org });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }


    async createByAdmin(req: Request, res: Response): Promise<void> {
        try {
            const result = await service.createByAdmin(req.body);
            res.status(201).json(result);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async validateWithInvitation(req: Request, res: Response): Promise<void> {
        try {
            const result = await service.validateWithInvitation(
            req.params.id as string,
            req.user!.userId,
            req.body
            );
            res.json(result);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async getPaginated(req: Request, res: Response): Promise<void> {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string | undefined;
        const status = req.query.status as string | undefined;
        const module = req.query.module as string | undefined;

        const result = await service.getPaginated({ page, limit, search, status, module });
            res.json(result);
        }

    /** Export CSV des organisations (mêmes filtres que la liste paginée) */
    async exportCsv(req: Request, res: Response): Promise<void> {
        const search = req.query.search as string | undefined;
        const status = req.query.status as string | undefined;
        const module = req.query.module as string | undefined;

        const orgs = await service.getAllForExport({ search, status, module });

        const rows = orgs.map((org) => ({
            name: org.name,
            businessEmail: org.businessEmail ?? "",
            country: org.country ?? "",
            city: org.city ?? "",
            phone: org.phone ?? "",
            plan: org.plan,
            status: STATUS_LABELS[org.status] ?? org.status,
            hasCSE: org.hasCSE ? "Oui" : "Non",
            hasVoyage: org.hasVoyage ? "Oui" : "Non",
            usersCount: org._count.users,
            adminName: org.users[0] ? `${org.users[0].firstName} ${org.users[0].lastName}` : "",
            adminEmail: org.users[0]?.email ?? "",
            createdAt: org.createdAt.toISOString().slice(0, 10),
        }));

        const csv = toCsv(rows, [
            { key: "name", label: "Entreprise" },
            { key: "businessEmail", label: "Email" },
            { key: "country", label: "Pays" },
            { key: "city", label: "Ville" },
            { key: "phone", label: "Téléphone" },
            { key: "plan", label: "Plan" },
            { key: "status", label: "Statut" },
            { key: "hasCSE", label: "AfrikCSE" },
            { key: "hasVoyage", label: "AfrikVoyage" },
            { key: "usersCount", label: "Utilisateurs" },
            { key: "adminName", label: "Administrateur" },
            { key: "adminEmail", label: "Email administrateur" },
            { key: "createdAt", label: "Date d'inscription" },
        ]);

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="organisations-${new Date().toISOString().slice(0, 10)}.csv"`);
        res.send(csv);
    }

    async softDelete(req: Request, res: Response): Promise<void> {
        try {
            await service.softDelete(req.params.id as string);
            await logAudit({
                action: "ORG_DELETED",
                entity: "Organization",
                entityId: req.params.id as string,
                userId: req.user!.userId,
                organizationId: req.params.id as string,
                req,
            });
            res.json({ message: "Organisation désactivée" });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async getMyDashboard(req: Request, res: Response): Promise<void> {
        try {
            const orgId = req.user!.organizationId;
            if (!orgId) {
                res.status(400).json({ message: "Organisation introuvable" });
                return;
            }
            const [org, userCount] = await Promise.all([
            prisma.organization.findUnique({
                where: { id: orgId },
                select: {
                id: true, name: true, status: true, plan: true,
                hasCSE: true, hasVoyage: true,
                logoUrl: true,
                primaryColor: true, secondaryColor: true, accentColor: true,
                phone: true,
                businessEmail: true,
                address: true,
                city: true,
                country: true,
                industry: true,
                size: true,
                legalName: true,
                registrationNumber: true,
                vatNumber: true,
                _count: { select: { users: true } },
                },
            }),
            prisma.user.count({ where: { organizationId: orgId, isActive: true } }),
            ]);
            res.json({ org, activeUsers: userCount });
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }



    // Réactivation d'une organisation suspendue
    async reactivate(req: Request, res: Response): Promise<void> {
        try {
            const org = await prisma.organization.update({
            where: { id: req.params.id as string },
            data: { status: "ACTIVE" },
            });
            await logAudit({
                action: "ORG_REACTIVATED",
                entity: "Organization",
                entityId: org.id,
                userId: req.user!.userId,
                organizationId: org.id,
                req,
            });
            res.json({ message: "Organisation réactivée", org });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    // Mise à jour des infos de base — champs whitelistés uniquement
    // (status/plan/modules ont leurs propres routes dédiées et contrôlées)
    async update(req: Request, res: Response): Promise<void> {
        const parsed = updateOrgSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }

        try {
            const org = await prisma.organization.update({
            where: { id: req.params.id as string },
            data: parsed.data,
            });
            await logAudit({
                action: "ORG_UPDATED",
                entity: "Organization",
                entityId: org.id,
                userId: req.user!.userId,
                organizationId: org.id,
                newValue: parsed.data,
                req,
            });
            res.json(org);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    // Admin met à jour sa propre organisation
    async updateMyOrg(req: Request, res: Response): Promise<void> {
        const orgId = req.user!.organizationId;
        if (!orgId) {
            res.status(400).json({ message: "Organisation introuvable" });
            return;
        }

        const parsed = updateOrgSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }

        try {
            const org = await prisma.organization.update({
                where: { id: orgId },
                data: parsed.data,
            });
            await logAudit({
                action: "ORG_UPDATED",
                entity: "Organization",
                entityId: orgId,
                userId: req.user!.userId,
                organizationId: orgId,
                newValue: parsed.data,
                req,
            });
            res.json(org);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    // Upload du logo de l'organisation connectée (ADMIN/MANAGER)
    async uploadLogo(req: Request, res: Response): Promise<void> {
        const orgId = req.user!.organizationId;
        if (!orgId) {
            res.status(400).json({ message: "Organisation introuvable" });
            return;
        }
        if (!req.file) {
            res.status(400).json({ message: "Aucun fichier fourni" });
            return;
        }

        try {
            const result = await new Promise<UploadApiResponse>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: `afrikcse/logos/${orgId}`,
                        resource_type: "image",
                    },
                    (err, uploadResult) => {
                        if (err || !uploadResult) reject(err ?? new Error("Échec de l'upload"));
                        else resolve(uploadResult);
                    }
                );
                stream.end(req.file!.buffer);
            });

            const org = await prisma.organization.update({
                where: { id: orgId },
                data: { logoUrl: result.secure_url },
            });
            res.json({ logoUrl: org.logoUrl });
        } catch (err: any) {
            res.status(500).json({ message: err.message ?? "Échec de l'upload du logo" });
        }
    }

    // Générer un nouveau lien d'invitation
    async regenerateInvitation(req: Request, res: Response): Promise<void> {
        try {
            const org = await prisma.organization.findUnique({
            where: { id: req.params.id as string },
            include: { users: { where: { role: "ADMIN" }, take: 1 } },
            });
            if (!org) { res.status(404).json({ message: "Introuvable" }); return; }

            const crypto = await import("node:crypto");
            const rawToken = crypto.randomBytes(32).toString("hex");
            const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            await prisma.invitationToken.create({
            data: { token: hashedToken, organizationId: org.id, expiresAt },
            });

            if (org.users[0]) {
            await prisma.user.update({
                where: { id: org.users[0].id },
                data: { resetPasswordToken: hashedToken, resetPasswordExpiresAt: expiresAt },
            });
            }

            const invitationLink = `${process.env.FRONTEND_URL}/activate?token=${rawToken}`;
            res.json({ invitationLink });
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }
}