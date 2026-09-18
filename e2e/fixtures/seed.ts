/**
 * Fixtures E2E — créées directement via le client Prisma du backend (accès
 * direct, pas de round-trip HTTP) plutôt que via l'inscription self-service
 * (`POST /auth/register-company`) : cette dernière crée une organisation au
 * statut PENDING qui nécessite une validation manuelle par un Super Admin
 * avant de pouvoir se connecter — un détour lourd et non déterministe pour
 * un simple jeu de données de test. Toutes les entités créées ici portent un
 * préfixe/suffixe `e2e-<runId>` unique et sont supprimées par teardown().
 *
 * Ne touche jamais aux comptes seedés pour la démo/QA manuelle
 * (admin@afrikvoyage.com, employe@afrikvoyage.com, etc.) : organisation et
 * utilisateurs entièrement dédiés à cette suite, isolés de toute donnée réelle.
 */
import path from "node:path";
import dotenv from "dotenv";

// DATABASE_URL doit être en place AVANT que le module prisma du backend ne
// soit chargé (il lit process.env.DATABASE_URL à l'import) — d'où le require()
// différé après dotenv.config(), plutôt qu'un import ES statique hissé en tête.
dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

/* eslint-disable @typescript-eslint/no-var-requires */
const { prisma } = require("../../backend/src/core/config/prisma") as typeof import("../../backend/src/core/config/prisma");
const { hashPassword } = require("../../backend/src/core/utils/hash") as typeof import("../../backend/src/core/utils/hash");

export const E2E_PASSWORD = "E2ePassw0rd!234";

export interface E2EFixtures {
    runId: string;
    orgId: string;
    manager: { email: string; password: string };
    employee: { email: string; password: string };
    partner: { id: string };
    partnerAdmin: { email: string; password: string };
    bookingId: string;
    commissionEntryId: string;
    expectedNetBalance: number;
}

export async function seedE2EFixtures(): Promise<E2EFixtures> {
    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const passwordHash = await hashPassword(E2E_PASSWORD);

    const org = await prisma.organization.create({
        data: {
            name:   `E2E Test Co ${runId}`,
            slug:   `e2e-test-co-${runId}`,
            email:  `e2e-org-${runId}@e2e.test.local`,
            status: "ACTIVE",
            hasVoyage: true,
            hasCSE:    true,
        },
    });

    const manager = await prisma.user.create({
        data: {
            email: `e2e-manager-${runId}@e2e.test.local`,
            password: passwordHash,
            firstName: "E2E", lastName: "Manager",
            role: "ADMIN",
            organizationId: org.id,
            isActive: true,
            profileCompleted: true,
        },
    });

    const employeeUser = await prisma.user.create({
        data: {
            email: `e2e-employee-${runId}@e2e.test.local`,
            password: passwordHash,
            firstName: "E2E", lastName: "Employee",
            role: "EMPLOYE",
            organizationId: org.id,
            isActive: true,
            profileCompleted: true,
        },
    });
    await prisma.employee.create({ data: { userId: employeeUser.id, organizationId: org.id } });

    // Politique par défaut, plafonds larges — la note de frais soumise par le
    // scénario doit passer la validation anti-fraude (Vague 1) sans y toucher.
    await prisma.travelPolicy.create({
        data: {
            organizationId: org.id,
            name: `E2E Policy ${runId}`,
            isActive: true,
            isDefault: true,
            maxDailyAllowance: 50000,
            maxFlightBudget:   300000,
            maxHotelBudgetPerNight: 100000,
            maxExpenseAmount:  500000,
        },
    });

    // Portefeuille entreprise pré-approvisionné — sans ce topup, l'approbation
    // manager échouerait en 422 "solde insuffisant" (Vague 1, part 2).
    const orgWallet = await prisma.organizationWallet.create({ data: { organizationId: org.id } });
    await prisma.organizationWalletEntry.create({
        data: {
            organizationWalletId: orgWallet.id,
            type: "TOPUP",
            amount: 200000,
            runningBalance: 200000,
            idempotencyKey: `e2e-topup-${runId}`,
            description: "Approvisionnement fixture E2E",
        },
    });

    // ── Fixtures scénario partenaire ──────────────────────────────────────
    const partner = await prisma.partner.create({
        data: {
            name: `E2E Partner ${runId}`,
            sector: "Hôtellerie",
            status: "ACTIVE",
            createdBy: manager.id,
        },
    });
    const partnerAdmin = await prisma.partnerUser.create({
        data: {
            partnerId: partner.id,
            email: `e2e-partner-admin-${runId}@e2e.test.local`,
            passwordHash,
            firstName: "E2E", lastName: "PartnerAdmin",
            role: "PARTNER_ADMIN",
            isActive: true,
        },
    });
    const rule = await prisma.commissionRule.create({
        data: { partnerId: partner.id, type: "PERCENTAGE", rate: 0.10, currencyCode: "XOF" },
    });

    const grossAmount = 100000;
    const commissionAmount = grossAmount * 0.10;
    const netAmount = grossAmount - commissionAmount;

    const booking = await prisma.booking.create({
        data: {
            userId: employeeUser.id,
            organizationId: org.id,
            partnerId: partner.id,
            bookingDate: new Date(),
            status: "COMPLETED",
            completedAt: new Date(),
            idempotencyKey: `e2e-booking-${runId}`,
        },
    });
    const commissionEntry = await prisma.commissionEntry.create({
        data: {
            bookingId: booking.id,
            ruleId: rule.id,
            partnerId: partner.id,
            grossAmount,
            commissionAmount,
            netAmount,
            currencyCode: "XOF",
            status: "CONFIRMED",
        },
    });

    return {
        runId,
        orgId: org.id,
        manager:      { email: manager.email, password: E2E_PASSWORD },
        employee:     { email: employeeUser.email, password: E2E_PASSWORD },
        partner:      { id: partner.id },
        partnerAdmin: { email: partnerAdmin.email, password: E2E_PASSWORD },
        bookingId: booking.id,
        commissionEntryId: commissionEntry.id,
        expectedNetBalance: netAmount,
    };
}

