import { z } from "zod";

export const createOrderSchema = z.object({
    offerId:               z.string().uuid().optional(),
    partnerId:             z.string().uuid().optional(),
    amount:                z.number().positive(),
    discountAmount:        z.number().min(0).optional(),
    subsidyAmount:         z.number().min(0).optional(),
    currencyCode:          z.string().default("XOF"),
    paymentMethod:         z.enum(["WALLET", "MOBILE_MONEY", "CARD"]),
    idempotencyKey:        z.string().min(8, "idempotencyKey requis (min 8 chars)"),
    // KkiaPay : le widget frontend retourne ce transactionId après paiement
    kkiapayTransactionId:  z.string().optional(),
});
