// ─────────────────────────────────────────────────────────────────────────────
// Tests du « socle » applicatif : app.ts (health check, endpoint /api, 404,
// sécurité HTTP, CORS) + middlewares transverses partagés par tous les modules
// (authentification, autorisation, validation des paramètres, gestion globale
// des erreurs). Les routes métier de chaque module (auth, orders, cashback…)
// sont couvertes dans src/test/modules/<module>/*.test.ts.
//
// Isolation DB : `core/config/prisma` est remplacé par le mock manuel
// `core/config/__mocks__/prisma.ts` (jest-mock-extended) — aucune connexion
// PostgreSQL réelle n'est établie pendant ces tests.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import express, { Request, Response } from "express";
import { MulterError } from "multer";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";
import { Role } from "@prisma/client";

jest.mock("../core/config/prisma");
jest.mock("../core/utils/jwt");
jest.mock("../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import app from "../app";
import { prisma } from "../core/config/prisma";
import { verifyAccessToken } from "../core/utils/jwt";
import { authenticate, authorize } from "../core/middlewares/auth.middleware";
import { errorMiddleware } from "../core/middlewares/error.middleware";
import { validateParams } from "../core/middlewares/params.middleware";
import { idParamCuid, idParamUuid, idParamInt } from "../core/validators/param.validators";
import { AppError } from "../core/errors/app.error";
import { createMockRequest, createMockResponse, createMockNext } from "./mock-express";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

// ── Squelette applicatif : health check, /api, 404 ──────────────────────────
describe("Squelette applicatif (app.ts)", () => {
  it("GET /health retourne un statut ok avec un timestamp valide", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.timestamp).toBe("string");
    expect(new Date(res.body.timestamp).toString()).not.toBe("Invalid Date");
  });

  it("GET /api retourne la documentation des routes disponibles", async () => {
    const res = await request(app).get("/api");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(Array.isArray(res.body.routes)).toBe(true);
    expect(res.body.routes.length).toBeGreaterThan(0);
    expect(
      res.body.routes.some((r: { prefix: string }) => r.prefix === "/api/auth")
    ).toBe(true);
  });

  it("GET sur une route racine inexistante retourne 404 avec le message attendu", async () => {
    const res = await request(app).get("/api/route-totalement-inexistante-xyz");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Route introuvable" });
  });

  it("GET sur une sous-route inconnue d'un module existant retourne aussi 404", async () => {
    // /api/auth existe, mais pas /api/auth/route-inconnue → le routeur passe
    // la main au handler 404 global (aucun match dans auth.routes.ts).
    const res = await request(app).get("/api/auth/route-inconnue");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Route introuvable" });
  });

  it("POST sur / retourne 404 (aucune route racine définie)", async () => {
    const res = await request(app).post("/").send({});

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Route introuvable" });
  });
});

// ── Sécurité HTTP : helmet ───────────────────────────────────────────────────
describe("En-têtes de sécurité HTTP (helmet)", () => {
  it("applique les en-têtes de sécurité par défaut de helmet", async () => {
    const res = await request(app).get("/health");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-dns-prefetch-control"]).toBe("off");
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
  });
});

