#!/usr/bin/env node
/**
 * Vérification bout-en-bout du cycle de clôture d'un voyage :
 *
 *   1. Crée une organisation + un admin + deux TravelRequest APPROVED isolés
 *      (jamais de données existantes touchées — tout est nettoyé à la fin,
 *      succès ou échec).
 *   2. S'authentifie en HTTP (cookies + jeton CSRF double-submit, comme un
 *      vrai navigateur) puis appelle PATCH /api/travels/:id/complete avec un
 *      coût réel inférieur au coût estimé sur l'une des deux demandes.
 *   3. Vérifie en base que :
 *        - `actualCost` a bien été persisté sur la TravelRequest clôturée ;
 *        - une ligne TravelReward a bien été générée par
 *          TravelRewardService.earn() (best-effort, non attendu par le
 *          contrôleur — le script patiente donc jusqu'à quelques secondes) ;
 *        - GET /api/travels/stats agrège bien SUM(COALESCE(actualCost,
 *          estimatedCost)) sur les DEUX demandes, avant et après clôture.
 *
 * Usage :
 *   node scripts/verify-travel-completion.js
 *
 * Variables d'environnement :
 *   API_BASE_URL — défaut : http://localhost:5000/api
 *
 * Prérequis : le backend doit tourner (ex. `npm run dev` dans backend/) et
 * pointer sur la même base que DATABASE_URL (lu depuis backend/.env).
 *
 * Note : POST /api/auth/login est limité à 5 tentatives / 15 min / IP
 * (anti-bruteforce). Évitez de relancer ce script en boucle serrée.
 */

const path = require("node:path");

const backendDir = path.join(__dirname, "..", "backend");

function backendRequire(pkg) {
    return require(require.resolve(pkg, { paths: [backendDir] }));
}

backendRequire("dotenv").config({ path: path.join(backendDir, ".env") });

const { PrismaClient } = backendRequire("@prisma/client");
const { PrismaPg } = backendRequire("@prisma/adapter-pg");
const bcrypt = backendRequire("bcrypt");

const BASE_URL = process.env.API_BASE_URL || "http://localhost:5000/api";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

