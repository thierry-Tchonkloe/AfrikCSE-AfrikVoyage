// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/employee (src/modules/employee) —
// l'espace personnel employé (dashboard, voyages, notes de frais, avantages,
// profil, documents). Distinct de /api/employees (vue RH globale).
//
// Contrairement aux modules précédents, ce contrôleur n'a PAS de couche
// « service » : il appelle `EmployeeDashboardRepository` directement (mockée
// ici comme un service classique), plus `NotificationRepository` (best-effort,
// résultat ignoré par le contrôleur) et `SavingsRepository` (instanciée à la
// volée dans getMySavings — l'automock fonctionne pareil, prototype partagé).
// `getProfile`/`getMemberCard` appellent `prisma` directement.
// Deux routes uploadent un fichier via Cloudinary (`expenses/upload`, `avatar`)
// — même stratégie de mock que organization.routes.test.ts (upload_stream).
//
// Une seule config RBAC pour tout le routeur (authenticate seul, pas de
// authorize) → le 401 n'est testé qu'une fois, sur GET /dashboard ; pas de
// test 403 pour ce module.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/employee/infrastructure/employee-dashboard.repository");
jest.mock("../../../modules/notification/infrastructure/notification.repository");
jest.mock("../../../modules/savings/infrastructure/savings.repository");
jest.mock("../../../core/config/cloudinary", () => ({
  cloudinary: { uploader: { upload_stream: jest.fn() } },
}));

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { EmployeeDashboardRepository } from "../../../modules/employee/infrastructure/employee-dashboard.repository";
import { SavingsRepository } from "../../../modules/savings/infrastructure/savings.repository";
import { cloudinary } from "../../../core/config/cloudinary";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;
const uploadStreamMock = cloudinary.uploader.upload_stream as jest.Mock;

const getDashboardDataMock = EmployeeDashboardRepository.prototype.getDashboardData as jest.Mock;
const getMyTravelsMock = EmployeeDashboardRepository.prototype.getMyTravels as jest.Mock;
const createTravelRequestMock = EmployeeDashboardRepository.prototype.createTravelRequest as jest.Mock;
const getMyExpensesMock = EmployeeDashboardRepository.prototype.getMyExpenses as jest.Mock;
const createExpenseMock = EmployeeDashboardRepository.prototype.createExpense as jest.Mock;
const getBenefitCategoriesMock = EmployeeDashboardRepository.prototype.getBenefitCategoriesForEmployee as jest.Mock;
const getBenefitBalanceMock = EmployeeDashboardRepository.prototype.getBenefitBalance as jest.Mock;
const getMyBenefitRequestsMock = EmployeeDashboardRepository.prototype.getMyBenefitRequests as jest.Mock;
const createBenefitRequestMock = EmployeeDashboardRepository.prototype.createBenefitRequest as jest.Mock;
const cancelBenefitRequestMock = EmployeeDashboardRepository.prototype.cancelBenefitRequest as jest.Mock;
const updateProfileMock = EmployeeDashboardRepository.prototype.updateProfile as jest.Mock;
const getActivityLogMock = EmployeeDashboardRepository.prototype.getActivityLog as jest.Mock;
const getDocumentsMock = EmployeeDashboardRepository.prototype.getDocuments as jest.Mock;
const addDocumentMock = EmployeeDashboardRepository.prototype.addDocument as jest.Mock;
const deleteDocumentMock = EmployeeDashboardRepository.prototype.deleteDocument as jest.Mock;
const getMySavingsMock = SavingsRepository.prototype.getMySavings as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
  uploadStreamMock.mockReset();
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "EMPLOYE", organizationId: "org-1", ...overrides });
}

// ── GET /dashboard — représentative du RBAC du module (authenticate seul) ───
describe("GET /api/employee/dashboard", () => {
  it("200 — retourne le dashboard personnel de l'employé", async () => {
    const cookie = withSession();
    getDashboardDataMock.mockResolvedValueOnce({ upcomingTravels: 1, pendingExpenses: 0 });

    const res = await request(app).get("/api/employee/dashboard").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ upcomingTravels: 1, pendingExpenses: 0 });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/employee/dashboard");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — catch manuel : erreur renvoyée en {message}, pas errorMiddleware", async () => {
    const cookie = withSession();
    getDashboardDataMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/employee/dashboard").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Panne base de données" });
  });
});

