"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import {
    Building2, Clock, CheckCircle, XCircle, Plus, Download, Settings, Eye
} from "lucide-react";
import { adminService } from "@/services/admin/admin.service";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";

type Translator = ReturnType<typeof useTranslations<"admin.dashboard">>;

interface DashboardData {
    stats: {
        total: number;
        pending: number;
        active: number;
        suspended: number;
        totalUsers: number;
    };
    recent: Array<{
        id: string;
        name: string;
        businessEmail: string;
        status: string;
        hasCSE: boolean;
        hasVoyage: boolean;
        createdAt: string;
    }>;
    monthly: Array<{ month: string; count: number }>;
}

const getStatusLabel = (t: Translator): Record<string, { label: string; color: string }> => ({
    PENDING: { label: t("pending"), color: "#f59e0b" },
    ACTIVE: { label: t("active"), color: "#10b981" },
    SUSPENDED: { label: t("suspended"), color: "#ef4444" },
    REJECTED: { label: t("rejected"), color: "#6b7280" },
});

export default function DashboardPage() {
    const dateLocale = useDateLocale();
    const t = useTranslations("admin.dashboard");
    const STATUS_LABEL = useMemo(() => getStatusLabel(t), [t]);
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminService
        .getDashboard()
        .then(setData)
        .catch(() => toast.error(t("errorLoadingDashboard")))
        .finally(() => setLoading(false));
    }, []);

    if (loading) return <DashboardSkeleton />;
    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-center text-sm text-gray-500">
                <p>{t("unableLoadDashboard")}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ background: "var(--color-primary)" }}
                >
                    {t("tryAgain")}
                </button>
            </div>
        );
    }

    const { stats, recent, monthly } = data;

    // Calcul du max pour le mini chart
    const maxCount = Math.max(...monthly.map((m) => m.count), 1);

    const STAT_CARDS = [
        {
        label: t("totalCompanies"),
        value: stats.total,
        sub: t("text12Month"),
        icon: Building2,
        iconBg: "#eff6ff",
        iconColor: "#3b82f6",
        subColor: "#10b981",
        },
        {
        label: t("awaitingValidation"),
        value: stats.pending,
        sub: t("actionRequired"),
        icon: Clock,
        iconBg: "#fffbeb",
        iconColor: "#f59e0b",
        subColor: "#f59e0b",
        },
        {
        label: t("activeCompanies"),
        value: stats.active,
        sub: t("total", { p1: stats.total ? Math.round((stats.active / stats.total) * 100) : 0 }),
        icon: CheckCircle,
        iconBg: "#f0fdf4",
        iconColor: "#10b981",
        subColor: "#10b981",
        },
        {
        label: t("suspendedCompanies"),
        value: stats.suspended,
        sub: t("total", { p1: stats.total ? Math.round((stats.suspended / stats.total) * 100) : 0 }),
        icon: XCircle,
        iconBg: "#fef2f2",
        iconColor: "#ef4444",
        subColor: "#ef4444",
        },
    ];

    const QUICK_ACTIONS = [
        {
        label: t("viewPendingRequests"),
        icon: Clock,
        bg: "#f59e0b",
        href: "/admin/validations",
        },
        {
        label: t("createCompany"),
        icon: Plus,
        bg: "#1e293b",
        href: "/admin/companies/new",
        },
        {
        label: t("exportData"),
        icon: Download,
        bg: "#10b981",
        href: "#",
        },
        {
        label: t("systemSettings"),
        icon: Settings,
        bg: "#6366f1",
        href: "/admin/settings",
        },
    ];

    return (
        <div className="space-y-6">
        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {STAT_CARDS.map((card) => (
            <div
                key={card.label}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4"
            >
                <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: card.iconBg }}
                >
                <card.icon size={22} style={{ color: card.iconColor }} />
                </div>
                <div>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                    {card.value.toLocaleString()}
                </p>
                <p className="text-xs mt-0.5" style={{ color: card.subColor }}>
                    {card.sub}
                </p>
                </div>
            </div>
            ))}
        </div>

        {/* ── Chart + Actions rapides ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Mini bar chart inscriptions */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                <h3 className="font-semibold text-gray-900">{t("registrationTrends")}</h3>
                <p className="text-xs text-gray-500">{t("last12Months")}</p>
                </div>
            </div>
            <div className="flex items-end gap-1.5 h-36">
                {monthly.length > 0 ? (
                monthly.map((m) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div
                        className="w-full rounded-t-sm transition-all"
                        style={{
                        height: `${Math.max(4, (m.count / maxCount) * 120)}px`,
                        background: "var(--color-primary)",
                        opacity: 0.85,
                        }}
                        title={`${m.month} : ${m.count}`}
                    />
                    <span className="text-gray-400 hidden sm:block"
                        style={{ fontSize: "9px" }}>
                        {m.month.slice(5)}
                    </span>
                    </div>
                ))
                ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                    {t("noDataYet")}
                </div>
                )}
            </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">{t("quickActions")}</h3>
            <div className="space-y-2.5">
                {QUICK_ACTIONS.map((action) => (
                <button
                    key={action.label}
                    onClick={() => router.push(action.href)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
                    style={{ background: action.bg }}
                >
                    <action.icon size={16} />
                    {action.label}
                </button>
                ))}
            </div>
            </div>
        </div>

        {/* ── Dernières inscriptions ── */}
        <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">{t("latestRegistrations")}</h3>
            <button
                onClick={() => router.push("/admin/companies")}
                className="text-sm hover:underline"
                style={{ color: "var(--color-primary)" }}
            >
                {t("seeAll")}
            </button>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-100">
                    {[t("company"), t("requestedModule"), t("status"), t("date"), t("actions")].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">
                        {h}
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {recent.map((org) => {
                    const st = STATUS_LABEL[org.status];
                    return (
                    <tr key={org.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                            <OrgAvatar name={org.name} />
                            <div>
                            <p className="text-sm font-medium text-gray-900">{org.name}</p>
                            <p className="text-xs text-gray-500">{org.businessEmail}</p>
                            </div>
                        </div>
                        </td>
                        <td className="px-5 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                            {org.hasCSE && <ModuleBadge label={t("afrikcse")} color="#0f766e" />}
                            {org.hasVoyage && <ModuleBadge label={t("afrikvoyage")} color="#f59e0b" />}
                            {!org.hasCSE && !org.hasVoyage && (
                            <span className="text-xs text-gray-400">—</span>
                            )}
                        </div>
                        </td>
                        <td className="px-5 py-3">
                        <span
                            className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{ color: st.color, background: st.color + "18" }}
                        >
                            {st.label}
                        </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                        {new Date(org.createdAt).toLocaleDateString(dateLocale, {
                            day: "numeric", month: "short", year: "numeric",
                        })}
                        </td>
                        <td className="px-5 py-3">
                        <div className="flex gap-2">
                            {org.status === "PENDING" && (
                            <button
                                onClick={() => router.push("/admin/validations")}
                                className="text-xs font-medium hover:underline"
                                style={{ color: "var(--color-primary)" }}
                            >
                                {t("validate")}
                            </button>
                            )}
                            <button
                            onClick={() => router.push(`/admin/companies/${org.id}`)}
                            className="text-xs font-medium text-gray-500 hover:underline flex items-center gap-1"
                            >
                            <Eye size={12} /> {t("view")}
                            </button>
                        </div>
                        </td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
            </div>
        </div>
        </div>
    );
}

// ── Composants utilitaires ──

function OrgAvatar({ name }: { name: string }) {
    const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#0f766e"];
    const color = colors[name.charCodeAt(0) % colors.length];
    return (
        <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: color }}
        >
            {initials}
        </div>
    );
}

function ModuleBadge({ label, color }: { label: string; color: string }) {
    return (
        <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{ color, background: color + "18" }}
        >
            {label}
        </span>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border h-24" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-xl border h-56" />
                <div className="bg-white rounded-xl border h-56" />
            </div>
            <div className="bg-white rounded-xl border h-64" />
        </div>
    );
    }