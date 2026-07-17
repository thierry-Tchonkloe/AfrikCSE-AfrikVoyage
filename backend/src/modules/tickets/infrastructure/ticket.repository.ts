import { createHmac, randomBytes, createHash } from "crypto";
import { prisma } from "../../../core/config/prisma";
import { AppError } from "../../../core/errors/app.error";

const TICKET_SECRET = process.env.TICKET_SECRET ?? "";

interface GenerateInput {
    offerId:        string;
    userId:         string;
    organizationId: string;
    familyMemberId?: string;
    expiresAt?:     Date;
}

interface QrPayload {
    v:             number;
    code:          string;
    offerId:       string;
    userId:        string;
    familyMemberId?: string;
    expiresAt:     string;
    sig:           string;
}

function buildSig(code: string, offerId: string, userId: string, expiresAt: string): string {
    const message = `${code}|${offerId}|${userId}|${expiresAt}`;
    return createHmac("sha256", TICKET_SECRET).update(message).digest("hex");
}

function buildIdempotencyKey(offerId: string, userId: string, familyMemberId?: string): string {
    const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const raw = `${offerId}:${userId}:${familyMemberId ?? "none"}:${day}`;
    return createHash("sha256").update(raw).digest("hex");
}

export class TicketRepository {
    async generate(input: GenerateInput) {
        const idempotencyKey = buildIdempotencyKey(input.offerId, input.userId, input.familyMemberId);

        // Idempotence : retourne le ticket existant du jour si déjà émis
        const existing = await prisma.ticket.findUnique({ where: { idempotencyKey } });
        if (existing) return existing;

        // Vérification de l'offre dans la même transaction que la création
        return prisma.$transaction(async (tx) => {
            const offer = await tx.benefitCatalogItem.findUniqueOrThrow({
                where: { id: input.offerId },
            });

            if (!offer.isActive) throw new AppError("Cette offre n'est plus disponible", 422);
            if (offer.stock !== null && offer.stock <= 0) {
                throw new AppError("Stock épuisé pour cette offre", 422);
            }

            // Décrément stock atomique
            if (offer.stock !== null) {
                await tx.benefitCatalogItem.update({
                    where: { id: input.offerId },
                    data:  { stock: { decrement: 1 } },
                });
            }

            const code     = randomBytes(6).toString("hex").toUpperCase(); // ex. "A3F0B2C1"
            const expiresAt = input.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30j
            const sig       = buildSig(code, input.offerId, input.userId, expiresAt.toISOString());

            const qrPayload: QrPayload = {
                v:             1,
                code,
                offerId:       input.offerId,
                userId:        input.userId,
                familyMemberId: input.familyMemberId,
                expiresAt:     expiresAt.toISOString(),
                sig,
            };

            return tx.ticket.create({
                data: {
                    code,
                    organizationId:  input.organizationId,
                    offerId:         input.offerId,
                    userId:          input.userId,
                    familyMemberId:  input.familyMemberId,
                    qrPayload:       JSON.stringify(qrPayload),
                    status:          "VALID",
                    expiresAt,
                    idempotencyKey,
                },
                include: {
                    offer:        { select: { id: true, title: true, imageUrl: true, offerType: true } },
                    familyMember: { select: { id: true, firstName: true, lastName: true, relationship: true } },
                },
            });
        });
    }

    async getMyTickets(userId: string) {
        return prisma.ticket.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                offer:        { select: { id: true, title: true, imageUrl: true, offerType: true, partner: { select: { name: true, logoUrl: true } } } },
                familyMember: { select: { id: true, firstName: true, lastName: true, relationship: true } },
            },
        });
    }

    /**
     * userId non fourni → recherche non cantonnée (réservée au flux interne de
     * scan/validation HMAC, POST /validate). Quand userId est fourni (accès
     * authentifié GET /tickets/:code), le ticket doit appartenir à l'appelant —
     * anti-IDOR.
     */
    async getByCode(code: string, userId?: string) {
        return prisma.ticket.findFirst({
            where: { code, ...(userId ? { userId } : {}) },
            include: {
                offer:        { select: { id: true, title: true, partner: { select: { name: true } } } },
                user:         { select: { id: true, firstName: true, lastName: true, email: true } },
                familyMember: { select: { id: true, firstName: true, lastName: true, relationship: true } },
            },
        });
    }

    async markUsed(code: string) {
        const ticket = await prisma.ticket.findUnique({ where: { code } });
        if (!ticket)                       throw new AppError("Ticket introuvable", 404);
        if (ticket.status === "USED")      throw new AppError("Ticket déjà utilisé", 409);
        if (ticket.status === "CANCELLED") throw new AppError("Ticket annulé", 409);
        if (ticket.status === "EXPIRED")   throw new AppError("Ticket expiré", 410);
        if (ticket.expiresAt && ticket.expiresAt < new Date()) {
            throw new AppError("Ticket expiré", 410);
        }
        return prisma.ticket.update({
            where: { code },
            data:  { status: "USED", usedAt: new Date() },
        });
    }

    async cancel(id: string, userId: string) {
        const ticket = await prisma.ticket.findUnique({ where: { id } });
        if (!ticket || ticket.userId !== userId) throw new AppError("Ticket introuvable", 404);
        if (ticket.status !== "VALID") throw new AppError("Seul un ticket VALID peut être annulé", 409);
        return prisma.ticket.update({
            where: { id },
            data:  { status: "CANCELLED" },
        });
    }

    // Vérifie la signature HMAC sans utiliser la DB (appelé lors du scan)
    verifySignature(payload: QrPayload): boolean {
        const expected = buildSig(payload.code, payload.offerId, payload.userId, payload.expiresAt);
        return expected === payload.sig;
    }
}
