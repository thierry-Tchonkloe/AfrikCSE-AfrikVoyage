// Fabriques minimalistes de req/res/next Express pour tester des middlewares
// unitairement (sans passer par Supertest), réutilisables dans les futurs
// fichiers de test de modules (ex: partner-auth.middleware.test.ts).
import { Request, Response, NextFunction } from "express";

export function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    cookies: {},
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides,
  } as unknown as Request;
}

export function createMockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res as Response;
}

export function createMockNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}
