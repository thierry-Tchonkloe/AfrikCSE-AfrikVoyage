// Exécuté par Jest avant le chargement de chaque fichier de test (voir jest.config.js → setupFiles).
// Fournit des variables d'environnement factices pour que les modules important
// `core/config/prisma`, `core/utils/jwt`, etc. puissent être chargés sans .env réel.
// `core/config/prisma` reste malgré tout toujours mocké via `__mocks__/prisma.ts`
// dans chaque fichier de test (jest.mock), donc DATABASE_URL n'est ici qu'un filet de sécurité.

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test_db";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
// TICKET_SECRET / ENCRYPTION_KEY sont désormais requis au chargement des modules
// tickets/crypto (fail-fast en production, voir server.ts) — sans ces valeurs
// factices, tout test qui importe app.ts transitivement échouerait au chargement.
process.env.TICKET_SECRET = process.env.TICKET_SECRET || "test-ticket-secret";
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0".repeat(64);
