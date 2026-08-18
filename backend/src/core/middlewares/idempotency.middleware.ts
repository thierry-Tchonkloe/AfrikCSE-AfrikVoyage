// core/middlewares/idempotency.middleware.ts

import { createHash, randomUUID } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { prisma } from "../config/prisma";

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

function envInt(name: string, fallback: number): number {
    const raw = process.env[name];
    if (raw === undefined || raw.trim() === "") return fallback;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}


const DEFAULT_PENDING_TTL_MS = envInt("IDEMPOTENCY_PENDING_TTL", 120) * 1000; /** Durée pendant laquelle un claim PENDING est considéré vivant (secondes). */

const DEFAULT_RECORD_TTL_MS = envInt("IDEMPOTENCY_RECORD_TTL_HOURS", 24) * 60 * 60 * 1000; /** Durée de rétention d'une réponse rejouable (heures). */

const DEFAULT_MAX_BODY_BYTES = envInt("IDEMPOTENCY_MAX_BODY_KB", 256) * 1024; /** Taille maximale du corps mis en cache (Ko). Au-delà : statut seul. */

const UUID_V4_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i; /** UUID v4 ou v7, variante RFC 4122. */

const MAX_ACQUIRE_ATTEMPTS = 3;

export interface IdempotencyOptions {
    pendingTtlMs?: number; /** TTL du lease PENDING en ms. Défaut : IDEMPOTENCY_PENDING_TTL (120 s). */
    recordTtlMs?: number;  /** Rétention de la réponse en ms. Défaut : IDEMPOTENCY_RECORD_TTL_HOURS (24 h). */
    maxBodyBytes?: number; /** Taille max du corps mis en cache. Défaut : IDEMPOTENCY_MAX_BODY_KB (256 Ko). */
    validateKey?: boolean; /** Rejeter les clés non conformes (400). Défaut : true. */
    keyPattern?: RegExp;   /** Format accepté pour la clé. Défaut : UUID v4 / v7. */
    tenantResolver?: (req: Request) => string; /** Identité du tenant. Défaut : organizationId → partnerId → "platform". */
    routeResolver?: (req: Request) => string; /** Identifiant logique de la route (clé d'unicité). Défaut : METHOD:baseUrl+path. */
    releaseOnStatus?: (status: number) => boolean; /** Statuts pour lesquels la clé est libérée (retry autorisé). Défaut : >= 500 et 429. */
}

type Encoding = "json" | "text" | "base64" | "none";

interface IdempotencyRow {
    id: string;
    key: string;
    route: string;
    organizationId: string;
    requestHash: string;
    status: string;
    lease: string;
    leaseExpiresAt: Date;
    responseStatus: number | null;
    responseBody: unknown;
    responseText: string | null;
    responseEncoding: string | null;
    responseContentType: string | null;
    expiresAt: Date;
    createdAt: Date;
}

const STATUS_PENDING = "PENDING";
const STATUS_DONE = "DONE";

/* -------------------------------------------------------------------------- */
/* Hash du payload                                                            */
/* -------------------------------------------------------------------------- */