export async function teardownE2EFixtures(fx: E2EFixtures): Promise<void> {
    const users = await prisma.user.findMany({ where: { organizationId: fx.orgId }, select: { id: true } });
    const userIds = users.map((u) => u.id);

    await prisma.ocrScan.deleteMany({ where: { organizationId: fx.orgId } });
    await prisma.expenseReport.deleteMany({ where: { organizationId: fx.orgId } });
    // commissionEntry AVANT partnerPayout : referencé par payoutId (nullable),
    // mais partnerPayout lui-même est en RESTRICT sur partnerId — un reversement
    // a pu être créé pendant le test (scénario partner-payout-flow.spec.ts).
    await prisma.commissionEntry.deleteMany({ where: { partnerId: fx.partner.id } });
    await prisma.commissionRule.deleteMany({ where: { partnerId: fx.partner.id } });
    await prisma.partnerPayout.deleteMany({ where: { partnerId: fx.partner.id } });
    await prisma.booking.deleteMany({ where: { organizationId: fx.orgId } });
    await prisma.partnerUser.deleteMany({ where: { partnerId: fx.partner.id } });
    await prisma.partner.deleteMany({ where: { id: fx.partner.id } });
    await prisma.walletEntry.deleteMany({ where: { wallet: { organizationId: fx.orgId } } });
    await prisma.wallet.deleteMany({ where: { organizationId: fx.orgId } });
    await prisma.organizationWalletEntry.deleteMany({ where: { organizationWallet: { organizationId: fx.orgId } } });
    await prisma.organizationWallet.deleteMany({ where: { organizationId: fx.orgId } });
    await prisma.employee.deleteMany({ where: { organizationId: fx.orgId } });
    await prisma.travelPolicy.deleteMany({ where: { organizationId: fx.orgId } });
    await prisma.auditLog.deleteMany({ where: { OR: [{ organizationId: fx.orgId }, { userId: { in: userIds } }] } });
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { organizationId: fx.orgId } });
    await prisma.organization.deleteMany({ where: { id: fx.orgId } });
}
