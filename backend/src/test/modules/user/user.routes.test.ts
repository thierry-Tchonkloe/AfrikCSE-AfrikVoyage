// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/users (src/modules/user).
//
// Même style d'erreur que `settings`/`auth` (voir settings.routes.test.ts) :
// catch manuel → `{ message }` (pas de `success:false`) avec code fixe par
// méthode (getById → 404, create/update/changeRole/deactivate/activate → 400).
// getAll/getHostUsers n'ont aucun try/catch → une erreur y remonte au
// middleware d'erreurs global (500 générique standard).
//
// Trois configurations RBAC distinctes dans ce routeur (401/403 testés une
// fois par groupe, sur une route représentative — voir organization.routes.test.ts
// pour la même logique appliquée plus largement) :
//   (a) SUPER_ADMIN, ADMIN, MANAGER, RH → GET /, GET /:id
//   (b) SUPER_ADMIN seul               → GET /host
//   (c) SUPER_ADMIN, ADMIN             → POST /, PATCH /:id, /:id/role,
//                                         /:id/deactivate, /:id/activate
//
// Point de vigilance IDOR : `UserService.getById` lève EXACTEMENT le même
// message ("Utilisateur introuvable") que la ressource soit inexistante OU
// qu'elle appartienne à une autre organisation — testé explicitement.
// GET /host est déclarée AVANT GET /:id dans user.routes.ts (contrairement au
// bug trouvé dans bookings.routes.ts) : le test ci-dessous vérifie
// concrètement qu'elle n'est pas shadowée.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/user/application/user.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { UserService } from "../../../modules/user/application/user.service";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const getAllMock = UserService.prototype.getAll as jest.Mock;
const getByIdMock = UserService.prototype.getById as jest.Mock;
const createMock = UserService.prototype.create as jest.Mock;
const updateMock = UserService.prototype.update as jest.Mock;
const changeRoleMock = UserService.prototype.changeRole as jest.Mock;
const deactivateMock = UserService.prototype.deactivate as jest.Mock;
const activateMock = UserService.prototype.activate as jest.Mock;
const getHostUsersMock = UserService.prototype.getHostUsers as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "ADMIN", ...overrides });
}

const validCreateBody = { email: "nouveau@acme.com", firstName: "Awa", lastName: "Traoré", role: "EMPLOYE" };

// ── GET / — représentative du groupe (a) SUPER_ADMIN/ADMIN/MANAGER/RH ───────
describe("GET /api/users", () => {
  it("200 — un ADMIN reçoit la liste paginée des utilisateurs de son organisation", async () => {
    const cookie = withSession();
    getAllMock.mockResolvedValueOnce({ data: [{ id: "user-2" }], total: 1, page: 1, limit: 10 });

    const res = await request(app).get("/api/users").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/users");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/users").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getAllMock).not.toHaveBeenCalled();
  });

  it("500 — une erreur non interceptée localement (ex: ADMIN sans organisation) remonte au middleware global", async () => {
    const cookie = withSession();
    getAllMock.mockRejectedValueOnce(new Error("Organisation introuvable"));

    const res = await request(app).get("/api/users").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /host — groupe (b) SUPER_ADMIN seul, déclarée avant /:id ────────────
describe("GET /api/users/host", () => {
  it("200 — un SUPER_ADMIN reçoit les membres de l'organisation hôte (et la route n'est pas shadowée par /:id)", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    getHostUsersMock.mockResolvedValueOnce([{ id: "host-user-1" }]);

    const res = await request(app).get("/api/users/host").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "host-user-1" }]);
    expect(getHostUsersMock).toHaveBeenCalledTimes(1);
    expect(getByIdMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/users/host");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un ADMIN (réservé au SUPER_ADMIN, contrairement à GET /)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).get("/api/users/host").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getHostUsersMock).not.toHaveBeenCalled();
  });
});

// ── GET /:id — même groupe (a) que GET /, 401/403 non répétés ───────────────
describe("GET /api/users/:id", () => {
  it("200 — retourne l'utilisateur demandé", async () => {
    const cookie = withSession();
    getByIdMock.mockResolvedValueOnce({ id: "user-2", email: "collegue@acme.com" });

    const res = await request(app).get("/api/users/user-2").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "user-2", email: "collegue@acme.com" });
  });

  it("404 — utilisateur introuvable OU appartenant à une autre organisation (anti-IDOR, même message)", async () => {
    const cookie = withSession();
    getByIdMock.mockRejectedValueOnce(new Error("Utilisateur introuvable"));

    const res = await request(app).get("/api/users/user-dune-autre-org").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Utilisateur introuvable" });
  });
});