function stableStringify(value: unknown): string {
    if (value === undefined) return "null";
    if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
    if (Buffer.isBuffer(value)) return `"b64:${value.toString("base64")}"`;
    if (value instanceof Date) return JSON.stringify(value.toISOString());
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    const entries = Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`);
    return `{${entries.join(",")}}`;
}

export function hashRequest(req: Request): string {
    const payload = [
        req.method,
        stableStringify(req.query ?? {}),
        stableStringify((req as Request & { body?: unknown }).body ?? {}),
    ].join("\n");
    return createHash("sha256").update(payload).digest("hex");
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function defaultRouteResolver(req: Request): string {
    const pattern = (req.route?.path as string | undefined) ?? req.path;
    return `${req.method}:${req.baseUrl}${pattern}`;
}

function defaultTenantResolver(req: Request): string {
    return req.user?.organizationId ?? req.partnerUser?.partnerId ?? "platform";
}

function defaultReleaseOnStatus(status: number): boolean {
    return status >= 500 || status === 429;
}

function isMutating(method: string): boolean {
    return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}

function contentTypeOf(res: Response): string | null {
    const raw = res.getHeader("content-type");
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw)) return raw[0] ?? null;
    return raw === undefined ? null : String(raw);
}

/* -------------------------------------------------------------------------- */
/* Rejeu d'une réponse mise en cache                                          */
/* -------------------------------------------------------------------------- */

function replay(res: Response, row: IdempotencyRow): void {
    const status = row.responseStatus ?? 200;
    res.setHeader("Idempotent-Replay", "true");
    if (row.responseContentType) res.setHeader("Content-Type", row.responseContentType);

    switch (row.responseEncoding as Encoding | null) {
        case "json":
            res.status(status).json((row.responseBody ?? {}) as object);
            return;
        case "text":
            res.status(status).send(row.responseText ?? "");
            return;
        case "base64":
            res.status(status).send(Buffer.from(row.responseText ?? "", "base64"));
            return;
        default:
            res.setHeader("Idempotent-Replay-Body", "omitted");
            res.status(status).end();
    }
}

/* -------------------------------------------------------------------------- */
/* Acquisition du claim (INSERT, ou reprise atomique du lease)                */
/* -------------------------------------------------------------------------- */

type Acquisition =
    | { kind: "claimed"; id: string; lease: string }
    | { kind: "replay"; row: IdempotencyRow }
    | { kind: "conflict"; retryAfterSec: number }
    | { kind: "mismatch" }
    | { kind: "retry" };

interface AcquireContext {
    route: string;
    organizationId: string;
    key: string;
    requestHash: string;
    pendingTtlMs: number;
    recordTtlMs: number;
}

async function acquire(ctx: AcquireContext): Promise<Acquisition> {
    const now = new Date();
    const lease = randomUUID();

    try {
        const created = (await prisma.idempotencyRecord.create({
            data: {
                key: ctx.key,
                route: ctx.route,
                organizationId: ctx.organizationId,
                requestHash: ctx.requestHash,
                status: STATUS_PENDING,
                lease,
                leaseExpiresAt: new Date(now.getTime() + ctx.pendingTtlMs),
                expiresAt: new Date(now.getTime() + ctx.recordTtlMs),
            },
        })) as IdempotencyRow;
        return { kind: "claimed", id: created.id, lease };
    } catch (err: unknown) {
        if ((err as { code?: string })?.code !== "P2002") throw err;
    }

    // P2002 : la clé existe déjà pour cette route + ce tenant.
    const existing = (await prisma.idempotencyRecord.findUnique({
        where: {
            route_organizationId_key: { route: ctx.route, organizationId: ctx.organizationId, key: ctx.key },
        },
    })) as IdempotencyRow | null;

    // Supprimée entre-temps (purge concurrente) : on retente l'INSERT.
    if (!existing) return { kind: "retry" };

    // Même clé, payload différent → jamais de rejeu silencieux.
    if (existing.requestHash !== ctx.requestHash) return { kind: "mismatch" };

    if (existing.status === STATUS_DONE) {
        if (existing.expiresAt.getTime() > now.getTime()) return { kind: "replay", row: existing };
        // Enregistrement expiré que la purge n'a pas encore ramassé : on le
        // recycle en compare-and-swap plutôt que de le supprimer.
        const recycled = await prisma.idempotencyRecord.updateMany({
            where: { id: existing.id, lease: existing.lease, status: STATUS_DONE, expiresAt: { lt: now } },
            data: {
                status: STATUS_PENDING,
                lease,
                leaseExpiresAt: new Date(now.getTime() + ctx.pendingTtlMs),
                expiresAt: new Date(now.getTime() + ctx.recordTtlMs),
                requestHash: ctx.requestHash,
                responseStatus: null,
                responseBody: undefined,
                responseText: null,
                responseEncoding: null,
                responseContentType: null,
            },
        });
        return recycled.count === 1 ? { kind: "claimed", id: existing.id, lease } : { kind: "retry" };
    }

    // PENDING avec un lease encore valide : vraie concurrence.
    if (existing.leaseExpiresAt.getTime() > now.getTime()) {
        const retryAfterSec = Math.max(1, Math.ceil((existing.leaseExpiresAt.getTime() - now.getTime()) / 1000));
        return { kind: "conflict", retryAfterSec };
    }

    const takeover = await prisma.idempotencyRecord.updateMany({
        where: {
            id: existing.id,
            lease: existing.lease,
            status: STATUS_PENDING,
            leaseExpiresAt: { lt: now },
        },
        data: {
            lease,
            leaseExpiresAt: new Date(now.getTime() + ctx.pendingTtlMs),
            expiresAt: new Date(now.getTime() + ctx.recordTtlMs),
            requestHash: ctx.requestHash,
        },
    });

    return takeover.count === 1 ? { kind: "claimed", id: existing.id, lease } : { kind: "retry" };
}

/* -------------------------------------------------------------------------- */
/* Capture de la réponse                                                      */
/* -------------------------------------------------------------------------- */

interface Captured {
    encoding: Encoding;
    json?: unknown;
    text?: string;
    bytes: number;
}

function instrument(
    res: Response,
    claimId: string,
    lease: string,
    opts: Required<Pick<IdempotencyOptions, "maxBodyBytes" | "recordTtlMs" | "releaseOnStatus">>,
): void {
    const originalSend = res.send.bind(res);
    let captured: Captured | null = null;

    // `res.json()` délègue à `this.send()` : instrumenter `send` suffit à couvrir
    // JSON, texte brut, HTML, Buffer, et tout ce qui passe par la voie normale.
    res.send = ((body?: unknown) => {
        try {
            if (Buffer.isBuffer(body)) {
                captured = { encoding: "base64", text: body.toString("base64"), bytes: body.length };
            } else if (typeof body === "string") {
                captured = { encoding: "text", text: body, bytes: Buffer.byteLength(body) };
            } else if (body === null || body === undefined) {
                captured = { encoding: "none", bytes: 0 };
            } else {
                const serialized = JSON.stringify(body) ?? "null";
                captured = { encoding: "json", json: body, bytes: Buffer.byteLength(serialized) };
            }
        } catch {
            captured = { encoding: "none", bytes: 0 };
        }
        return originalSend(body as never);
    }) as Response["send"];

    res.on("finish", () => {
        void (async () => {
            try {
                if (opts.releaseOnStatus(res.statusCode)) {
                    // Échec : on libère la clé (fencing sur le lease) pour un retry propre.
                    await prisma.idempotencyRecord.deleteMany({ where: { id: claimId, lease } });
                    return;
                }

                const usable = captured && captured.bytes <= opts.maxBodyBytes ? captured : null;

                await prisma.idempotencyRecord.updateMany({
                    // `lease` dans le WHERE = fencing token : si un autre worker a
                    // repris le claim entre-temps, on n'écrase pas sa réponse.
                    where: { id: claimId, lease, status: STATUS_PENDING },
                    data: {
                        status: STATUS_DONE,
                        responseStatus: res.statusCode,
                        responseContentType: contentTypeOf(res),
                        responseEncoding: usable?.encoding ?? "none",
                        responseBody: usable?.encoding === "json" ? (usable.json as object) : undefined,
                        responseText:
                            usable?.encoding === "text" || usable?.encoding === "base64" ? usable.text ?? null : null,
                        expiresAt: new Date(Date.now() + opts.recordTtlMs),
                    },
                });
            } catch {
                // Best-effort : la réponse est déjà partie, une erreur de cache ne
                // doit jamais remonter au client. Le lease expirera de lui-même.
            }
        })();
    });
}

/* -------------------------------------------------------------------------- */
/* Middleware                                                                 */
/* -------------------------------------------------------------------------- */

export function idempotency(options: IdempotencyOptions = {}): RequestHandler {
    const pendingTtlMs = options.pendingTtlMs ?? DEFAULT_PENDING_TTL_MS;
    const recordTtlMs = options.recordTtlMs ?? DEFAULT_RECORD_TTL_MS;
    const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
    const validateKey = options.validateKey ?? true;
    const keyPattern = options.keyPattern ?? UUID_V4_V7;
    const tenantResolver = options.tenantResolver ?? defaultTenantResolver;
    const routeResolver = options.routeResolver ?? defaultRouteResolver;
    const releaseOnStatus = options.releaseOnStatus ?? defaultReleaseOnStatus;

    return function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
        const header = req.headers["idempotency-key"];
        const raw = Array.isArray(header) ? header[0] : header;
        const key = raw?.trim();

        // Opt-in strict : pas de header, pas de méthode mutante → passe-plat.
        if (!key || !isMutating(req.method)) {
            next();
            return;
        }

        if (validateKey && !keyPattern.test(key)) {
            res.status(400).json({
                success: false,
                code: "INVALID_IDEMPOTENCY_KEY",
                message: "Le header Idempotency-Key doit être un UUID v4 ou v7.",
            });
            return;
        }

        const ctx: AcquireContext = {
            route: routeResolver(req),
            organizationId: tenantResolver(req),
            key,
            requestHash: hashRequest(req),
            pendingTtlMs,
            recordTtlMs,
        };

        void (async () => {
            try {
                for (let attempt = 0; attempt < MAX_ACQUIRE_ATTEMPTS; attempt++) {
                    const outcome = await acquire(ctx);

                    switch (outcome.kind) {
                        case "claimed":
                            instrument(res, outcome.id, outcome.lease, {
                                maxBodyBytes,
                                recordTtlMs,
                                releaseOnStatus,
                            });
                            next();
                            return;

                        case "replay":
                            replay(res, outcome.row);
                            return;

                        case "mismatch":
                            res.status(422).json({
                                success: false,
                                code: "IDEMPOTENCY_KEY_REUSED",
                                message:
                                    "Cette Idempotency-Key a déjà été utilisée avec un contenu de requête différent.",
                            });
                            return;

                        case "conflict":
                            res.setHeader("Retry-After", String(outcome.retryAfterSec));
                            res.status(409).json({
                                success: false,
                                code: "IDEMPOTENCY_IN_PROGRESS",
                                message:
                                    "Une requête avec cette Idempotency-Key est déjà en cours de traitement — réessayez dans un instant.",
                            });
                            return;

                        case "retry":
                            continue;
                    }
                }

                // Trois tentatives perdues d'affilée : contention anormale.
                res.setHeader("Retry-After", "1");
                res.status(409).json({
                    success: false,
                    code: "IDEMPOTENCY_CONTENTION",
                    message: "Trop de requêtes concurrentes sur cette Idempotency-Key — réessayez dans un instant.",
                });
            } catch (err) {
                next(err);
            }
        })();
    };
}

/* -------------------------------------------------------------------------- */
/* Purge (à câbler sur un cron nocturne)                                      */
/* -------------------------------------------------------------------------- */

/**
 * Supprime les enregistrements expirés. À appeler depuis un cron :
 *
 *   cron.schedule("0 3 * * *", () => void purgeExpiredIdempotencyRecords());
 *
 * Traite par lots pour ne pas verrouiller la table trop longtemps.
 */
export async function purgeExpiredIdempotencyRecords(batchSize = 5_000): Promise<number> {
    let total = 0;
    for (;;) {
        const expired = (await prisma.idempotencyRecord.findMany({
            where: { expiresAt: { lt: new Date() } },
            select: { id: true },
            take: batchSize,
        })) as Array<{ id: string }>;

        if (expired.length === 0) break;

        const { count } = await prisma.idempotencyRecord.deleteMany({
            where: { id: { in: expired.map((r) => r.id) } },
        });
        total += count;

        if (expired.length < batchSize) break;
    }
    return total;
}
