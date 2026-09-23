"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";

export function useRelativeTime() {
    const t = useTranslations("common.relativeTime");
    return useCallback(
        (iso: string): string => {
            const diff = (Date.now() - new Date(iso).getTime()) / 1000;
            if (diff < 60) return t("justNow");
            if (diff < 3600) return t("minutesAgo", { count: Math.round(diff / 60) });
            if (diff < 86400) return t("hoursAgo", { count: Math.round(diff / 3600) });
            return t("daysAgo", { count: Math.round(diff / 86400) });
        },
        [t]
    );
}