// ── CORS ─────────────────────────────────────────────────────────────────────
describe("CORS", () => {
  it("autorise une requête sans en-tête Origin (Postman, server-to-server)", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
  });

  it("autorise une origine whitelistée et renvoie l'en-tête Access-Control-Allow-Origin", async () => {
    const res = await request(app).get("/health").set("Origin", "http://localhost:3000");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  it("bloque une origine non autorisée (l'erreur CORS remonte au middleware d'erreurs global)", async () => {
    const res = await request(app).get("/health").set("Origin", "http://origine-malveillante.example.com");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── Rate limiting global ─────────────────────────────────────────────────────
describe("Rate limiting global", () => {
  it("expose les en-têtes standard de rate limiting sur chaque réponse", async () => {
    const res = await request(app).get("/health");

    const limitHeader = res.headers["ratelimit-limit"] ?? res.headers["x-ratelimit-limit"];
    expect(limitHeader).toBeDefined();
  });
});

// ── Middleware global de gestion des erreurs (error.middleware) ─────────────
describe("Middleware global de gestion des erreurs (errorMiddleware)", () => {
  function buildErrorTestApp(thrower: (req: Request, res: Response) => void) {
    const testApp = express();
    testApp.get("/boom", thrower);
    testApp.use(errorMiddleware);
    return testApp;
  }

  it("formate une AppError avec son statusCode et son message", async () => {
    const testApp = buildErrorTestApp(() => {
      throw new AppError("Ressource non trouvée", 404);
    });

    const res = await request(testApp).get("/boom");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Ressource non trouvée" });
  });

  it("utilise le statusCode 500 par défaut pour une AppError sans code explicite", async () => {
    const testApp = buildErrorTestApp(() => {
      throw new AppError("Erreur métier inattendue");
    });

    const res = await request(testApp).get("/boom");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur métier inattendue" });
  });

  it("retourne 400 pour un fichier trop volumineux (MulterError LIMIT_FILE_SIZE)", async () => {
    const testApp = buildErrorTestApp(() => {
      throw new MulterError("LIMIT_FILE_SIZE");
    });

    const res = await request(testApp).get("/boom");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Fichier trop volumineux (max 5 Mo)" });
  });

  it("retourne 400 avec un message générique pour les autres erreurs Multer", async () => {
    const testApp = buildErrorTestApp(() => {
      throw new MulterError("LIMIT_UNEXPECTED_FILE");
    });

    const res = await request(testApp).get("/boom");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Échec de l'upload du fichier" });
  });

  it("retourne 404 pour une erreur Prisma P2025 (enregistrement introuvable)", async () => {
    const testApp = buildErrorTestApp(() => {
      const err: Error & { code?: string } = new Error("Record to update not found");
      err.code = "P2025";
      throw err;
    });

    const res = await request(testApp).get("/boom");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Ressource introuvable" });
  });

  it("retourne 500 avec un message générique pour toute erreur non gérée", async () => {
    const testApp = buildErrorTestApp(() => {
      throw new Error("Boum imprévu");
    });

    const res = await request(testApp).get("/boom");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── Middleware de validation des paramètres (validateParams) ────────────────
describe("Middleware de validation des paramètres (validateParams)", () => {
  function buildParamsTestApp(schema: Parameters<typeof validateParams>[0]) {
    const testApp = express();
    testApp.get("/items/:id", validateParams(schema), (req, res) => {
      res.status(200).json({ success: true, id: req.params.id });
    });
    return testApp;
  }

  it("accepte un id cuid valide", async () => {
    const testApp = buildParamsTestApp(idParamCuid);
    const res = await request(testApp).get("/items/clh3p9a1x0000qzrmn831i7am");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, id: "clh3p9a1x0000qzrmn831i7am" });
  });

  it("rejette un id cuid invalide avec 400 et le détail des erreurs", async () => {
    const testApp = buildParamsTestApp(idParamCuid);
    const res = await request(testApp).get("/items/pas-un-cuid");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.id).toBeDefined();
  });

  it("accepte un id uuid valide", async () => {
    const testApp = buildParamsTestApp(idParamUuid);
    const res = await request(testApp).get("/items/3fa85f64-5717-4562-b3fc-2c963f66afa6");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, id: "3fa85f64-5717-4562-b3fc-2c963f66afa6" });
  });

  it("rejette un id uuid invalide avec 400", async () => {
    const testApp = buildParamsTestApp(idParamUuid);
    const res = await request(testApp).get("/items/pas-un-uuid");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.id).toBeDefined();
  });

  it("accepte un id entier valide et le convertit en nombre", async () => {
    const testApp = buildParamsTestApp(idParamInt);
    const res = await request(testApp).get("/items/42");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, id: 42 });
  });

  it("rejette un id entier non numérique avec 400", async () => {
    const testApp = buildParamsTestApp(idParamInt);
    const res = await request(testApp).get("/items/abc");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.id).toBeDefined();
  });
});

