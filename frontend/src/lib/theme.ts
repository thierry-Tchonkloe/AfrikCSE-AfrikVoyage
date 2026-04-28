/**
 * Applique les couleurs du thème dynamiquement sur :root
 * Appelé au chargement et quand le Super Admin change les couleurs
 */
export function applyTheme(colors: {
    primaryColor?: string;
    secondaryColor?: string;
}) {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    if (colors.primaryColor) {
        root.style.setProperty("--color-primary", colors.primaryColor);
        root.style.setProperty(
        "--color-primary-hover",
        lighten(colors.primaryColor, 10)
        );
        root.style.setProperty(
        "--color-primary-light",
        lighten(colors.primaryColor, 45)
        );
    }

    if (colors.secondaryColor) {
        root.style.setProperty("--color-secondary", colors.secondaryColor);
    }
}

/** Éclaircit une couleur hex d'un certain pourcentage */
function lighten(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(2.55 * percent));
    const b = Math.min(255, (num & 0xff) + Math.round(2.55 * percent));
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Bascule dark/light mode */
export function applyDarkMode(dark: boolean) {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", dark);
}