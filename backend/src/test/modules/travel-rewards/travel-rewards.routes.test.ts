// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/travel-rewards (src/modules/travel-rewards).
// Module minimal : 2 routes en lecture seule, authenticate seul (pas de RBAC),
// aucun try/catch dans le contrôleur (une erreur remonte donc toujours au
// middleware d'erreurs global).
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/travel-rewards/application/travel-reward.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { TravelRewardService } from "../../../modules/travel-rewards/application/travel-reward.service";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const getMyRewardsMock = TravelRewardService.prototype.getMyRewards as jest.Mock;
const getBalanceMock = TravelRewardService.prototype.getBalance as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, overrides);
}

describe("GET /api/travel-rewards", () => {
  it("200 — retourne mes récompenses voyage", async () => {
    const cookie = withSession();
    getMyRewardsMock.mockResolvedValueOnce([{ id: "reward-1", points: 100 }]);

    const res = await request(app).get("/api/travel-rewards").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "reward-1", points: 100 }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/travel-rewards");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getMyRewardsMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/travel-rewards").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/travel-rewards/balance", () => {
  it("200 — retourne mon solde de points", async () => {
    const cookie = withSession();
    getBalanceMock.mockResolvedValueOnce(1500);

    const res = await request(app).get("/api/travel-rewards/balance").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ points: 1500 });
  });
});