// ── GET /travels ──────────────────────────────────────────────────────────
describe("GET /api/employee/travels", () => {
  it("200 — retourne mes demandes de voyage", async () => {
    const cookie = withSession();
    getMyTravelsMock.mockResolvedValueOnce([{ id: "travel-1", destination: "Cotonou" }]);

    const res = await request(app).get("/api/employee/travels").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "travel-1", destination: "Cotonou" }]);
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getMyTravelsMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/employee/travels").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── POST /travels ─────────────────────────────────────────────────────────
describe("POST /api/employee/travels", () => {
  const validBody = {
    destination: "Cotonou",
    departureDate: "2026-08-01T00:00:00.000Z",
    returnDate: "2026-08-05T00:00:00.000Z",
  };

  it("201 — crée une demande de voyage", async () => {
    const cookie = withSession();
    createTravelRequestMock.mockResolvedValueOnce({ id: "travel-1", ...validBody });

    const res = await request(app).post("/api/employee/travels").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.destination).toBe("Cotonou");
  });

  it("400 — rejette une date de retour antérieure à la date de départ (validation Zod .refine)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .post("/api/employee/travels")
      .set("Cookie", cookie)
      .send({ ...validBody, departureDate: "2026-08-05T00:00:00.000Z", returnDate: "2026-08-01T00:00:00.000Z" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.returnDate).toBeDefined();
    expect(createTravelRequestMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier du repository", async () => {
    const cookie = withSession();
    createTravelRequestMock.mockRejectedValueOnce(new Error("Chevauchement avec une autre demande"));

    const res = await request(app).post("/api/employee/travels").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Chevauchement avec une autre demande" });
  });
});

// ── GET /expenses ─────────────────────────────────────────────────────────
describe("GET /api/employee/expenses", () => {
  it("200 — retourne mes notes de frais", async () => {
    const cookie = withSession();
    getMyExpensesMock.mockResolvedValueOnce([{ id: "exp-1", title: "Taxi" }]);

    const res = await request(app).get("/api/employee/expenses").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "exp-1", title: "Taxi" }]);
  });
});

// ── POST /expenses ────────────────────────────────────────────────────────
describe("POST /api/employee/expenses", () => {
  const validBody = { title: "Taxi aéroport", amount: 5000 };

  it("201 — crée une note de frais", async () => {
    const cookie = withSession();
    createExpenseMock.mockResolvedValueOnce({ id: "exp-1", ...validBody });

    const res = await request(app).post("/api/employee/expenses").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "exp-1", ...validBody });
  });

  it("400 — rejette un montant négatif (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .post("/api/employee/expenses")
      .set("Cookie", cookie)
      .send({ title: "Taxi", amount: -100 });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.amount).toBeDefined();
    expect(createExpenseMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier du repository", async () => {
    const cookie = withSession();
    createExpenseMock.mockRejectedValueOnce(new Error("Note de frais dupliquée"));

    const res = await request(app).post("/api/employee/expenses").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Note de frais dupliquée" });
  });
});

// ── POST /expenses/upload ─────────────────────────────────────────────────
describe("POST /api/employee/expenses/upload", () => {
  it("201 — upload un justificatif de dépense", async () => {
    const cookie = withSession();
    uploadStreamMock.mockImplementation((_opts: unknown, cb: (err: unknown, r?: { secure_url: string }) => void) => ({
      end: () => cb(null, { secure_url: "https://cdn.example.com/receipts/exp-1.pdf" }),
    }));

    const res = await request(app)
      .post("/api/employee/expenses/upload")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("fake-pdf-bytes"), "recu.pdf");

    expect(res.status).toBe(201);
    expect(res.body.url).toBe("https://cdn.example.com/receipts/exp-1.pdf");
    expect(res.body.name).toBe("recu.pdf");
  });

  it("400 — rejette une requête sans fichier attaché", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/employee/expenses/upload").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Aucun fichier fourni" });
    expect(uploadStreamMock).not.toHaveBeenCalled();
  });

  it("500 — propage un échec d'upload Cloudinary", async () => {
    const cookie = withSession();
    uploadStreamMock.mockImplementation((_opts: unknown, cb: (err: unknown) => void) => ({
      end: () => cb(new Error("Cloudinary indisponible")),
    }));

    const res = await request(app)
      .post("/api/employee/expenses/upload")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("fake-pdf-bytes"), "recu.pdf");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Cloudinary indisponible" });
  });
});

// ── GET /benefits/categories ──────────────────────────────────────────────
describe("GET /api/employee/benefits/categories", () => {
  it("200 — retourne les catégories CSE disponibles avec soldes", async () => {
    const cookie = withSession();
    getBenefitCategoriesMock.mockResolvedValueOnce([{ id: "cat-1", name: "Sport", balance: 30000 }]);

    const res = await request(app).get("/api/employee/benefits/categories").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "cat-1", name: "Sport", balance: 30000 }]);
  });

  it("500 — catch manuel : erreur renvoyée en {message}", async () => {
    const cookie = withSession();
    getBenefitCategoriesMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/employee/benefits/categories").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Panne base de données" });
  });
});

