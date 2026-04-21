// import { PrismaClient } from "@prisma/client";

// const globalForPrisma = global as unknown as { prisma: PrismaClient };

// export const prisma =
//     globalForPrisma.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== "production") {
//     globalForPrisma.prisma = prisma;
// }


import { PrismaClient } from "@prisma/client";

/**
 * Singleton PrismaClient
 * En Prisma v7, pas besoin de passer l'adaptateur manuellement
 * si la connexion est configurée dans prisma.config.ts
 */
declare global {
    var __prisma: PrismaClient | undefined; // eslint-disable-next-line no-var
}

function createPrismaClient(): PrismaClient {
    return new PrismaClient({
        log:
        process.env.NODE_ENV === "development"
            ? ["query", "warn", "error"]
            : ["warn", "error"],
    });
}

export const prisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    global.__prisma = prisma;
}