// ── Middleware d'authentification (auth.middleware → authenticate) ──────────
describe("Middleware d'authentification (authenticate)", () => {
  const validPayload = {
    userId: "user-1",
    role: Role.ADMIN,
    organizationId: "org-1",
    isHost: false,
    tokenVersion: 1,
  };

  it("rejette avec 401 si le cookie accessToken est absent", async () => {
    const req = createMockRequest({ cookies: {} });
    const res = createMockResponse();
    const next = createMockNext();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token manquant" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejette avec 401 si le token est invalide ou expiré", async () => {
    verifyAccessTokenMock.mockImplementation(() => {
      throw new Error("jwt expired");
    });
    const req = createMockRequest({ cookies: { accessToken: "token-invalide" } });
    const res = createMockResponse();
    const next = createMockNext();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token invalide ou expiré" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejette avec 401 si l'utilisateur n'existe plus en base", async () => {
    verifyAccessTokenMock.mockReturnValue(validPayload);
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const req = createMockRequest({ cookies: { accessToken: "token-valide" } });
    const res = createMockResponse();
    const next = createMockNext();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Session expirée, veuillez vous reconnecter" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejette avec 401 si le compte utilisateur est désactivé", async () => {
    verifyAccessTokenMock.mockReturnValue(validPayload);
    prismaMock.user.findUnique.mockResolvedValueOnce({
      tokenVersion: validPayload.tokenVersion,
      isActive: false,
    } as never);
    const req = createMockRequest({ cookies: { accessToken: "token-valide" } });
    const res = createMockResponse();
    const next = createMockNext();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Session expirée, veuillez vous reconnecter" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejette avec 401 si le tokenVersion ne correspond plus (déconnexion / reset)", async () => {
    verifyAccessTokenMock.mockReturnValue(validPayload);
    prismaMock.user.findUnique.mockResolvedValueOnce({
      tokenVersion: validPayload.tokenVersion + 1,
      isActive: true,
    } as never);
    const req = createMockRequest({ cookies: { accessToken: "token-valide" } });
    const res = createMockResponse();
    const next = createMockNext();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Session expirée, veuillez vous reconnecter" });
    expect(next).not.toHaveBeenCalled();
  });

  it("attache req.user et appelle next() si le token et l'utilisateur sont valides", async () => {
    verifyAccessTokenMock.mockReturnValue(validPayload);
    prismaMock.user.findUnique.mockResolvedValueOnce({
      tokenVersion: validPayload.tokenVersion,
      isActive: true,
    } as never);
    const req = createMockRequest({ cookies: { accessToken: "token-valide" } });
    const res = createMockResponse();
    const next = createMockNext();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toEqual({
      userId: "user-1",
      role: Role.ADMIN,
      organizationId: "org-1",
      isHost: false,
    });
  });
});

// ── Middleware d'autorisation (auth.middleware → authorize) ─────────────────
describe("Middleware d'autorisation (authorize)", () => {
  it("rejette avec 401 si req.user est absent (authenticate n'a pas été exécuté)", () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    authorize(Role.SUPER_ADMIN)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Non authentifié" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejette avec 403 si le rôle de l'utilisateur n'est pas autorisé", () => {
    const req = createMockRequest({
      user: { userId: "user-1", role: Role.EMPLOYE, organizationId: "org-1", isHost: false },
    });
    const res = createMockResponse();
    const next = createMockNext();

    authorize(Role.SUPER_ADMIN, Role.ADMIN)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Accès interdit" });
    expect(next).not.toHaveBeenCalled();
  });

  it("appelle next() si le rôle de l'utilisateur fait partie des rôles autorisés", () => {
    const req = createMockRequest({
      user: { userId: "user-1", role: Role.SUPER_ADMIN, organizationId: null, isHost: true },
    });
    const res = createMockResponse();
    const next = createMockNext();

    authorize(Role.SUPER_ADMIN, Role.ADMIN)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