// ── GET /benefits/balance ─────────────────────────────────────────────────
describe("GET /api/employee/benefits/balance", () => {
  it("200 — retourne le solde global des avantages", async () => {
    const cookie = withSession();
    getBenefitBalanceMock.mockResolvedValueOnce({ total: 100000, used: 40000, remaining: 60000 });

    const res = await request(app).get("/api/employee/benefits/balance").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ total: 100000, used: 40000, remaining: 60000 });
  });
});

// ── GET /benefits/requests ────────────────────────────────────────────────
describe("GET /api/employee/benefits/requests", () => {
  it("200 — retourne mes demandes d'avantages", async () => {
    const cookie = withSession();
    getMyBenefitRequestsMock.mockResolvedValueOnce([{ id: "req-1", status: "PENDING" }]);

    const res = await request(app).get("/api/employee/benefits/requests").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "req-1", status: "PENDING" }]);
  });
});

// ── POST /benefits/requests ───────────────────────────────────────────────
describe("POST /api/employee/benefits/requests", () => {
  const validBody = { categoryId: "cat-1", amount: 20000 };

  it("201 — soumet une demande d'avantage", async () => {
    const cookie = withSession();
    createBenefitRequestMock.mockResolvedValueOnce({ id: "req-1", category: { name: "Sport" }, ...validBody });

    const res = await request(app).post("/api/employee/benefits/requests").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.id).toBe("req-1");
  });

  it("400 — rejette un corps invalide (catégorie manquante)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/employee/benefits/requests").set("Cookie", cookie).send({ amount: 1000 });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.categoryId).toBeDefined();
    expect(createBenefitRequestMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier (plafond dépassé)", async () => {
    const cookie = withSession();
    createBenefitRequestMock.mockRejectedValueOnce(new Error("Plafond annuel dépassé pour cette catégorie"));

    const res = await request(app).post("/api/employee/benefits/requests").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Plafond annuel dépassé pour cette catégorie" });
  });
});

// ── PATCH /benefits/requests/:id/cancel ───────────────────────────────────
describe("PATCH /api/employee/benefits/requests/:id/cancel", () => {
  it("200 — annule une demande d'avantage en attente", async () => {
    const cookie = withSession();
    cancelBenefitRequestMock.mockResolvedValueOnce(undefined);

    const res = await request(app).patch("/api/employee/benefits/requests/req-1/cancel").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("400 — propage une erreur métier (demande déjà traitée)", async () => {
    const cookie = withSession();
    cancelBenefitRequestMock.mockRejectedValueOnce(new Error("Seule une demande en attente peut être annulée"));

    const res = await request(app).patch("/api/employee/benefits/requests/req-1/cancel").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Seule une demande en attente peut être annulée" });
  });
});

// ── GET /member-card ───────────────────────────────────────────────────────
describe("GET /api/employee/member-card", () => {
  it("200 — retourne la carte de membre numérique de l'employé", async () => {
    const cookie = withSession();
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "user-1", email: "awa@acme.com", firstName: "Awa", lastName: "Traoré",
      createdAt: new Date("2025-01-10"), avatar: null,
      organization: { id: "org-1", name: "Acme", logoUrl: null },
      employee: { matricule: "MAT-001" },
    } as never);

    const res = await request(app).get("/api/employee/member-card").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.memberId).toBe("MAT-001");
    expect(typeof res.body.qrData).toBe("string");
  });

  it("404 — l'utilisateur n'existe plus", async () => {
    const cookie = withSession();
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).get("/api/employee/member-card").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Utilisateur introuvable" });
  });

  it("500 — propage une erreur prisma inattendue", async () => {
    const cookie = withSession();
    prismaMock.user.findUnique.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/employee/member-card").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Panne base de données" });
  });
});

// ── GET /savings ───────────────────────────────────────────────────────────
describe("GET /api/employee/savings", () => {
  it("200 — retourne le dashboard des économies de l'employé", async () => {
    const cookie = withSession();
    getMySavingsMock.mockResolvedValueOnce({ totalSaved: 15000 });

    const res = await request(app).get("/api/employee/savings").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ totalSaved: 15000 });
  });

  it("500 — catch manuel : erreur renvoyée en {message}", async () => {
    const cookie = withSession();
    getMySavingsMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/employee/savings").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Panne base de données" });
  });
});

// ── GET /profile ───────────────────────────────────────────────────────────
describe("GET /api/employee/profile", () => {
  it("200 — retourne le profil complet de l'employé (organisation, manager, documents)", async () => {
    const cookie = withSession();
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "user-1", email: "awa@acme.com" } as never);

    const res = await request(app).get("/api/employee/profile").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "user-1", email: "awa@acme.com" });
  });
});