let stepCount = 0;
function ok(label, detail) {
    stepCount += 1;
    console.log(`✅ [${stepCount}] ${label}${detail ? " — " + detail : ""}`);
}
function fail(label, detail) {
    stepCount += 1;
    console.log(`❌ [${stepCount}] ${label}${detail ? " — " + detail : ""}`);
    throw new Error(`Échec : ${label}`);
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Pattern double-submit cookie : on rejoue nous-mêmes ce qu'un navigateur
// ferait automatiquement (stockage des cookies de session + renvoi du jeton
// CSRF lu en JS dans l'en-tête X-CSRF-Token), cf. csrf.middleware.ts.
function parseCookieJar(setCookieHeaders) {
    const jar = {};
    for (const raw of setCookieHeaders) {
        const pair = raw.split(";")[0];
        const idx = pair.indexOf("=");
        if (idx === -1) continue;
        jar[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    }
    return jar;
}

async function getStats(cookieHeader) {
    const res = await fetch(`${BASE_URL}/travels/stats`, {
        headers: { Cookie: cookieHeader },
    });
    if (res.status !== 200) {
        fail("GET /travels/stats", `HTTP ${res.status}`);
    }
    return res.json();
}

async function main() {
    console.log("=== Vérification : clôture de voyage (PATCH /travels/:id/complete) ===");
    console.log(`→ API cible : ${BASE_URL}\n`);

    const suffix = Date.now().toString(36);
    const password = "Verif#Travel2026!";

    const ESTIMATED_A = 500_000;
    const ESTIMATED_B = 200_000;
    const ACTUAL_A    = 400_000; // < estimé → doit déclencher une récompense

    let org = null;
    let admin = null;
    let reqA = null;
    let reqB = null;

    try {
        // ── 1. Fixtures isolées (jamais de données existantes) ──────────────
        org = await prisma.organization.create({
            data: {
                name:       `Vérif Voyage ${suffix}`,
                slug:       `verif-voyage-${suffix}`,
                email:      `org-${suffix}@verif.local`,
                status:     "ACTIVE",
                hasVoyage:  true,
                validatedAt: new Date(),
            },
        });

        admin = await prisma.user.create({
            data: {
                email:          `admin-${suffix}@verif.local`,
                password:       await bcrypt.hash(password, 10),
                role:           "ADMIN",
                firstName:      "Vérif",
                lastName:       "Script",
                isActive:       true,
                emailVerified:  true,
                organizationId: org.id,
            },
        });

        reqA = await prisma.travelRequest.create({
            data: {
                destination:    "Cotonou",
                departureDate:  new Date(Date.now() + 7  * 86_400_000),
                returnDate:     new Date(Date.now() + 10 * 86_400_000),
                estimatedCost:  ESTIMATED_A,
                status:         "APPROVED",
                organizationId: org.id,
                requestedById:  admin.id,
            },
        });
        reqB = await prisma.travelRequest.create({
            data: {
                destination:    "Lomé",
                departureDate:  new Date(Date.now() + 14 * 86_400_000),
                returnDate:     new Date(Date.now() + 17 * 86_400_000),
                estimatedCost:  ESTIMATED_B,
                status:         "APPROVED",
                organizationId: org.id,
                requestedById:  admin.id,
            },
        });
        ok("Fixtures créées", `org=${org.slug}, reqA(estimé=${ESTIMATED_A}), reqB(estimé=${ESTIMATED_B})`);

        // ── 2. Authentification HTTP réelle (cookies + CSRF) ────────────────
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ email: admin.email, password }),
        });
        if (loginRes.status !== 200) {
            const body = await loginRes.json().catch(() => null);
            fail("Connexion admin", `HTTP ${loginRes.status} — ${body?.message ?? "réponse inattendue"}`);
        }
        const jar = parseCookieJar(loginRes.headers.getSetCookie?.() ?? []);
        if (!jar.accessToken || !jar.csrfToken) {
            fail("Connexion admin", "cookies accessToken/csrfToken absents de la réponse");
        }
        const cookieHeader = `accessToken=${jar.accessToken}; csrfToken=${jar.csrfToken}`;
        ok("Connexion admin réussie", admin.email);

        // ── 3. Stats AVANT clôture — COALESCE doit retomber sur estimatedCost ──
        const statsBefore = await getStats(cookieHeader);
        const expectedBefore = ESTIMATED_A + ESTIMATED_B;
        if (statsBefore.totalCost !== expectedBefore) {
            fail("Stats avant clôture", `attendu ${expectedBefore}, reçu ${statsBefore.totalCost}`);
        }
        ok("Stats avant clôture correctes (COALESCE -> estimatedCost)", `totalCost=${statsBefore.totalCost}`);

        // ── 4. Appel de l'endpoint de clôture ────────────────────────────────
        const completeRes = await fetch(`${BASE_URL}/travels/${reqA.id}/complete`, {
            method:  "PATCH",
            headers: {
                "Content-Type":  "application/json",
                "Cookie":        cookieHeader,
                "X-CSRF-Token":  jar.csrfToken,
            },
            body: JSON.stringify({ actualCost: ACTUAL_A }),
        });
        if (completeRes.status !== 200) {
            const body = await completeRes.json().catch(() => null);
            fail("PATCH /travels/:id/complete", `HTTP ${completeRes.status} — ${body?.message ?? "réponse inattendue"}`);
        }
        const completed = await completeRes.json();
        ok("PATCH /travels/:id/complete -> 200 OK", `status=${completed.status}, actualCost=${completed.actualCost}`);

        // ── 5. actualCost bien persisté en base ──────────────────────────────
        const persisted = await prisma.travelRequest.findUnique({ where: { id: reqA.id } });
        if (persisted.status !== "COMPLETED" || Number(persisted.actualCost) !== ACTUAL_A) {
            fail("actualCost en base", `status=${persisted.status}, actualCost=${persisted.actualCost}`);
        }
        ok("actualCost persisté correctement en base", `${ACTUAL_A} XOF`);

        // ── 6. TravelReward généré par TravelRewardService.earn() ───────────
        // Le contrôleur déclenche earn() en fire-and-forget (`.catch(() => {})`,
        // jamais attendu) pour ne pas bloquer la clôture en cas d'échec — on
        // patiente donc jusqu'à quelques secondes avant de conclure à un échec.
        let reward = null;
        for (let i = 0; i < 10 && !reward; i++) {
            reward = await prisma.travelReward.findUnique({ where: { travelRequestId: reqA.id } });
            if (!reward) await sleep(300);
        }
        const expectedSaved  = ESTIMATED_A - ACTUAL_A;
        const expectedPoints = Math.floor(expectedSaved / 1000);
        if (!reward) {
            fail("Récompense TravelReward", "aucune ligne créée après clôture (délai dépassé)");
        }
        if (
            reward.userId !== admin.id ||
            Number(reward.savedAmount) !== expectedSaved ||
            reward.points !== expectedPoints
        ) {
            fail("Récompense TravelReward", `détails inattendus (points=${reward.points}, savedAmount=${reward.savedAmount})`);
        }
        ok("TravelReward généré via TravelRewardService.earn()", `+${reward.points} pts, ${expectedSaved} XOF économisés`);

        // ── 7. Stats APRÈS clôture — COALESCE bascule sur actualCost ────────
        const statsAfter = await getStats(cookieHeader);
        const expectedAfter = ACTUAL_A + ESTIMATED_B;
        if (statsAfter.totalCost !== expectedAfter) {
            fail("Stats après clôture", `attendu ${expectedAfter}, reçu ${statsAfter.totalCost}`);
        }
        ok("Stats après clôture correctes (COALESCE -> actualCost)", `totalCost=${statsAfter.totalCost}`);

        console.log("\n✅ Toutes les vérifications sont passées avec succès.");
        process.exitCode = 0;
    } catch (err) {
        console.error(`\n❌ Vérification interrompue : ${err.message}`);
        process.exitCode = 1;
    } finally {
        // ── Nettoyage — ce script ne doit laisser aucune trace en base ──────
        const requestIds = [reqA?.id, reqB?.id].filter(Boolean);
        if (requestIds.length) {
            await prisma.travelReward.deleteMany({ where: { travelRequestId: { in: requestIds } } });
            await prisma.travelRequest.deleteMany({ where: { id: { in: requestIds } } });
        }
        if (admin) await prisma.user.delete({ where: { id: admin.id } }).catch(() => {});
        if (org)   await prisma.organization.delete({ where: { id: org.id } }).catch(() => {});
        await prisma.$disconnect();
        console.log("\n🧹 Fixtures de test nettoyées.");
    }
}

main();
