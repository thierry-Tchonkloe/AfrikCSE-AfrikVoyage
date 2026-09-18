import { Page, expect } from "@playwright/test";

/**
 * Le bandeau de consentement cookies (fixed bottom-0 inset-x-0, pleine largeur,
 * cf. CookieConsentBanner.tsx) recouvre le coin bas-gauche de la sidebar — dont
 * le bouton "Déconnexion" — tant qu'il n'a pas été fermé (choix persisté en
 * localStorage). `.isVisible()` ne PATIENTE pas (retourne l'état immédiat) —
 * on utilise `.waitFor()` pour laisser le temps à l'effet client de monter le
 * bandeau (1er chargement Next.js en mode dev = compilation à la volée, plus lente).
 */
async function dismissCookieBanner(page: Page): Promise<void> {
    const acceptButton = page.getByRole("button", { name: "Tout accepter" });
    try {
        await acceptButton.waitFor({ state: "visible", timeout: 8000 });
    } catch {
        return; // déjà accepté (ou jamais affiché) — rien à faire
    }
    await acceptButton.click();
    await expect(acceptButton).toBeHidden({ timeout: 5000 });
}

/**
 * Connexion via le vrai formulaire /login (compte User standard : employé ou
 * manager). Le backend distingue le rôle depuis la réponse ; ce même
 * formulaire gère aussi les comptes PartnerUser (voir loginAsPartner).
 */

export async function loginAsUser(page: Page, email: string, password: string): Promise<void> {
    await page.goto("/login");
    await dismissCookieBanner(page);
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: /accéder au dashboard/i }).click();
    // Navigation complète (window.location.href) déclenchée par le formulaire —
    // on attend la sortie de /login plutôt qu'un texte précis de destination,
    // puisque celle-ci dépend du rôle.
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
}

/** Se déconnecte via le bouton présent dans les layouts employé/entreprise (title="Déconnexion"). */
export async function logout(page: Page): Promise<void> {
    // Défensif : une navigation plein-page (window.location.href, comme le login)
    // remonte tout l'arbre React et peut refaire apparaître le bandeau cookies
    // si son acceptation précédente n'a pas eu le temps d'être prise en compte
    // (1er chargement Next.js en mode dev, compilation à la volée plus lente).
    await dismissCookieBanner(page);
    await page.getByTitle("Déconnexion").click();
    await page.waitForURL("**/login");
}

export async function expectToast(page: Page, textPattern: RegExp): Promise<void> {
    await expect(page.getByText(textPattern).first()).toBeVisible({ timeout: 10000 });
}
