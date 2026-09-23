"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { employeeService } from "@/services/employes/employee.service";
import { Plane, FileText, Gift, ChevronRight, Star } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { useDateLocale } from "@/hooks/useDateLocale";

type Translator = ReturnType<typeof useTranslations<"employee.dashboard">>;

interface DashboardData {
    stats: {
        cseBalance: number;
        nextTripDays: number | null;
        nextTripRoute: string | null;
        pendingExpenses: number;
        benefitsUsed: number;
        activeTravels: number;
    };
    nextTravel: {
        destination: string;
        departureDate: string;
        returnDate: string;
    } | null;
    recentActivity: Array<{
        id: string;
        type: "expense" | "travel";
        title: string;
        amount: number;
        status: string;
        createdAt: string;
    }>;
}

const getStatusConfig = (t: Translator): Record<string, { label: string; color: string }> => ({
    APPROVED:    { label: t("approved"),  color: "#10b981" },
    PENDING:     { label: t("pending"), color: "#f59e0b" },
    REJECTED:    { label: t("rejected"),    color: "#ef4444" },
    CANCELLED:   { label: t("cancelled"),    color: "#6b7280" },
    IN_PROGRESS: { label: t("progress"),  color: "#3b82f6" },
    COMPLETED:   { label: t("completed"),   color: "#10b981" },
});

const ACTIVITY_ICONS: Record<DashboardData["recentActivity"][number]["type"], string> = {
    expense: "📋",
    travel:  "✈️",
};