// ── PATCH /profile ─────────────────────────────────────────────────────────
describe("PATCH /api/employee/profile", () => {
  it("200 — met à jour le profil de l'employé", async () => {
    const cookie = withSession();
    updateProfileMock.mockResolvedValueOnce({ id: "user-1", firstName: "Awa" });

    const res = await request(app).patch("/api/employee/profile").set("Cookie", cookie).send({ firstName: "Awa" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "user-1", firstName: "Awa" });
  });

  it("400 — rejette un format de date invalide (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .patch("/api/employee/profile")
      .set("Cookie", cookie)
      .send({ dateFormat: "JJ/MM/AAAA" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.dateFormat).toBeDefined();
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier du repository", async () => {
    const cookie = withSession();
    updateProfileMock.mockRejectedValueOnce(new Error("Échec de la mise à jour"));

    const res = await request(app).patch("/api/employee/profile").set("Cookie", cookie).send({ firstName: "Awa" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Échec de la mise à jour" });
  });
});

// ── POST /avatar ────────────────────────────────────────────────────────────
describe("POST /api/employee/avatar", () => {
  it("200 — upload une nouvelle photo de profil", async () => {
    const cookie = withSession();
    uploadStreamMock.mockImplementation((_opts: unknown, cb: (err: unknown, r?: { secure_url: string }) => void) => ({
      end: () => cb(null, { secure_url: "https://cdn.example.com/avatars/user-1.png" }),
    }));
    updateProfileMock.mockResolvedValueOnce({ avatar: "https://cdn.example.com/avatars/user-1.png" });

    const res = await request(app)
      .post("/api/employee/avatar")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("fake-png-bytes"), "avatar.png");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ avatar: "https://cdn.example.com/avatars/user-1.png" });
  });

  it("400 — rejette une requête sans fichier attaché", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/employee/avatar").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Aucun fichier fourni" });
    expect(uploadStreamMock).not.toHaveBeenCalled();
  });

  it("500 — propage un échec d'upload Cloudinary", async () => {
    const cookie = withSession();
    uploadStreamMock.mockImplementation((_opts: unknown, cb: (err: unknown) => void) => ({
      end: () => cb(new Error("Cloudinary indisponible")),
    }));

    const res = await request(app)
      .post("/api/employee/avatar")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("fake-png-bytes"), "avatar.png");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Cloudinary indisponible" });
  });
});

// ── GET /activity-log ──────────────────────────────────────────────────────
describe("GET /api/employee/activity-log", () => {
  it("200 — retourne mon journal d'activité paginé", async () => {
    const cookie = withSession();
    getActivityLogMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 10 });

    const res = await request(app).get("/api/employee/activity-log").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [], total: 0, page: 1, limit: 10 });
  });
});

// ── GET /documents ─────────────────────────────────────────────────────────
describe("GET /api/employee/documents", () => {
  it("200 — retourne mes documents", async () => {
    const cookie = withSession();
    getDocumentsMock.mockResolvedValueOnce([{ id: "doc-1", name: "CNI" }]);

    const res = await request(app).get("/api/employee/documents").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "doc-1", name: "CNI" }]);
  });
});

// ── POST /documents ─────────────────────────────────────────────────────────
describe("POST /api/employee/documents", () => {
  const validBody = { name: "Carte d'identité", url: "https://cdn.example.com/doc.pdf", type: "IDENTITY" };

  it("201 — ajoute un document", async () => {
    const cookie = withSession();
    addDocumentMock.mockResolvedValueOnce({ id: "doc-1", ...validBody });

    const res = await request(app).post("/api/employee/documents").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "doc-1", ...validBody });
  });

  it("400 — rejette un corps invalide (URL manquante)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .post("/api/employee/documents")
      .set("Cookie", cookie)
      .send({ name: "CNI", type: "IDENTITY" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.url).toBeDefined();
    expect(addDocumentMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier du repository", async () => {
    const cookie = withSession();
    addDocumentMock.mockRejectedValueOnce(new Error("Échec de l'enregistrement du document"));

    const res = await request(app).post("/api/employee/documents").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Échec de l'enregistrement du document" });
  });
});

// ── DELETE /documents/:id ────────────────────────────────────────────────────
describe("DELETE /api/employee/documents/:id", () => {
  it("200 — supprime un document", async () => {
    const cookie = withSession();
    deleteDocumentMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/employee/documents/doc-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("400 — propage une erreur métier (document introuvable)", async () => {
    const cookie = withSession();
    deleteDocumentMock.mockRejectedValueOnce(new Error("Document introuvable"));

    const res = await request(app).delete("/api/employee/documents/doc-inconnu").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Document introuvable" });
  });
});
