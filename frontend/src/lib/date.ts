export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

export const TIMEZONES = [
    "Africa/Lome",
    "Africa/Abidjan",
    "Africa/Lagos",
    "Africa/Casablanca",
    "Europe/Paris",
    "Europe/London",
    "America/New_York",
    "UTC",
];

export const DATE_FORMATS: DateFormat[] = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

/** Formate une date selon le fuseau horaire et le format choisis par l'utilisateur. */
export function formatDate(value: string | Date, dateFormat: DateFormat = "DD/MM/YYYY", timezone?: string): string {
    const date = typeof value === "string" ? new Date(value) : value;

    const parts = new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: timezone,
    }).formatToParts(date);

    const day = parts.find((p) => p.type === "day")?.value ?? "";
    const month = parts.find((p) => p.type === "month")?.value ?? "";
    const year = parts.find((p) => p.type === "year")?.value ?? "";

    switch (dateFormat) {
        case "MM/DD/YYYY":
            return `${month}/${day}/${year}`;
        case "YYYY-MM-DD":
            return `${year}-${month}-${day}`;
        default:
            return `${day}/${month}/${year}`;
    }
}
