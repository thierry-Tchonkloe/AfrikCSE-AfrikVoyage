// import { PrismaClient } from "@prisma/client";

// const globalForPrisma = global as unknown as { prisma: PrismaClient };

// export const prisma =
//     globalForPrisma.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== "production") {
//     globalForPrisma.prisma = prisma;
// }


// import { PrismaClient } from "@prisma/client";

// /**
//  * Singleton PrismaClient
//  * En Prisma v7, pas besoin de passer l'adaptateur manuellement
//  * si la connexion est configurée dans prisma.config.ts
//  */
// declare global {
//     var __prisma: PrismaClient | undefined; // eslint-disable-next-line no-var
// }

// function createPrismaClient(): PrismaClient {
//     return new PrismaClient({
//         log:
//         process.env.NODE_ENV === "development"
//             ? ["query", "warn", "error"]
//             : ["warn", "error"],
//     });
// }

// export const prisma = global.__prisma ?? createPrismaClient();

// if (process.env.NODE_ENV !== "production") {
//     global.__prisma = prisma;
// }





import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error("DATABASE_URL est manquant dans le fichier .env");
    }

    // Prisma v7 : l'adaptateur est obligatoire pour engine type "client"
    const adapter = new PrismaPg({ connectionString });

    return new PrismaClient({
        adapter,
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