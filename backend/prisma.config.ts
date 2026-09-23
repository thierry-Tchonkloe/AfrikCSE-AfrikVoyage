import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

// En production (Render), DATABASE_URL est injecté directement
// En développement, dotenv charge le .env
if (process.env.NODE_ENV !== "production") {
  const { config } = await import("dotenv").catch(() => ({ config: () => {} }));
  (config as any)?.();
}

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: "prisma/migrations",
    seed: "node dist/prisma/seed.js",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});