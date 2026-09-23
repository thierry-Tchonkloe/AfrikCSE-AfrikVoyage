"use client";

import { motion } from "framer-motion";
import { MapPin, Clock, Pencil, Trash2, ExternalLink, Loader2 } from "lucide-react";
import type { PartnerLocation } from "@/types";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

type Translator = ReturnType<typeof useTranslations<"partnerComponents.locationCard">>;

const getDays = (tr: Translator) => ([tr("mon"), tr("tue"), tr("wed"), tr("thu"), tr("fri"), tr("sat"), tr("sun")]);

export const locationCardVariants = {
    hidden: { opacity: 0, y: 12 },
    show:   { opacity: 1, y: 0 },
};

export function LocationCard({ location, deleting, onEdit, onDelete, onAvailabilities }: {
    location: PartnerLocation;
    deleting: boolean;
    onEdit: (location: PartnerLocation) => void;
    onDelete: (id: string) => void;
    onAvailabilities: (location: PartnerLocation) => void;
}) {
    const tr = useTranslations("partnerComponents.locationCard");
    const DAYS = useMemo(() => getDays(tr), [tr]);
    const t = useTranslations("partnerComponents.locationCard");
    return (
        <motion.div
            variants={locationCardVariants}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25 }}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg will-change-transform"
        >
            {/* Bandeau visuel + actions rapides au survol */}
            <div className="relative h-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
                <MapPin className="h-7 w-7 text-blue-500" />

                {location.isMain && (
                    <span className="absolute top-2.5 left-2.5 text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                        {t("main")}
                    </span>
                )}

                <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onAvailabilities(location)} title={t("openingHours")}
                        className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300 shadow-sm">
                        <Clock size={14} />
                    </button>
                    <button onClick={() => onEdit(location)} title={t("edit")}
                        className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300 shadow-sm">
                        <Pencil size={14} />
                    </button>
                    <button onClick={() => onDelete(location.id)} disabled={deleting} title={t("delete")}
                        className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-900/80 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-600 hover:text-red-500 shadow-sm">
                        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-2">
                <p className="font-display font-semibold text-sm text-gray-900 dark:text-white truncate">{location.name}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{location.address}, {location.city}, {location.country}</p>
                {location.phone && <p className="text-xs text-gray-400">{location.phone}</p>}
                {location.mapsUrl && (
                    <a href={location.mapsUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        {t("viewGoogleMaps")} <ExternalLink size={11} />
                    </a>
                )}

                {location.availabilities && location.availabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                        {DAYS.map((d, i) => {
                            const avail = location.availabilities!.find((a) => a.dayOfWeek === i + 1);
                            const isOpen = avail && !avail.isClosed;
                            return (
                                <span key={d} className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                    isOpen
                                        ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                                }`}>
                                    {d}
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
