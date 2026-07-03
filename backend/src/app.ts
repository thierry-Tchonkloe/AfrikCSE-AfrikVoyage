import express, { Request, Response } from "express";
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
import flightRoutes         from "./modules/flights/interfaces/flight.routes";
import planConfigRoutes     from "./modules/plan-config/interfaces/plan-config.routes";
import auditLogRoutes       from "./modules/audit-log/interfaces/audit-log.routes";
import notificationRoutes   from "./modules/notification/interfaces/notification.routes";
import searchRoutes         from "./modules/search/interfaces/search.routes";
import integrationRoutes    from "./modules/integrations/interfaces/api-integration.routes";
import partnerRoutes          from "./modules/partners/interfaces/partner.routes";
import familyMemberRoutes    from "./modules/family-members/interfaces/family-member.routes";
import ticketRoutes          from "./modules/tickets/interfaces/ticket.routes";
import travelPolicyRoutes    from "./modules/travel-policies/interfaces/travel-policy.routes";
import groupTravelRoutes     from "./modules/group-travel/interfaces/group-travel.routes";
import travelRewardRoutes    from "./modules/travel-rewards/interfaces/travel-reward.routes";
import ocrRoutes             from "./modules/ocr/interfaces/ocr.routes";
import eventPhotoRoutes      from "./modules/event-photos/interfaces/event-photo.routes";
import faqRoutes             from "./modules/faq/interfaces/faq.routes";
import { errorMiddleware }   from "./core/middlewares/error.middleware";

const app = express();

