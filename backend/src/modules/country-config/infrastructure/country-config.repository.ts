import { prisma } from "../../../core/config/prisma";
import { Prisma } from "@prisma/client";

export class CountryConfigRepository {
    async list() {
        return prisma.countryConfig.findMany({ orderBy: { code: "asc" } });
    }

    async findByCode(code: string) {
        return prisma.countryConfig.findUnique({ where: { code: code.toUpperCase() } });
    }

    async upsert(data: {
        code:         string;
        name:         string;
        currencyCode?: string;
        locale?:      string;
        taxRate?:     Prisma.Decimal;
        phonePrefix?: string;
        isActive?:    boolean;
        metadata?:    Prisma.InputJsonValue;
    }) {
        const code = data.code.toUpperCase();
        return prisma.countryConfig.upsert({
            where:  { code },
            update: { ...data, code },
            create: { ...data, code },
        });
    }

    async delete(code: string) {
        return prisma.countryConfig.delete({ where: { code: code.toUpperCase() } });
    }
}
