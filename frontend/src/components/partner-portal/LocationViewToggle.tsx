"use client";

import { motion } from "framer-motion";
import { LayoutGrid, List } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"partnerComponents.locationViewToggle">>;

const getOptions = (t: Translator) => ([
    { key: "grid" as const, icon: LayoutGrid, label: t("mapView") },
    { key: "list" as const, icon: List, label: t("listView") },
]);

export type LocationViewMode = "grid" | "list";

export function LocationViewToggle({ mode, onChange }: { mode: LocationViewMode; onChange: (mode: LocationViewMode) => void }) {
    const t = useTranslations("partnerComponents.locationViewToggle");
    const OPTIONS = useMemo(() => getOptions(t), [t]);
    return (
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
            {OPTIONS.map(({ key, icon: Icon, label }) => (
                <button
                    key={key}
                    onClick={() => onChange(key)}
                    aria-label={label}
                    title={label}
                    className="relative px-2.5 py-1.5 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
                    style={mode === key ? { color: "white" } : undefined}
                >
                    {mode === key && (
                        <motion.div
                            layoutId="location-view-toggle-indicator"
                            className="absolute inset-0 rounded-lg -z-10"
                            style={{ background: "var(--color-primary)" }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                    )}
                    <Icon size={16} />
                </button>
            ))}
        </div>
    );
}