export default function EmployeeDashboardPage() {
    const dateLocale = useDateLocale();
    const tr = useTranslations("employee.dashboard");
    const t = useTranslations("employee.dashboard");
    const formatTimeAgo = useRelativeTime();
    const STATUS_CONFIG = useMemo(() => getStatusConfig(t), [t]);
    const { user } = useAuth();
    const router   = useRouter();
    const [data, setData]     = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        employeeService.getDashboard()
        .then(setData)
        .catch(() => toast.error(t("loadingError")))
        .finally(() => setLoading(false));
    }, []);

    const STAT_CARDS = [
        {
        label: t("cseBalance"),
        value: data ? `${data.stats.cseBalance.toLocaleString()} XOF` : "—",
        sub: t("availableSpend"),
        badge: t("active"),
        badgeColor: "#10b981",
        icon: "💳",
        iconBg: "#f0fdf4",
        },
        {
        label: t("nextTrip"),
        value: data?.stats.nextTripDays != null ? t("d", { nextTripDays: data.stats.nextTripDays }) : "—",
        sub: data?.stats.nextTripRoute ?? t("noUpcomingTrip"),
        badge: t("upcoming"),
        badgeColor: "#3b82f6",
        icon: "✈️",
        iconBg: "#eff6ff",
        },
        {
        label: t("expenseReports"),
        value: data ? String(data.stats.pendingExpenses) : "—",
        sub: t("awaitingApproval"),
        badge: t("pending"),
        badgeColor: "#f59e0b",
        icon: "📋",
        iconBg: "#fffbeb",
        },
        {
        label: t("benefitsUsed"),
        value: data ? String(data.stats.benefitsUsed) : "—",
        sub: t("year"),
        badge: t("cumulative"),
        badgeColor: "#8b5cf6",
        icon: "🎁",
        iconBg: "#f5f3ff",
        },
    ];

    const QUICK_ACCESS = [
        {
        label: t("myBusinessTrips"),
        desc: t("viewManageUpcomingPast"),
        sub: data ? t("activeTrip", { activeTravels: data.stats.activeTravels, p2: data.stats.activeTravels > 1 ? "s" : "" }) : "—",
        subLink: tr("seeAllArrow"),
        icon: Plane,
        href: "/employes/voyages",
        color: "#3b82f6",
        },
        {
        label: t("myExpenseReports"),
        desc: t("submitTrackExpense"),
        sub: data ? t("pending2", { pendingExpenses: data.stats.pendingExpenses }) : "—",
        subLink: tr("seeAllArrow"),
        icon: FileText,
        href: "/employes/notes-de-frais",
        color: "#f59e0b",
        },
        {
        label: t("myCseBenefits"),
        desc: t("exploreEnjoyEmployeeBenefits"),
        sub: data ? t("xofAvailable", { p1: data.stats.cseBalance.toLocaleString() }) : "—",
        subLink: tr("explore"),
        icon: Gift,
        href: "/employes/avantages",
        color: "#10b981",
        },
    ];

    return (
        <div className="space-y-6">
        {/* Bienvenue */}
        <div>
            <h1 className="text-xl font-bold text-gray-900">
            {t("welcomeBack", { firstName: user?.firstName ?? "" })}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
            {t("hereOverviewActivityToday")}
            </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {STAT_CARDS.map((s) => (
            <div key={s.label}
                className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3">
                <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: s.iconBg }}
                >
                    {s.icon}
                </span>
                <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ color: s.badgeColor, background: s.badgeColor + "18" }}
                >
                    {s.badge}
                </span>
                </div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
            ))}
        </div>

        {/* Quick Access */}
        <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">{t("quickAccess")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {QUICK_ACCESS.map((qa) => (
                <div key={qa.label}
                className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                    <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: qa.color + "18" }}
                    >
                    <qa.icon size={20} style={{ color: qa.color }} />
                    </div>
                    <ChevronRight size={18} className="text-gray-300 mt-1" />
                </div>
                <p className="font-semibold text-sm text-gray-900">{qa.label}</p>
                <p className="text-xs text-gray-500 mt-1 flex-1">{qa.desc}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">{qa.sub}</span>
                    <button
                    onClick={() => router.push(qa.href)}
                    className="text-xs font-medium hover:underline"
                    style={{ color: qa.color }}
                    >
                    {qa.subLink}
                    </button>
                </div>
                </div>
            ))}
            </div>
        </div>

        {/* Activité récente + Prochain voyage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Activité */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">{t("recentActivity")}</h3>
                <button
                onClick={() => router.push("/employes/notes-de-frais")}
                className="text-xs hover:underline" style={{ color: "#0f766e" }}>
                {t("seeAll")}
                </button>
            </div>
            <div className="divide-y divide-gray-50">
                {loading ? (
                [...Array(4)].map((_, i) => (
                    <div key={i} className="px-5 py-4 h-14 animate-pulse" />
                ))
                ) : !data?.recentActivity.length ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">
                    {t("noRecentActivity")}
                </div>
                ) : (
                data.recentActivity.map((act) => {
                    const statusInfo = STATUS_CONFIG[act.status] ?? { label: act.status, color: "#6b7280" };
                    return (
                    <div key={act.id} className="px-5 py-4 flex items-start gap-3">
                        <span className="text-xl shrink-0 mt-0.5">{ACTIVITY_ICONS[act.type]}</span>
                        <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-900">{act.title}</p>
                            <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ color: statusInfo.color, background: statusInfo.color + "18" }}
                            >
                            {statusInfo.label}
                            </span>
                        </div>
                        {act.amount > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">{act.amount.toLocaleString()} XOF</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(act.createdAt)}</p>
                        </div>
                    </div>
                    );
                })
                )}
            </div>
            </div>

            {/* Prochain voyage + Offre exclusive */}
            <div className="space-y-4">
            {/* Prochain voyage */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">{t("nextTrip")}</h3>
                {data?.nextTravel ? (
                <>
                    <div className="flex items-center gap-2 mb-3">
                    <Plane size={16} className="text-blue-500" />
                    <p className="text-sm font-medium text-gray-900">
                        {data.nextTravel.destination}
                    </p>
                    </div>
                    <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                        <span className="text-gray-400">{t("departure")}</span>
                        <span>{new Date(data.nextTravel.departureDate).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">{t("return")}</span>
                        <span>{new Date(data.nextTravel.returnDate).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    </div>
                </>
                ) : (
                <div className="text-center py-6">
                    <Plane size={24} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">{t("noUpcomingTrip")}</p>
                </div>
                )}
                <button
                onClick={() => router.push("/employes/voyages")}
                className="w-full mt-4 py-2 rounded-lg text-white text-xs font-medium"
                style={{ background: "#0f766e" }}
                >
                {data?.nextTravel ? t("viewDetails") : t("viewMyTrips")}
                </button>
            </div>

            {/* Offre exclusive */}
            <div
                className="rounded-xl p-5 text-white"
                style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)" }}
            >
                <Star size={20} className="mb-2" />
                <p className="font-bold text-sm">{t("exclusiveOffer")}</p>
                <p className="text-xs opacity-80 mt-1">
                {t("get20OffAll")}
                </p>
                <button
                onClick={() => router.push("/employes/avantages")}
                className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "rgba(255,255,255,0.2)" }}
                >
                {t("learnMore")}
                </button>
            </div>
            </div>
        </div>
        </div>
    );
}