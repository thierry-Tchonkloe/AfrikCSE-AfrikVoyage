// import authRoutes from "@/modules/auth/interfaces/auth.routes";
// import express, { type Application, } from 'express';
// import cors from 'cors';

// const app: Application = express();
// app.use(cors());
// app.use(express.json());
// app.use("/api/auth", authRoutes);

// export default app;



import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

import authRoutes from "./modules/auth/interfaces/auth.routes";
import organizationRoutes from "./modules/organization/interfaces/organization.routes";
import userRoutes from "./modules/user/interfaces/user.routes";
import settingsRoutes from "./modules/settings/interfaces/settings.routes";
import contactRoutes from "./modules/contact/interfaces/contact.routes";

import employeeRoutes  from "./modules/employees/interfaces/employee.routes";
import benefitRoutes   from "./modules/benefits/interfaces/benefit.routes";
import travelRoutes    from "./modules/travels/interfaces/travel.routes";
import billingRoutes   from "./modules/billing/interfaces/billing.routes";
import messagingRoutes from "./modules/messaging/interfaces/messaging.routes";

import employeeSpaceRoutes from "./modules/employee/interfaces/employee-space.routes";
import eventRoutes         from "./modules/events/interfaces/event.routes";
import communicationRoutes from "./modules/communication/interfaces/communication.routes";
import catalogRoutes       from "./modules/catalog/interfaces/catalog.routes";


const app = express();

// ── Sécurité ────────────────────────────────────────────
app.use(helmet());

// ── CORS : autorise uniquement le frontend ──────────────
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));

// ── Rate limiting global : 1000 req/15min par IP ─────────
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { message: "Trop de requêtes, réessayez dans 15 minutes" },
}));

// ── Rate limiting strict sur les routes auth ────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500, // 70 tentatives par 15min (anti-bruteforce)
    message: { message: "Trop de tentatives, réessayez dans 15 minutes" },
});

// ── Parsing ─────────────────────────────────────────────
app.use(express.json());
app.use(compression() as any);

// ── Health check ────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ──────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/contact", contactRoutes);

app.use("/api/employees",  employeeRoutes);
app.use("/api/benefits",   benefitRoutes);
app.use("/api/travels",    travelRoutes);
app.use("/api/billing",    billingRoutes);
app.use("/api/messaging",  messagingRoutes);

app.use("/api/employee",       employeeSpaceRoutes);
app.use("/api/events",         eventRoutes);
app.use("/api/communication",  communicationRoutes);
app.use("/api/catalog",        catalogRoutes);


// ── Handler 404 ─────────────────────────────────────────
app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "Route introuvable" });
});

// ── Handler erreurs globales ─────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[ERROR]", err.message);
    res.status(500).json({ message: "Erreur interne du serveur" });
});

export default app;