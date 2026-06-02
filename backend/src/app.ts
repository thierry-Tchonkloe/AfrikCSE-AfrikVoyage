// import express, { Request, Response, NextFunction } from "express";
// import cors from "cors";
// import helmet from "helmet";
// import compression from "compression";
// import rateLimit from "express-rate-limit";
// import cookieParser from "cookie-parser";

// import authRoutes from "./modules/auth/interfaces/auth.routes";
// import organizationRoutes from "./modules/organization/interfaces/organization.routes";
// import userRoutes from "./modules/user/interfaces/user.routes";
// import settingsRoutes from "./modules/settings/interfaces/settings.routes";
// import contactRoutes from "./modules/contact/interfaces/contact.routes";

// import employeeRoutes  from "./modules/employees/interfaces/employee.routes";
// import benefitRoutes   from "./modules/benefits/interfaces/benefit.routes";
// import travelRoutes    from "./modules/travels/interfaces/travel.routes";
// import billingRoutes   from "./modules/billing/interfaces/billing.routes";
// import messagingRoutes from "./modules/messaging/interfaces/messaging.routes";

// import employeeSpaceRoutes from "./modules/employee/interfaces/employee-space.routes";
// import eventRoutes         from "./modules/events/interfaces/event.routes";
// import communicationRoutes from "./modules/communication/interfaces/communication.routes";
// import catalogRoutes       from "./modules/catalog/interfaces/catalog.routes";


// const app = express();

// // ── Sécurité ────────────────────────────────────────────
// app.use(helmet());

// // ── CORS : autorise uniquement le frontend ──────────────
// app.use(cors({
//     origin: process.env.FRONTEND_URL || "https://afrikcse-afrikvoyage.vercel.app" || "http://localhost:3000",
//     credentials: true,
// }));

// // ── Rate limiting global : 1000 req/15min par IP ─────────
// app.use(rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 1000,
//     message: { message: "Trop de requêtes, réessayez dans 15 minutes" },
// }));

// // ── Rate limiting strict sur les routes auth ────────────
// const authLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 500, // 70 tentatives par 15min (anti-bruteforce)
//     message: { message: "Trop de tentatives, réessayez dans 15 minutes" },
// });

// app.use(cookieParser());

// // ── Parsing ─────────────────────────────────────────────
// app.use(express.json());
// app.use(compression() as any);

// // ── Health check ────────────────────────────────────────
// app.get("/health", (_req: Request, res: Response) => {
//     res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
// });

// // ── Routes ──────────────────────────────────────────────
// app.use("/api/auth", authLimiter, authRoutes);
// app.use("/api/organizations", organizationRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/settings", settingsRoutes);
// app.use("/api/contact", contactRoutes);

// app.use("/api/employees",  employeeRoutes);
// app.use("/api/benefits",   benefitRoutes);
// app.use("/api/travels",    travelRoutes);
// app.use("/api/billing",    billingRoutes);
// app.use("/api/messaging",  messagingRoutes);

// app.use("/api/employee",       employeeSpaceRoutes);
// app.use("/api/events",         eventRoutes);
// app.use("/api/communication",  communicationRoutes);
// app.use("/api/catalog",        catalogRoutes);


// // ── Handler 404 ─────────────────────────────────────────
// app.use((_req: Request, res: Response) => {
//     res.status(404).json({ message: "Route introuvable" });
// });

// // ── Handler erreurs globales ─────────────────────────────
// app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
//     console.error("[ERROR]", err.message);
//     res.status(500).json({ message: "Erreur interne du serveur" });
// });

// export default app;









import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import authRoutes           from "./modules/auth/interfaces/auth.routes";
import organizationRoutes   from "./modules/organization/interfaces/organization.routes";
import userRoutes           from "./modules/user/interfaces/user.routes";
import settingsRoutes       from "./modules/settings/interfaces/settings.routes";
import contactRoutes        from "./modules/contact/interfaces/contact.routes";
import employeeRoutes       from "./modules/employees/interfaces/employee.routes";
import benefitRoutes        from "./modules/benefits/interfaces/benefit.routes";
import travelRoutes         from "./modules/travels/interfaces/travel.routes";
import billingRoutes        from "./modules/billing/interfaces/billing.routes";
import messagingRoutes      from "./modules/messaging/interfaces/messaging.routes";
import employeeSpaceRoutes  from "./modules/employee/interfaces/employee-space.routes";
import eventRoutes          from "./modules/events/interfaces/event.routes";
import communicationRoutes  from "./modules/communication/interfaces/communication.routes";
import catalogRoutes        from "./modules/catalog/interfaces/catalog.routes";

const app = express();

// ── Origines autorisées ─────────────────────────────────────────────────────
// ✅ Tableau au lieu du || chaîné — toutes les origines sont acceptées
const ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL,               // variable d'env (prod)
    "https://afrikcse-afrikvoyage.vercel.app", // fallback Vercel
    "http://localhost:3000",                 // dev local
].filter(Boolean) as string[];             // retire les undefined

// ── Sécurité ────────────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: (origin, callback) => {
        // Autorise les requêtes sans origin (Postman, server-to-server, health check)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        } else {
        callback(new Error(`CORS bloqué pour l'origine : ${origin}`));
        }
    },
    credentials: true, // ← obligatoire pour que les cookies HTTP-only passent
}));

