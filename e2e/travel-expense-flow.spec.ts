import { test, expect } from "@playwright/test";
import path from "node:path";
import { readFixtures } from "./utils/fixtures";
import { loginAsUser, logout, expectToast } from "./utils/auth";

/**
 * Verrouille le cycle de vie complet d'une note de frais introduit/corrigé sur
 * ce projet (Vagues 1 & 2 du chapitre "Notes de frais") :
 *   Employé soumet (avec justificatif + pré-remplissage OCR simulé, plafonds
 *   TravelPolicy respectés) → Manager voit le justificatif et approuve →
 *   remboursement réel (débit wallet organisation + crédit wallet employé),
 *   visible à la fois dans l'UI (badge de statut, solde du portefeuille) et
 *   en base (WalletEntry / OrganizationWalletEntry).
 *
 * Fixtures dédiées (organisation/employé/manager/politique/portefeuille),
 * créées par e2e/global-setup.ts et détruites par e2e/global-teardown.ts —
 * aucune donnée réelle ou seedée pour la démo n'est jamais touchée.
 */

// baseURL (config) pointe le NAVIGATEUR vers le frontend Next.js (:3000) — les
// appels API directs ci-dessous doivent viser le backend Express, sur un port
// distinct, d'où une URL absolue plutôt qu'un chemin relatif à baseURL.
const API_BASE = process.env.E2E_API_URL || "http://localhost:5000/api";

const RECEIPT_FILE = path.resolve(__dirname, "fixtures/sample-receipt.png");
const EXPENSE_TITLE = `E2E Frais ${Date.now()}`;
const EXPENSE_AMOUNT = 12_000; // déterministe — écrase l'auto-remplissage OCR (aléatoire par design)

