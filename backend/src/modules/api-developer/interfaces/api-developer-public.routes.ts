import { Router, Request, Response } from "express";
import { apiKeyAuth } from "../../../core/middlewares/apiKeyAuth";

const router = Router();

// Endpoint de vérification pour un intégrateur tiers : confirme qu'une clé
// générée sur /admin/developer authentifie réellement un appel, sans exposer
// de données métier — sert de "hello world" pour valider l'intégration.
router.get("/ping", apiKeyAuth, (req: Request, res: Response) => {
    res.json({
        message:  "pong",
        clientId: req.apiClient!.id,
        orgId:    req.apiClient!.orgId,
        scopes:   req.apiClient!.scopes,
        timestamp: new Date().toISOString(),
    });
});

export default router;
