/** Devise par défaut de la plateforme — aucune organisation n'utilise une autre devise à ce jour. */
export const DEFAULT_CURRENCY = "XOF";

/**
 * Formate un montant avec son code devise, en tolérant les champs qui n'ont
 * pas de devise propre en base (ex: TravelRequest.estimatedCost, ExpenseReport.amount)
 * — dans ce cas on retombe sur DEFAULT_CURRENCY plutôt que d'inventer un symbole.
 */
export function formatCurrency(amount: number | string | null | undefined, currencyCode: string = DEFAULT_CURRENCY, locale: string = "fr-FR"): string {
    const n = typeof amount === "string" ? parseFloat(amount) : amount;
    if (n === null || n === undefined || Number.isNaN(n)) return `— ${currencyCode}`;
    return `${n.toLocaleString(locale)} ${currencyCode}`;
}
