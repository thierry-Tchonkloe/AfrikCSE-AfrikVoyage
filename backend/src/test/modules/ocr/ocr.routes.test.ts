// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/ocr (src/modules/ocr).
// Pas de service ni de repository : le contrôleur appelle `prisma`
// DIRECTEMENT (comme organization.getMyDashboard/uploadLogo). Aucun try/catch
// nulle part → toute erreur (y compris l'`AppError` explicitement levée dans
// getById) remonte au middleware d'erreurs global.
// Une seule config RBAC (authenticate seul) → pas de 403.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { organizationId: "org-1", ...overrides });
}

describe("POST /api/ocr/upload", () => {
  it("201 — enregistre un scan OCR (extraction simulée, stub sans provider configuré)", async () => {
    const cookie = withSession();
    prismaMock.ocrScan.create.mockResolvedValueOnce({ id: "scan-1", status: "PROCESSING" } as never);
    prismaMock.ocrScan.update.mockResolvedValueOnce({ id: "scan-1", status: "DONE" } as never);

    const res = await request(app)
      .post("/api/ocr/upload")
      .set("Cookie", cookie)
      .send({ fileUrl: "https://cdn.example.com/recu.pdf" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "scan-1", status: "DONE" });
  });

  it("400 — rejette un corps invalide (URL de fichier manquante)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/ocr/upload").set("Cookie", cookie).send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.fileUrl).toBeDefined();
    expect(prismaMock.ocrScan.create).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).post("/api/ocr/upload").send({ fileUrl: "https://cdn.example.com/recu.pdf" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("404 — rejette un rapport de frais qui n'appartient pas à l'employé (vérification directe)", async () => {
    const cookie = withSession();
    prismaMock.expenseReport.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/ocr/upload")
      .set("Cookie", cookie)
      .send({ fileUrl: "https://cdn.example.com/recu.pdf", expenseReportId: "report-dun-autre-employe" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Rapport de frais introuvable" });
    expect(prismaMock.ocrScan.create).not.toHaveBeenCalled();
  });

  it("500 — une erreur prisma non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    prismaMock.ocrScan.create.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app)
      .post("/api/ocr/upload")
      .set("Cookie", cookie)
      .send({ fileUrl: "https://cdn.example.com/recu.pdf" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/ocr", () => {
  it("200 — retourne mes scans OCR", async () => {
    const cookie = withSession();
    prismaMock.ocrScan.findMany.mockResolvedValueOnce([{ id: "scan-1", status: "DONE" }] as never);

    const res = await request(app).get("/api/ocr").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "scan-1", status: "DONE" }]);
  });
});

describe("GET /api/ocr/:id", () => {
  it("200 — retourne le détail d'un scan OCR", async () => {
    const cookie = withSession();
    prismaMock.ocrScan.findFirst.mockResolvedValueOnce({ id: "scan-1", status: "DONE" } as never);

    const res = await request(app).get("/api/ocr/scan-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "scan-1", status: "DONE" });
  });

  it("404 — scan introuvable (AppError levée directement, sans try/catch local → errorMiddleware)", async () => {
    const cookie = withSession();
    prismaMock.ocrScan.findFirst.mockResolvedValueOnce(null);

    const res = await request(app).get("/api/ocr/scan-inconnu").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Scan introuvable" });
  });
});