test.describe("Cycle notes de frais : soumission employé → approbation manager → remboursement", () => {
    test("un employé soumet une note avec justificatif, un manager l'approuve, le remboursement est réel", async ({ page, request }) => {
        const fx = readFixtures();

        // Le endpoint réel (POST /employee/expenses/upload) signe l'upload
        // Cloudinary avec l'horloge système ; sur cet environnement d'exécution,
        // elle diverge de l'horloge réelle de Cloudinary, qui rejette alors la
        // requête ("Stale request") — limitation d'environnement sans rapport
        // avec le code de l'application (confirmé isolément hors Playwright).
        // On intercepte donc CE SEUL appel réseau pour simuler une réponse
        // Cloudinary réussie ; tout le reste du flux (upload UI, OCR, soumission,
        // approbation, remboursement) s'exécute réellement, sans mock.
        await page.route("**/api/employee/expenses/upload", async (route) => {
            await route.fulfill({
                status: 201,
                contentType: "application/json",
                body: JSON.stringify({
                    url: `https://res.cloudinary.com/e2e-simulated/receipt-${Date.now()}.png`,
                    name: "sample-receipt.png",
                    size: "0.0 MB",
                }),
            });
        });

        // ── 1. Connexion Employé ──────────────────────────────────────────────
        await test.step("Connexion employé", async () => {
            await loginAsUser(page, fx.employee.email, fx.employee.password);
            await expect(page).toHaveURL(/\/employes\//);
        });

        await test.step("Accès à la liste des notes de frais", async () => {
            await page.goto("/employes/notes-de-frais");
            await expect(page.getByRole("heading", { name: "Notes de frais" })).toBeVisible();
            await page.getByRole("button", { name: "Créer une note" }).click();
            await expect(page).toHaveURL(/\/employes\/notes-de-frais\/nouveau/);
        });

        await test.step("Upload du justificatif — déclenche le flux OCR simulé", async () => {
            await page.setInputFiles("#file-input", RECEIPT_FILE);
            // Vague 2 : l'upload déclenche un scan OCR best-effort qui pré-remplit
            // montant/date si vides — on attend ce signal avant de poursuivre.
            await expectToast(page, /montant détecté automatiquement/i);
            const amountValue = await page.locator('input[type="number"]').inputValue();
            expect(Number(amountValue)).toBeGreaterThan(0);
        });

        await test.step("Complète et soumet la note de frais (conforme à la politique de voyage)", async () => {
            await page.getByPlaceholder("Ex: Déplacement client Paris").fill(EXPENSE_TITLE);
            await page.locator('input[type="date"]').fill(new Date().toISOString().slice(0, 10));
            // 2 <select> sur ce formulaire : [0] rattachement voyage (optionnel), [1] catégorie.
            await page.locator("select").nth(1).selectOption({ label: "Transport" });
            // Valeur déterministe, sous le plafond Transport (300 000) et le
            // garde-fou global (500 000) de la politique de fixture — écrase la
            // valeur aléatoire injectée par l'OCR simulé.
            await page.locator('input[type="number"]').fill(String(EXPENSE_AMOUNT));

            await page.getByRole("button", { name: "Soumettre pour validation" }).click();
            await expectToast(page, /soumis pour validation/i);
            await expect(page).toHaveURL(/\/employes\/notes-de-frais$/);
        });

        // ── 2. Connexion Manager ──────────────────────────────────────────────
        await test.step("Déconnexion employé, connexion manager", async () => {
            await logout(page);
            await loginAsUser(page, fx.manager.email, fx.manager.password);
        });

        let balanceBeforeApproval = 0;

        await test.step("Le manager voit la note, son justificatif, et le solde du portefeuille avant approbation", async () => {
            await page.goto("/companies/AfrikVoyage/frais");
            const row = page.locator('[data-testid="expense-row"]', { hasText: EXPENSE_TITLE });
            await expect(row).toBeVisible();
            await expect(row.getByTestId("expense-status")).toContainText("Pending");
            await expect(row.getByTestId("justificatif-link")).toBeVisible();

            const balanceAttr = await page.getByTestId("wallet-balance").getAttribute("data-balance");
            balanceBeforeApproval = Number(balanceAttr);
            expect(balanceBeforeApproval).toBeGreaterThanOrEqual(EXPENSE_AMOUNT);
        });

        await test.step("Le manager approuve — déclenche le remboursement réel", async () => {
            const row = page.locator('[data-testid="expense-row"]', { hasText: EXPENSE_TITLE });
            await row.getByTitle("Approuver").click();
            await expectToast(page, /remboursement déclenché/i);
            await expect(row.getByTestId("expense-status")).toContainText("Approved");
        });

        // ── 3. Vérification financière ────────────────────────────────────────
        await test.step("Le solde du portefeuille entreprise a baissé exactement du montant remboursé (impact UI)", async () => {
            await expect
                .poll(async () => {
                    const attr = await page.getByTestId("wallet-balance").getAttribute("data-balance");
                    return Number(attr);
                }, { timeout: 10_000 })
                .toBe(balanceBeforeApproval - EXPENSE_AMOUNT);
        });

        await test.step("Vérification API : l'employé a bien été crédité du montant exact", async () => {
            // `request` (fixture Playwright indépendante de `page`) plutôt que
            // `page.request` : évite d'écraser les cookies de session manager
            // actuellement actifs dans le contexte navigateur. Le remboursement
            // (Vague 1) crédite le wallet PERSONNEL de l'employé, distinct du
            // portefeuille de l'organisation déjà vérifié côté UI ci-dessus.
            const loginRes = await request.post(`${API_BASE}/auth/login`, {
                data: { email: fx.employee.email, password: fx.employee.password },
            });
            expect(loginRes.ok()).toBeTruthy();

            const walletRes = await request.get(`${API_BASE}/wallet`);
            expect(walletRes.ok()).toBeTruthy();
            const { balance } = await walletRes.json();
            expect(Number(balance)).toBe(EXPENSE_AMOUNT);
        });
    });
});
