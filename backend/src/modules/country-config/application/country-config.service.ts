import { AppError } from "../../../core/errors/app.error";
import { CountryConfigRepository } from "../infrastructure/country-config.repository";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const repo = new CountryConfigRepository();

const schema = z.object({
    code:         z.string().min(2).max(4),
    name:         z.string().min(1).max(100),
    currencyCode: z.string().min(2).max(4).optional(),
    locale:       z.string().optional(),
    taxRate:      z.number().min(0).max(1).optional(),
    phonePrefix:  z.string().optional(),
    isActive:     z.boolean().optional(),
    metadata:     z.record(z.string(), z.unknown()).optional(),
});

export async function list() {
    return repo.list();
}

export async function findByCode(code: string) {
    const cc = await repo.findByCode(code);
    if (!cc) throw new AppError("Pays introuvable", 404);
    return cc;
}

export async function upsert(body: unknown) {
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new AppError(parsed.error.flatten().fieldErrors as never, 422);
    const d = parsed.data;
    return repo.upsert({
        ...d,
        taxRate:  d.taxRate !== undefined ? new Prisma.Decimal(d.taxRate) : undefined,
        metadata: d.metadata as Prisma.InputJsonValue | undefined,
    });
}

export async function remove(code: string) {
    await findByCode(code);
    return repo.delete(code);
}