// ── Trust proxy ──────────────────────────────────────────────────────────────
// Nécessaire derrière le proxy de la plateforme d'hébergement (Railway, etc.)
// pour que req.ip reflète l'IP réelle du client (rate limiting, logs, CORS).
app.set("trust proxy", 1);

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
            "GET /                         — Liste toutes les orgs (SUPER_ADMIN)",
            "POST /                        — Créer org (SUPER_ADMIN)",
            "GET /paginated                — Liste paginée avec filtres (SUPER_ADMIN)",
            "GET /my/dashboard             — Dashboard de l'org connectée",
            "PATCH /my                     — Mettre à jour sa propre org (ADMIN/MANAGER)",
            "GET /:id                      — Détail org (SUPER_ADMIN)",
            "PATCH /:id/validate           — Valider org (SUPER_ADMIN)",
            "PATCH /:id/reject             — Rejeter org (SUPER_ADMIN)",
            "PATCH /:id/modules            — Activer/désactiver modules (SUPER_ADMIN)",
            "PATCH /:id/suspend            — Suspendre org (SUPER_ADMIN)",
            "PATCH /:id/validate-invite    — Valider + envoyer invitation (SUPER_ADMIN)",
            "PATCH /:id/reactivate         — Réactiver org suspendue (SUPER_ADMIN)",
            "POST /:id/invite              — Regénérer lien invitation (SUPER_ADMIN)",
            "DELETE /:id                   — Désactiver org (SUPER_ADMIN)",
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
        description: "Facturation, abonnement et paiements (KkiaPay, FedaPay, Carte)",
        methods: [
            "GET /plans                  — Prix des plans (public)",
            "POST /webhook/kkiapay       — Webhook KkiaPay (public, signé HMAC)",
            "POST /webhook/fedapay       — Webhook FedaPay (public, token)",
            "GET /                       — Abonnement courant",
            "POST /upgrade               — Changer de plan (sans paiement immédiat)",
            "GET /invoices               — Historique des factures",
            "POST /pay/kkiapay           — Vérifier transactionId KkiaPay et activer",
            "POST /pay/fedapay           — Créer transaction FedaPay → checkoutUrl",
            "POST /pay/card              — Paiement carte (Stripe-ready)",
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
        description: "Espace employé personnel (dashboard, voyages, avantages, profil)",
        methods: [
            "GET /dashboard",
            "GET /travels",
            "POST /travels",
            "GET /expenses",
            "POST /expenses",
            "GET /benefits/categories    — Catégories CSE disponibles + soldes",
            "GET /benefits/balance       — Solde global avantages de l'employé",
            "GET /benefits/requests      — Mes demandes d'avantages",
            "POST /benefits/requests     — Soumettre une demande d'avantage",
            "PATCH /benefits/requests/:id/cancel — Annuler une demande en attente",
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
        description: "Catalogue d'offres (lecture employé + admin CRUD)",
        methods: [
            "GET /              — Liste offres actives (filtres: category, search, sortBy, featured, city, region, offerType, subsidized)",
            "GET /featured      — Offres boostées actives",
            "GET /committee     — Sélection comité",
            "GET /new           — Nouvelles offres (7 derniers jours)",
            "GET /categories    — Liste des catégories distinctes",
            "GET /admin         — Toutes les offres, y compris inactives (ADMIN+)",
            "POST /             — Créer une offre (ADMIN+)",
            "GET /:id           — Détail d'une offre",
            "PATCH /:id         — Modifier une offre (ADMIN+)",
            "DELETE /:id        — Supprimer une offre (ADMIN+)",
            "GET /:id/audit     — Historique d'audit de l'offre (ADMIN+)",
        ],
    },
    {
        prefix: "/api/partners",
        description: "Gestion des partenaires CSE/Voyage (SUPER_ADMIN)",
        methods: [
            "GET /              — Liste paginée (filtres: status, scopeType, search)",
            "POST /             — Créer un partenaire",
            "GET /:id           — Détail avec derniers logs de sync",
            "PATCH /:id         — Modifier un partenaire",
            "DELETE /:id        — Supprimer (bloqué si offres actives)",
            "POST /:id/sync     — Déclencher une synchronisation manuelle",
            "GET /:id/logs      — Historique des synchronisations",
        ],
    },
    {
        prefix: "/api/flights",
        description: "Recherche de vols et d'aéroports (Amadeus Self-Service)",
        methods: [
            "GET /search    — Recherche de vols (from, to, departureDate, returnDate, adults, nonStop, currency)",
            "GET /locations — Recherche d'aéroports/villes par mot-clé (autocomplétion)",
        ],
    },
    {
        prefix: "/api/plan-configs",
        description: "Catalogue des plans tarifaires (SUPER_ADMIN)",
        methods: [
            "GET /        — Liste des plans avec nb d'organisations",
            "GET /:id      — Détail d'un plan",
            "POST /        — Créer un plan (SUPER_ADMIN)",
            "PATCH /:id    — Modifier un plan (SUPER_ADMIN)",
            "DELETE /:id   — Supprimer un plan inutilisé (SUPER_ADMIN)",
        ],
    },
    {
        prefix: "/api/audit-logs",
        description: "Journal d'audit des actions (SUPER_ADMIN)",
        methods: [
            "GET /         — Liste paginée et filtrable (user, action, entity, organisation, date)",
            "GET /actions  — Liste des types d'actions distinctes (pour filtres)",
            "GET /export   — Export CSV du journal",
        ],
    },
    {
        prefix: "/api/notifications",
        description: "Notifications in-app de l'utilisateur connecté",
        methods: [
            "GET /              — Liste paginée de mes notifications",
            "GET /unread-count  — Nombre de notifications non lues",
            "PATCH /read-all    — Marquer toutes mes notifications comme lues",
            "PATCH /:id/read    — Marquer une notification comme lue",
        ],
    },
    {
        prefix: "/api/search",
        description: "Recherche globale (employé, entreprise, super-admin)",
        methods: [
            "GET /?q=&scope=employee|company|admin — Recherche transverse selon le scope",
        ],
    },
    {
        prefix: "/api/family-members",
        description: "Membres de famille de l'employé connecté",
        methods: [
            "GET /        — Liste mes membres de famille actifs",
            "POST /       — Ajouter un membre",
            "GET /:id     — Détail",
            "PATCH /:id   — Modifier",
            "DELETE /:id  — Désactiver (soft-delete)",
        ],
    },
    {
        prefix: "/api/tickets",
        description: "Tickets QR pour les offres du catalogue nécessitant réservation",
        methods: [
            "POST /generate     — Générer un ticket (idempotent par jour)",
            "GET /              — Mes tickets",
            "GET /:code         — Détail ticket par code",
            "POST /validate     — Scanner/valider un ticket (HMAC vérifié, marque USED)",
            "DELETE /:id        — Annuler un ticket VALID",
        ],
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
app.use("/api/auth",          authRoutes);
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
app.use("/api/flights",        flightRoutes);
app.use("/api/plan-configs",   planConfigRoutes);
app.use("/api/audit-logs",     auditLogRoutes);
app.use("/api/notifications",  notificationRoutes);
app.use("/api/search",         searchRoutes);
app.use("/api/integrations",   integrationRoutes);
app.use("/api/partners",       partnerRoutes);
app.use("/api/family-members",  familyMemberRoutes);
app.use("/api/tickets",         ticketRoutes);
app.use("/api/travel-policies", travelPolicyRoutes);
app.use("/api/group-travel",    groupTravelRoutes);
app.use("/api/travel-rewards",  travelRewardRoutes);
app.use("/api/ocr",             ocrRoutes);
app.use("/api/event-photos",   eventPhotoRoutes);
app.use("/api/faq",            faqRoutes);

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "Route introuvable" });
});

// ── Erreurs globales ──────────────────────────────────────────────────────────
app.use(errorMiddleware);

export default app;