// Liste unique des départements — auparavant dupliquée avec des valeurs
// différentes dans 7 fichiers (formulaires d'inscription, profils employés,
// gestion des utilisateurs, politiques de voyage, filtres AfrikVoyage), ce
// qui pouvait rendre un employé invisible à un filtre écrit différemment
// (ex: "Tech" vs "Technologie" vs "Technologie & IT"). `User.department`
// reste un champ texte libre côté base (pas d'enum Prisma) — cette constante
// est donc la seule source de vérité côté frontend, à utiliser PARTOUT où un
// département est saisi ou filtré, pour que la valeur stockée soit toujours
// identique d'un écran à l'autre.
export const DEPARTMENTS = [
    "Direction",
    "Ressources Humaines",
    "Finance & Comptabilité",
    "Commercial & Ventes",
    "Marketing",
    "Technologie & IT",
    "Opérations",
    "Juridique",
    "Communication",
    "Autre",
] as const;

export type Department = (typeof DEPARTMENTS)[number];
