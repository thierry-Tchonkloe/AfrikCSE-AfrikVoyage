"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";

// Les valeurs (stockées / envoyées à l'API) restent en français ; seul le libellé affiché est traduit.
const OPTION_KEYS = {
    "Technologie": "technology",
    "Technology & Software": "technologySoftware",
    "Finance": "finance",
    "Santé": "health",
    "Éducation": "education",
    "Commerce": "commerce",
    "Industrie": "industry",
    "Transport": "transport",
    "Agriculture": "agriculture",
    "Services": "services",
    "Autre": "other",
    "Restauration": "catering",
    "Hôtellerie": "hospitality",
    "Loisirs": "leisure",
    "Culture": "culture",
    "Sport": "sport",
    "Bien-être": "wellness",
    "Hébergement": "accommodation",
    "Fournitures": "supplies",
    "Communication": "communication",
    "Formation": "training",
    "Représentation": "representation",
    "Économique": "economy",
    "Compacte": "compact",
    "SUV": "suv",
    "Luxe": "luxury",
    "Utilitaire": "utility",
    "Temps réel": "realTime",
    "Toutes les heures": "hourly",
    "Quotidien": "daily",
    "Hebdomadaire": "weekly",
    "Aucune préférence": "noPreference",
    "Direction": "management",
    "Ressources Humaines": "humanResources",
    "Finance & Comptabilité": "financeAccounting",
    "Commercial & Ventes": "salesCommercial",
    "Marketing": "marketing",
    "Technologie & IT": "technologyIt",
    "Opérations": "operations",
    "Juridique": "legal",
} as const;

type OptionKey = (typeof OPTION_KEYS)[keyof typeof OPTION_KEYS];

export function useOptionLabel() {
    const t = useTranslations("common.options");
    return useCallback(
        (value: string): string => {
            if (!Object.prototype.hasOwnProperty.call(OPTION_KEYS, value)) return value;
            const key: OptionKey = OPTION_KEYS[value as keyof typeof OPTION_KEYS];
            return t(key);
        },
        [t]
    );
}
