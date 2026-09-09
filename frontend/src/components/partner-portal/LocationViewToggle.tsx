"use client";

import { motion } from "framer-motion";
import { LayoutGrid, List } from "lucide-react";

const OPTIONS = [
    { key: "grid" as const, icon: LayoutGrid, label: "Vue carte" },
    { key: "list" as const, icon: List, label: "Vue liste" },
];

export type LocationViewMode = "grid" | "list";

export function LocationViewToggle({ mode, onChange }: { mode: LocationViewMode; onChange: (mode: LocationViewMode) => void }) {
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