// ── cookie-parser ── doit être avant les routes ─────────────────────────────
app.use(cookieParser());

// ── Rate limiting global ─────────────────────────────────────────────────────
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { message: "Trop de requêtes, réessayez dans 15 minutes" },
}));

// ── Rate limiting strict auth ────────────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1500,
    message: { message: "Trop de tentatives, réessayez dans 15 minutes" },
});

// ── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(compression() as any);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

const API_ROUTES = [
    {
        prefix: "/api/auth",
        description: "Authentification, compte et session",
        methods: [
            "POST /register-company",
            "POST /login",
            "POST /refresh",
            "POST /forgot-password",
            "POST /reset-password",
            "POST /logout",
            "GET /me",
            "PATCH /complete-profile",
            "POST /activate",
        ],
    },
    {
        prefix: "/api/organizations",
        description: "Organisation, validation et gestion des modules",
        methods: [
            "GET /",
            "POST /",
            "GET /paginated",
            "GET /my/dashboard",
            "GET /:id",
            "PATCH /:id/validate",
            "PATCH /:id/reject",
            "PATCH /:id/modules",
            "PATCH /:id/suspend",
            "PATCH /:id/validate-invite",
            "DELETE /:id",
        ],
    },
    {
        prefix: "/api/users",
        description: "Gestion des utilisateurs et des rôles",
        methods: [
            "GET /",
            "GET /:id",
            "POST /",
            "PATCH /:id",
            "PATCH /:id/role",
            "PATCH /:id/deactivate",
            "PATCH /:id/activate",
        ],
    },
    {
        prefix: "/api/settings",
        description: "Paramètres application et dashboard",
        methods: ["GET /", "PATCH /", "GET /dashboard"],
    },
    {
        prefix: "/api/contact",
        description: "Formulaire contact et gestion des demandes",
        methods: ["POST /", "GET /", "PATCH /:id/status"],
    },
    {
        prefix: "/api/employees",
        description: "Vue globale des employés et statistiques",
        methods: ["GET /", "GET /stats", "GET /:id"],
    },
    {
        prefix: "/api/benefits",
        description: "Gestion des avantages, demandes et rapports",
        methods: [
            "GET /categories",
            "POST /categories",
            "PATCH /categories/:id",
            "DELETE /categories/:id",
            "GET /requests",
            "GET /requests/stats",
            "PATCH /requests/:id/approve",
            "PATCH /requests/:id/reject",
            "POST /requests/bulk-approve",
            "GET /report",
        ],
    },
    {
        prefix: "/api/billing",
        description: "Facturation, abonnement et paiements",
        methods: [
            "GET /",
            "POST /upgrade",
            "GET /invoices",
            "POST /pay/kkiapay",
            "POST /pay/fedapay",
            "POST /pay/card",
        ],
    },
    {
        prefix: "/api/messaging",
        description: "Messagerie conversationnelle",
        methods: [
            "GET /conversations",
            "GET /conversations/support",
            "GET /conversations/unread",
            "GET /conversations/:id/messages",
            "POST /conversations/:id/messages",
            "PATCH /conversations/:id/read",
        ],
    },
    {
        prefix: "/api/employee",
        description: "Espace employé personnel",
        methods: [
            "GET /dashboard",
            "GET /travels",
            "POST /travels",
            "GET /expenses",
            "POST /expenses",
            "GET /profile",
            "PATCH /profile",
            "GET /documents",
            "POST /documents",
            "DELETE /documents/:id",
        ],
    },
    {
        prefix: "/api/events",
        description: "Événements et inscriptions",
        methods: [
            "GET /",
            "GET /upcoming",
            "GET /stats",
            "POST /",
            "POST /:id/register",
            "DELETE /:id/register",
        ],
    },
    {
        prefix: "/api/communication",
        description: "Posts, commentaires et sondages internes",
        methods: [
            "GET /posts",
            "POST /posts",
            "POST /posts/:id/like",
            "POST /posts/:id/comment",
            "POST /poll-options/:id/vote",
        ],
    },
    {
        prefix: "/api/catalog",
        description: "Catalogue public et catégories",
        methods: ["GET /", "GET /categories", "GET /:id"],
    },
];

app.get("/api", (_req: Request, res: Response) => {
    res.status(200).json({
        status: "ok",
        note: "Liste des points d'entrée API disponibles",
        routes: API_ROUTES,
        documentation: "/API_DOCUMENTATION.md",
    });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",          authLimiter, authRoutes);
app.use("/api/organizations",  organizationRoutes);
app.use("/api/users",          userRoutes);
app.use("/api/settings",       settingsRoutes);
app.use("/api/contact",        contactRoutes);
app.use("/api/employees",      employeeRoutes);
app.use("/api/benefits",       benefitRoutes);
app.use("/api/travels",        travelRoutes);
app.use("/api/billing",        billingRoutes);
app.use("/api/messaging",      messagingRoutes);
app.use("/api/employee",       employeeSpaceRoutes);
app.use("/api/events",         eventRoutes);
app.use("/api/communication",  communicationRoutes);
app.use("/api/catalog",        catalogRoutes);

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "Route introuvable" });
});

// ── Erreurs globales ──────────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[ERROR]", err.message);
    res.status(500).json({ message: "Erreur interne du serveur" });
});

export default app;