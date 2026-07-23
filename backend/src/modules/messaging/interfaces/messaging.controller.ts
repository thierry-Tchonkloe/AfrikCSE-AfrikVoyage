// import { Request, Response } from "express";
// import { MessagingRepository } from "../infrastructure/messaging.repository";

// const repo = new MessagingRepository();

// export class MessagingController {
//   async getConversations(req: Request, res: Response): Promise<void> {
//     const convs = await repo.getConversations(req.user!.userId);
//     res.json(convs);
//   }

//   async createConversation(req: Request, res: Response): Promise<void> {
//     try {
//       const { participantIds } = req.body as { participantIds: string[] };
//       const all = [...new Set([req.user!.userId, ...participantIds])];
//       const conv = await repo.createConversation(req.user!.organizationId!, all);
//       res.status(201).json(conv);
//     } catch (err: any) {
//       res.status(400).json({ message: err.message });
//     }
//   }

//   async getMessages(req: Request, res: Response): Promise<void> {
//     const page = parseInt(req.query.page as string) || 1;
//     const msgs = await repo.getMessages(req.params.id as string, page);
//     res.json(msgs);
//   }

//   async sendMessage(req: Request, res: Response): Promise<void> {
//     try {
//       const msg = await repo.sendMessage(
//         req.params.id as string,
//         req.user!.userId,
//         req.body.content
//       );
//       res.status(201).json(msg);
//     } catch (err: any) {
//       res.status(400).json({ message: err.message });
//     }
//   }

//   async markAsRead(req: Request, res: Response): Promise<void> {
//     await repo.markAsRead(req.params.id as string, req.user!.userId);
//     res.json({ success: true });
//   }
// }




import { Request, Response } from "express";
import { ConversationStatus } from "@prisma/client";
import { MessagingRepository } from "../infrastructure/messaging.repository";
import { NotificationRepository } from "../../notification/infrastructure/notification.repository";
import { IdParamString } from "../../../core/validators/param.validators";

const repo = new MessagingRepository();
const notificationRepo = new NotificationRepository();

/** Lien vers l'interface de messagerie adaptée au rôle du destinataire */
function messagingLinkForRole(role: string): string {
    if (role === "SUPER_ADMIN") return "/admin/messages";
    if (role === "EMPLOYE") return "/employes/support";
    return "/companies/AfrikCSE/messages";
}

export class MessagingController {
    /**
     * Liste les conversations selon le rôle :
     * - SUPER_ADMIN → toutes les conversations
     * - Autres → conversations de son organisation
     */
    async getConversations(req: Request, res: Response): Promise<void> {
        const { role, organizationId, userId } = req.user!;

        if (role === "SUPER_ADMIN") {
        const page = req.query.page !== undefined ? parseInt(req.query.page as string) : undefined;
        const limit = req.query.limit !== undefined ? parseInt(req.query.limit as string) : undefined;
        const search = req.query.search as string | undefined;
        const status = req.query.status as ConversationStatus | undefined;

        const result = await repo.getAllConversations(userId, { page, limit, search, status });
        res.json(result);
        return;
        }

        const convs = await repo.getConversationsByOrg(organizationId!, userId);
        res.json(convs);
    }

    /**
     * Ouvre ou récupère la conversation support de l'organisation (unique par org).
     * Utilisée par les admins entreprise ET les employés ; l'appelant est
     * ajouté comme participant s'il ne l'est pas déjà.
     */
    async getOrCreateSupport(req: Request, res: Response): Promise<void> {
        const { organizationId, userId } = req.user!;
        if (!organizationId) {
        res.status(400).json({ message: "Organisation requise" });
        return;
        }
        try {
        const conv = await repo.getOrCreateSupportConversation(organizationId, userId);
        res.json(conv);
        } catch (err: any) {
        res.status(500).json({ message: err.message });
        }
    }

    async getMessages(req: Request<IdParamString>, res: Response): Promise<void> {
        const page = parseInt(req.query.page as string) || 1;
        const msgs = await repo.getMessages(req.params.id, req.user!.userId, page);
        if (msgs === null) {
        res.status(403).json({ message: "Accès refusé à cette conversation" });
        return;
        }
        res.json(msgs);
    }

    async sendMessage(req: Request<IdParamString>, res: Response): Promise<void> {
        const { content } = req.body;
        if (!content?.trim()) {
        res.status(400).json({ message: "Message vide" });
        return;
        }
        try {
        const msg = await repo.sendMessage(req.params.id, req.user!.userId, content);
        if (msg === null) {
            res.status(403).json({ message: "Accès refusé à cette conversation" });
            return;
        }

        const recipients = await repo.getOtherParticipants(req.params.id, req.user!.userId);
        const preview = content.length > 100 ? `${content.slice(0, 100)}…` : content;
        for (const recipient of recipients) {
            await notificationRepo.createForUsers(
            [recipient.id],
            `Nouveau message de ${msg.sender.firstName} ${msg.sender.lastName}`,
            preview,
            "MESSAGE_RECEIVED",
            messagingLinkForRole(recipient.role)
            );
        }

        res.status(201).json(msg);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async markAsRead(req: Request<IdParamString>, res: Response): Promise<void> {
        await repo.markAsRead(req.params.id, req.user!.userId);
        res.json({ success: true });
    }

    async getUnreadCount(req: Request, res: Response): Promise<void> {
        const count = await repo.getUnreadCount(req.user!.userId);
        res.json({ count });
    }

    /**
     * Marque une conversation comme résolue ou ouverte (Super Admin)
     */
    async updateStatus(req: Request<IdParamString>, res: Response): Promise<void> {
        const { status } = req.body;
        if (status !== "OPEN" && status !== "RESOLVED") {
        res.status(400).json({ message: "Statut invalide" });
        return;
        }
        try {
        const conv = await repo.updateStatus(req.params.id, status);
        res.json(conv);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }
}