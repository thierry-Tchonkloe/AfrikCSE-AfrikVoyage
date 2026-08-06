// core/middlewares/idempotency.middleware.ts
//
// Middleware générique d'idempotence pour les routes d'écriture qui n'ont pas
// (ou pas encore) de mécanisme dédié (clé fonctionnelle, contrainte @@unique
// métier...). Purement opt-in côté client : sans header `Idempotency-Key`, il
// ne fait rigoureusement rien — aucun risque de régression pour les appelants
// existants qui ne l'envoient pas encore.
//
// Fonctionnement :
//   1. Le client fournit un header `Idempotency-Key` (UUID généré à la
//      création du formulaire, conservé le temps de la soumission).
//   2. On tente de "claim" cette clé pour cette route (+ org) via un INSERT
//      protégé par une contrainte @@unique — l'atomicité vient de la
//      contrainte DB, pas d'un lock applicatif.
//   3. Si le claim réussit, le handler s'exécute normalement ; sa réponse
//      (statut + corps JSON) est mise en cache sur la ligne à la fin de la
//      requête (sauf en cas d'erreur serveur 5xx, où la ligne est supprimée
//      pour permettre un retry propre).
//   4. Si le claim échoue (P2002), une requête avec la même clé a déjà été
//      traitée ou est en cours : on rejoue la réponse mise en cache, ou on
//      renvoie 409 si elle est encore en cours (course concurrente réelle).

import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";

const PENDING_CLAIM_TTL_MS = 2 * 60 * 1000; // au-delà, une clé PENDING est considérée orpheline (crash serveur)

function routeIdFor(req: Request): string {
    const pattern = (req.route?.path as string | undefined) ?? req.path;
    return `${req.method}:${req.baseUrl}${pattern}`;
}

async function replayOrReject(req: Request, res: Response, next: NextFunction, route: string, organizationId: string, key: string): Promise<void> {
    const existing = await prisma.idempotencyRecord.findUnique({
        where: { route_organizationId_key: { route, organizationId, key } },
    });

    if (!existing) {
        // Filet de sécurité — ne devrait pas arriver (le P2002 implique qu'une ligne existe).
        next();
        return;
    }

    if (existing.status === "DONE") {
        res.status(existing.responseStatus ?? 200).json(existing.responseBody ?? {});
        return;
    }

    // PENDING : soit une vraie requête concurrente en cours de traitement, soit
    // une clé orpheline laissée par un crash serveur avant écriture du résultat.
    if (Date.now() - existing.createdAt.getTime() > PENDING_CLAIM_TTL_MS) {
        await prisma.idempotencyRecord.delete({ where: { id: existing.id } }).catch(() => {});
        await claimAndProceed(req, res, next, route, organizationId, key);
        return;
    }

    res.status(409).json({
        success: false,
        message: "Une requête avec cette Idempotency-Key est déjà en cours de traitement — réessayez dans un instant.",
    });
}

async function claimAndProceed(req: Request, res: Response, next: NextFunction, route: string, organizationId: string, key: string): Promise<void> {
    let claimId: string;
    try {
        const claim = await prisma.idempotencyRecord.create({
            data: { key, route, organizationId, status: "PENDING" },
        });
        claimId = claim.id;
    } catch (err: any) {
        if (err?.code === "P2002") {
            await replayOrReject(req, res, next, route, organizationId, key);
            return;
        }
        next(err);
        return;
    }

    const originalJson = res.json.bind(res);
    let capturedBody: unknown;
    res.json = ((body: unknown) => {
        capturedBody = body;
        return originalJson(body);
    }) as Response["json"];

    res.on("finish", () => {
        void (async () => {
            try {
                if (res.statusCode >= 500) {
                    // Échec serveur : on libère la clé pour autoriser un retry propre.
                    await prisma.idempotencyRecord.delete({ where: { id: claimId } });
                    return;
                }
                await prisma.idempotencyRecord.update({
                    where: { id: claimId },
                    data: { status: "DONE", responseStatus: res.statusCode, responseBody: (capturedBody ?? {}) as object },
                });
            } catch {
                // Best-effort : un échec de mise en cache ne doit jamais faire échouer la requête déjà répondue.
            }
        })();
    });

    next();
}

export function idempotency() {
    return function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
        const header = req.headers["idempotency-key"];
        const key = Array.isArray(header) ? header[0] : header;
        if (!key || !key.trim()) {
            next();
            return;
        }
        const route = routeIdFor(req);
        // Le tenant peut être une organisation (employé/admin) ou un partenaire
        // (portail partenaire, req.partnerUser) — sans quoi deux tenants distincts
        // envoyant la même Idempotency-Key collisionneraient sur le même "platform".
        const organizationId = req.user?.organizationId ?? req.partnerUser?.partnerId ?? "platform";

        void claimAndProceed(req, res, next, route, organizationId, key.trim());
    };
}