// ── POST / — représentative du groupe (c) SUPER_ADMIN/ADMIN ─────────────────
describe("POST /api/users", () => {
  it("201 — crée un utilisateur dans l'organisation de l'ADMIN", async () => {
    const cookie = withSession();
    createMock.mockResolvedValueOnce({ id: "user-3", ...validCreateBody });

    const res = await request(app).post("/api/users").set("Cookie", cookie).send(validCreateBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "user-3", ...validCreateBody });
  });

  it("400 — rejette un corps invalide (rôle non autorisé au schéma)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .post("/api/users")
      .set("Cookie", cookie)
      .send({ ...validCreateBody, role: "SUPER_ADMIN" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.role).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).post("/api/users").send(validCreateBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (MANAGER)", async () => {
    const cookie = withSession({ role: "MANAGER" });

    const res = await request(app).post("/api/users").set("Cookie", cookie).send(validCreateBody);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier (email déjà utilisé)", async () => {
    const cookie = withSession();
    createMock.mockRejectedValueOnce(new Error("Cet email est déjà utilisé"));

    const res = await request(app).post("/api/users").set("Cookie", cookie).send(validCreateBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Cet email est déjà utilisé" });
  });

  it("400 — propage une erreur métier (hiérarchie des rôles non respectée)", async () => {
    const cookie = withSession();
    createMock.mockRejectedValueOnce(new Error("Vous ne pouvez pas créer un utilisateur avec ce rôle"));

    const res = await request(app).post("/api/users").set("Cookie", cookie).send(validCreateBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Vous ne pouvez pas créer un utilisateur avec ce rôle" });
  });
});

// ── PATCH /:id — même groupe (c), 401/403 non répétés ────────────────────────
describe("PATCH /api/users/:id", () => {
  it("200 — met à jour un utilisateur avec un corps valide", async () => {
    const cookie = withSession();
    updateMock.mockResolvedValueOnce({ id: "user-2", firstName: "Nouveau prénom" });

    const res = await request(app).patch("/api/users/user-2").set("Cookie", cookie).send({ firstName: "Nouveau prénom" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "user-2", firstName: "Nouveau prénom" });
  });

  it("400 — rejette un corps invalide (prénom vide)", async () => {
    const cookie = withSession();

    const res = await request(app).patch("/api/users/user-2").set("Cookie", cookie).send({ firstName: "" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.firstName).toBeDefined();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("400 — propage l'anti-IDOR (utilisateur d'une autre organisation, via getById interne)", async () => {
    const cookie = withSession();
    updateMock.mockRejectedValueOnce(new Error("Utilisateur introuvable"));

    const res = await request(app)
      .patch("/api/users/user-dune-autre-org")
      .set("Cookie", cookie)
      .send({ firstName: "X" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Utilisateur introuvable" });
  });
});

// ── PATCH /:id/role — même groupe (c) ────────────────────────────────────────
describe("PATCH /api/users/:id/role", () => {
  it("200 — modifie le rôle d'un utilisateur", async () => {
    const cookie = withSession();
    changeRoleMock.mockResolvedValueOnce({ id: "user-2", role: "MANAGER" });

    const res = await request(app).patch("/api/users/user-2/role").set("Cookie", cookie).send({ role: "MANAGER" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "user-2", role: "MANAGER" });
  });

  it("400 — rejette un rôle hors du schéma autorisé", async () => {
    const cookie = withSession();

    const res = await request(app).patch("/api/users/user-2/role").set("Cookie", cookie).send({ role: "SUPER_ADMIN" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.role).toBeDefined();
    expect(changeRoleMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier (l'ADMIN ne peut pas modifier ce rôle)", async () => {
    const cookie = withSession();
    changeRoleMock.mockRejectedValueOnce(new Error("Vous ne pouvez pas modifier le rôle de cet utilisateur"));

    const res = await request(app).patch("/api/users/user-2/role").set("Cookie", cookie).send({ role: "MANAGER" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Vous ne pouvez pas modifier le rôle de cet utilisateur" });
  });
});

// ── PATCH /:id/deactivate — même groupe (c) ──────────────────────────────────
describe("PATCH /api/users/:id/deactivate", () => {
  it("200 — désactive un utilisateur", async () => {
    const cookie = withSession();
    deactivateMock.mockResolvedValueOnce({ id: "user-2", isActive: false });

    const res = await request(app).patch("/api/users/user-2/deactivate").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Utilisateur désactivé" });
  });

  it("400 — propage l'anti-IDOR (utilisateur d'une autre organisation)", async () => {
    const cookie = withSession();
    deactivateMock.mockRejectedValueOnce(new Error("Utilisateur introuvable"));

    const res = await request(app).patch("/api/users/user-dune-autre-org/deactivate").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Utilisateur introuvable" });
  });
});

// ── PATCH /:id/activate — même groupe (c) ────────────────────────────────────
describe("PATCH /api/users/:id/activate", () => {
  it("200 — réactive un utilisateur", async () => {
    const cookie = withSession();
    activateMock.mockResolvedValueOnce({ id: "user-2", isActive: true });

    const res = await request(app).patch("/api/users/user-2/activate").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Utilisateur activé" });
  });

  it("400 — propage l'anti-IDOR (utilisateur d'une autre organisation)", async () => {
    const cookie = withSession();
    activateMock.mockRejectedValueOnce(new Error("Utilisateur introuvable"));

    const res = await request(app).patch("/api/users/user-dune-autre-org/activate").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Utilisateur introuvable" });
  });
});
