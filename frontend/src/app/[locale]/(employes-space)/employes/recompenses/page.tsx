"use client";

import { useState, useEffect, useMemo } from "react";
import { Trophy, Loader2, TrendingDown, Star } from "lucide-react";
import { travelRewardsService } from "@/services/employes/travel-rewards.service";
import { TravelReward, RewardStatus } from "@/types";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";

type Translator = ReturnType<typeof useTranslations<"employee.recompenses">>;

const getStatusConfig = (t: Translator): Record<RewardStatus, { label: string; color: string }> => ({
    EARNED:   { label: t("earned"),   color: "bg-green-100 text-green-700" },
    REDEEMED: { label: t("used"),  color: "bg-gray-100 text-gray-500" },
    EXPIRED:  { label: t("expired"),   color: "bg-amber-100 text-amber-600" },
    CANCELLED:{ label: t("cancelled"),   color: "bg-red-100 text-red-500" },
});

const getReasonLabels = (t: Translator): Record<string, string> => ({
    ECONOMY_BOOKING: t("economyBooking"),
    EARLY_BOOKING:   t("earlyBooking"),
    MANUAL:          t("manualAward"),
});

export default function RecompensesPage() {
    const dateLocale = useDateLocale();
    const t = useTranslations("employee.recompenses");
    const STATUS_CONFIG = useMemo(() => getStatusConfig(t), [t]);
    const REASON_LABELS = useMemo(() => getReasonLabels(t), [t]);
    const [rewards, setRewards] = useState<TravelReward[]>([]);
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            travelRewardsService.getMyRewards(),
            travelRewardsService.getBalance(),
        ])
            .then(([r, b]) => { setRewards(r); setBalance(b); })
            .catch(() => toast.error(t("unableLoadRewards")))
            .finally(() => setLoading(false));
    }, []);

    const totalSaved = rewards.reduce((acc, r) => acc + (r.savedAmount ?? 0), 0);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                    <Trophy size={22} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{t("myTravelRewards")}</h1>
                    <p className="text-sm text-gray-500">{t("pointsEarnedBooking")}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Star size={18} className="text-amber-500" />
                                <p className="text-3xl font-bold text-amber-600">{balance ?? 0}</p>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">{t("availablePoints")}</p>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingDown size={18} className="text-green-500" />
                                <p className="text-3xl font-bold text-green-600">
                                    {(totalSaved / 1000).toFixed(0)}k
                                </p>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">{t("xofSaved")}</p>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
                            <p className="text-3xl font-bold text-gray-700 mb-1">
                                {rewards.filter(r => r.status === "EARNED").length}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">{t("activeRewards")}</p>
                        </div>
                    </div>

                    {/* Explication */}
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
                        <p className="font-semibold mb-1">{t("howEarnPoints")}</p>
                        <p className="text-xs text-amber-700">
                            {t.rich("earnPointsExplanation", { strong: (chunks) => <strong>{chunks}</strong> })}
                        </p>
                    </div>

                    {/* Historique */}
                    {rewards.length === 0 ? (
                        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
                            <Trophy size={40} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500 font-medium">{t("noRewardsYet")}</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {t("bookTripsBelowEstimate")}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("history")}</p>
                            {rewards.map(r => {
                                const cfg = STATUS_CONFIG[r.status];
                                return (
                                    <div key={r.id}
                                        className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                            <Star size={18} className="text-amber-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">
                                                {REASON_LABELS[r.reason] ?? r.reason}
                                            </p>
                                            {r.travelRequest && (
                                                <p className="text-xs text-gray-400 truncate">
                                                    {r.travelRequest.destination} · {new Date(r.travelRequest.departureDate).toLocaleDateString(dateLocale)}
                                                </p>
                                            )}
                                            {r.savedAmount != null && (
                                                <p className="text-xs text-green-600 font-medium mt-0.5">
                                                    {t("saved", { p1: r.savedAmount.toLocaleString(dateLocale), currency: r.currency })}
                                                </p>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-lg font-bold text-amber-600">{t("pts", { points: r.points })}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
