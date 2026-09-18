import { test, expect } from "@playwright/test";
import { readFixtures } from "./utils/fixtures";
import { loginAsUser, expectToast } from "./utils/auth";

/**
 * Verrouille le cycle de reversement du Portail Partenaire : l'onglet Finances
 * doit refléter les gains réels d'une réservation COMPLETED (CommissionEntry
 * CONFIRMED créée par global-setup.ts) et une demande de reversement doit
 * immédiatement faire basculer le solde disponible à 0 (les entrées
 * réclamées passent de "Disponible" à "Réclamée").
 *
 * Le formulaire de connexion est le même que pour un compte User standard
 * (/login) : le backend distingue un PartnerUser et redirige automatiquement
 * vers /partner-portal/dashboard (voir e2e/utils/auth.ts::loginAsUser).
 */
test.describe("Portail Partenaire : Finances → demande de reversement", () => {
    test("le solde disponible reflète les gains réels puis bascule à 0 après la demande", async ({ page }) => {
        const fx = readFixtures();

        await test.step("Connexion partenaire", async () => {
            await loginAsUser(page, fx.partnerAdmin.email, fx.partnerAdmin.password);
            await expect(page).toHaveURL(/\/partner-portal\/dashboard/);
        });

        await test.step("Onglet Finances — charge les gains réels de la réservation complétée", async () => {
            await page.getByRole("button", { name: "Finances" }).click();
            await expect(page).toHaveURL(/\/partner-portal\/finances/);

            const netBalance = page.getByTestId("net-balance");
            await expect(netBalance).toBeVisible();
            await expect.poll(async () => Number(await netBalance.getAttribute("data-value"))).toBe(fx.expectedNetBalance);

            const row = page.locator("tbody tr", { hasText: fx.bookingId.slice(0, 10) });
            await expect(row).toBeVisible();
            await expect(row.getByTestId("payout-status")).toContainText("Disponible");
        });

        await test.step("Demande de reversement — le solde disponible bascule à 0", async () => {
            await page.getByRole("button", { name: "Demander un reversement" }).click();
            await expectToast(page, /demande de reversement envoyée/i);

            const netBalance = page.getByTestId("net-balance");
            await expect.poll(async () => Number(await netBalance.getAttribute("data-value"))).toBe(0);

            const row = page.locator("tbody tr", { hasText: fx.bookingId.slice(0, 10) });
            await expect(row.getByTestId("payout-status")).toContainText("Réclamée");
        });

        await test.step("La demande de reversement ne peut pas être dupliquée tant que le solde est à 0", async () => {
            await expect(page.getByRole("button", { name: "Demander un reversement" })).toBeDisabled();
        });
    });
});
