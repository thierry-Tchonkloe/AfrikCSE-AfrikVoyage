// ─────────────────────────────────────────────────────────────────────────────
// Tests unitaires du middleware CSRF (double-submit cookie) —
// core/middlewares/csrf.middleware.ts.
//
// Le middleware court-circuite volontairement sous NODE_ENV=test (voir son
// code) pour ne pas casser toute la suite supertest existante, qui ne
// reproduit pas le cycle cookie/en-tête d'un vrai navigateur. On bascule donc
// explicitement NODE_ENV sur une valeur non-"test" ici pour exercer le vrai
// comportement de la protection, puis on restaure la valeur d'origine.
// ─────────────────────────────────────────────────────────────────────────────

import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { csrfProtection } from "../../core/middlewares/csrf.middleware";

function buildApp() {
  const app = express();
  app.use(cookieParser());
  app.use(csrfProtection);
  app.get("/ping", (_req: Request, res: Response) => res.status(200).json({ ok: true }));
  app.post("/widgets", (_req: Request, res: Response) => res.status(201).json({ ok: true }));
  return app;
}

describe("csrfProtection middleware", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.NODE_ENV = "production";
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("laisse toujours passer les méthodes sûres (GET), même avec un cookie de session", async () => {
    const app = buildApp();
    const res = await request(app).get("/ping").set("Cookie", ["accessToken=abc"]);
    expect(res.status).toBe(200);
  });

  it("laisse passer une requête d'écriture SANS cookie de session (routes publiques : login, webhooks...)", async () => {
    const app = buildApp();
    const res = await request(app).post("/widgets").send({ name: "x" });
    expect(res.status).toBe(201);
  });

  it("rejette une requête d'écriture avec cookie de session mais SANS en-tête X-CSRF-Token", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/widgets")
      .set("Cookie", ["accessToken=abc", "csrfToken=secret-token"])
      .send({ name: "x" });
    expect(res.status).toBe(403);
  });

  it("rejette une requête d'écriture si l'en-tête X-CSRF-Token ne correspond pas au cookie", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/widgets")
      .set("Cookie", ["accessToken=abc", "csrfToken=secret-token"])
      .set("X-CSRF-Token", "wrong-token")
      .send({ name: "x" });
    expect(res.status).toBe(403);
  });

  it("accepte une requête d'écriture quand l'en-tête X-CSRF-Token correspond au cookie (double-submit valide)", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/widgets")
      .set("Cookie", ["accessToken=abc", "csrfToken=secret-token"])
      .set("X-CSRF-Token", "secret-token")
      .send({ name: "x" });
    expect(res.status).toBe(201);
  });

  it("applique aussi le contrôle pour les sessions partenaires (partnerAccessToken)", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/widgets")
      .set("Cookie", ["partnerRefreshToken=abc", "csrfToken=secret-token"])
      .send({ name: "x" });
    expect(res.status).toBe(403);
  });
});
