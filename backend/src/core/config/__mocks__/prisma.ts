// Mock manuel du singleton Prisma (voir ../prisma.ts).
// Activé dans un fichier de test via `jest.mock("<chemin>/core/config/prisma")` (sans factory) :
// Jest charge alors automatiquement ce fichier à la place du vrai module, évitant
// toute connexion PostgreSQL réelle pendant les tests d'intégration Supertest.
import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

export const prisma: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

export function resetPrismaMock(): void {
  mockReset(prisma);
}
