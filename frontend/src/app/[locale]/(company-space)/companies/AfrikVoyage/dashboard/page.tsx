"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import {
    DollarSign, PieChart, Plane, AlertTriangle,
    MapPin, MoreVertical,
} from "lucide-react";
import { voyageService } from "@/services/companies/voyage.service";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";

type Translator = ReturnType<typeof useTranslations<"company.afrikvoyageDashboard">>;

interface TravelStats {
    total: number;
    pending: number;
    approved: number;
    totalCost: number;
    co2Emissions: number;
}

interface ApprovalStats {
    pending: number;
    approvedToday: number;
    totalAmount: number;
    avgResponseHours: number;
}

interface ExpenseStats {
    totalAmount: number;
    totalCount: number;
    avgAmount: number;
    co2Emissions: number;
}

interface TravelRequestItem {
    id: string;
    destination: string;
    purpose?: string | null;
    department?: string | null;
    departureDate: string;
    returnDate: string;
    estimatedCost?: number | null;
    actualCost?: number | null;
    status: string;
    requestedBy: {
        firstName: string;
        lastName: string;
        email: string;
        department?: string | null;
        jobTitle?: string | null;
    };
}

interface ExpenseItem {
    id: string;
    category: string | null;
    amount: number;
}

const getStatusLabel = (tr: Translator): Record<string, { label: string; color: string }> => ({
    PENDING: { label: tr("pending"), color: "#f59e0b" },
    APPROVED: { label: tr("approved"), color: "#10b981" },
    REJECTED: { label: tr("rejected"), color: "#ef4444" },
    CANCELLED: { label: tr("cancelled"), color: "#6b7280" },
    IN_PROGRESS: { label: tr("progress"), color: "#3b82f6" },
    COMPLETED: { label: tr("completed"), color: "#10b981" },
});

const DEST_COLORS = ["#0f766e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];

export default function AfrikVoyageDashboard() {
    const dateLocale = useDateLocale();
    const tr = useTranslations("company.afrikvoyageDashboard");
    const STATUS_LABEL = useMemo(() => getStatusLabel(tr), [tr]);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [travelStats, setTravelStats] = useState<TravelStats | null>(null);
    const [approvalStats, setApprovalStats] = useState<ApprovalStats | null>(null);
    const [expenseStats, setExpenseStats] = useState<ExpenseStats | null>(null);
    const [recentTravels, setRecentTravels] = useState<TravelRequestItem[]>([]);
    const [allTravels, setAllTravels] = useState<TravelRequestItem[]>([]);
    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

    useEffect(() => {
        Promise.allSettled([
            voyageService.getTravelStats(),
            voyageService.getApprovalStats(),
            voyageService.getExpenseStats(),
            voyageService.getTravels({ limit: 5 }),
            voyageService.getTravels({ limit: 50 }),
            voyageService.getExpenses({ limit: 100 }),
        ])
            .then(([stats, approvals, exp, recent, all, expensesRes]) => {
                if (stats.status === "fulfilled") setTravelStats(stats.value);
                if (approvals.status === "fulfilled") setApprovalStats(approvals.value);
                if (exp.status === "fulfilled") setExpenseStats(exp.value);
                if (recent.status === "fulfilled") setRecentTravels(recent.value?.data ?? []);
                if (all.status === "fulfilled") setAllTravels(all.value?.data ?? []);
                if (expensesRes.status === "fulfilled") setExpenses(expensesRes.value?.data ?? []);
            })
            .catch(() => toast.error(tr("errorLoadingDashboard")))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <DashboardSkeleton />;

    const STATS = [
        {
            label: tr("totalTravelSpending"),
            value: formatCurrency(travelStats?.totalCost ?? 0, undefined, dateLocale),
            sub: tr("tripSTotal", { p1: travelStats?.total ?? 0 }),
            badge: tr("approved2", { p1: travelStats?.approved ?? 0 }),
            badgeColor: "#10b981",
            icon: DollarSign,
            iconBg: "#eff6ff",
            iconColor: "#3b82f6",
        },
        {
            label: tr("expenseReports30Days"),
            value: formatCurrency(expenseStats?.totalAmount ?? 0, undefined, dateLocale),
            sub: tr("averageReport", { p1: formatCurrency(Math.round(expenseStats?.avgAmount ?? 0), undefined, dateLocale) }),
            badge: tr("reports", { p1: expenseStats?.totalCount ?? 0 }),
            badgeColor: "#f59e0b",
            icon: PieChart,
            iconBg: "#fffbeb",
            iconColor: "#f59e0b",
        },
        {
            label: tr("activeTrips"),
            value: String(travelStats?.approved ?? 0),
            sub: tr("awaitingProcessing", { p1: travelStats?.pending ?? 0 }),
            badge: tr("approved3"),
            badgeColor: "#10b981",
            icon: Plane,
            iconBg: "#f0fdf4",
            iconColor: "#10b981",
        },
        {
            label: tr("pendingRequests"),
            value: String(approvalStats?.pending ?? 0),
            sub: tr("averageResponseTimeH", { p1: approvalStats?.avgResponseHours ?? 0 }),
            badge: (approvalStats?.pending ?? 0) > 0 ? tr("actionRequired") : tr("upDate"),
            badgeColor: (approvalStats?.pending ?? 0) > 0 ? "#ef4444" : "#10b981",
            icon: AlertTriangle,
            iconBg: "#fef2f2",
            iconColor: "#ef4444",
        },
    ];

    // ── Top destinations (agrégation des voyages récents) ──
    const destTotals = new Map<string, number>();
    allTravels.forEach((t) => {
        const cost = t.actualCost ?? t.estimatedCost ?? 0;
        destTotals.set(t.destination, (destTotals.get(t.destination) ?? 0) + cost);
    });
    const topDestinations = [...destTotals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([city, amount], i) => ({ city, amount, color: DEST_COLORS[i % DEST_COLORS.length] }));
    const maxDest = Math.max(...topDestinations.map((d) => d.amount), 1);

    // ── Répartition des notes de frais par catégorie ──
    const catTotals = new Map<string, number>();
    expenses.forEach((e) => {
        const cat = e.category || tr("other");
        catTotals.set(cat, (catTotals.get(cat) ?? 0) + e.amount);
    });
    const categoryBreakdown = [...catTotals.entries()].sort((a, b) => b[1] - a[1]);
    const maxCat = Math.max(...categoryBreakdown.map(([, v]) => v), 1);

    return (
        <div className="space-y-6">
        {/* ── En-tête ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">{tr("travelDashboard")}</h1>
            <p className="text-sm text-gray-500">
                {tr("monitorManageOrganizations")}
            </p>
            </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {STATS.map((s) => (
            <div key={s.label}
                className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: s.iconBg }}>
                    <s.icon size={20} style={{ color: s.iconColor }} />
                </div>
                <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: s.badgeColor, background: s.badgeColor + "18" }}
                >
                    {s.badge}
                </span>
                </div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </div>
            ))}
        </div>

        {/* ── Alerte demandes en attente ── */}
        {(approvalStats?.pending ?? 0) > 0 && (
            <div
            className="flex items-start gap-3 p-4 rounded-xl border"
            style={{ background: "#fef2f2", borderColor: "#fca5a5" }}
            >
            <AlertTriangle size={20} style={{ color: "#ef4444" }} className="shrink-0 mt-0.5" />
            <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">
                {tr("travelRequestAwaiting", { pending: approvalStats!.pending, p2: approvalStats!.pending > 1 ? "s" : "" })}
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                {tr("theseRequestsRequireReview")}
                </p>
            </div>
            <button
                onClick={() => router.push("/companies/AfrikVoyage/approbations")}
                className="shrink-0 text-xs px-3 py-2 rounded-lg text-white font-medium bg-red-500"
            >
                {tr("viewRequests")}
            </button>
            </div>
        )}

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Répartition des dépenses par catégorie */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="mb-4">
                <h3 className="font-semibold text-gray-900">{tr("spendingBreakdownCategory")}</h3>
                <p className="text-xs text-gray-400">
                {tr("basedMostRecentExpense", { length: expenses.length })}
                </p>
            </div>
            {categoryBreakdown.length > 0 ? (
                <div className="flex items-end gap-2 h-32 overflow-x-auto">
                {categoryBreakdown.map(([cat, amount]) => {
                    const h = Math.max(4, (amount / maxCat) * 110);
                    return (
                    <div key={cat} className="flex-1 min-w-14 flex flex-col items-center gap-1">
                        <div
                        className="w-full rounded-t-md transition-all"
                        style={{ height: `${h}px`, background: "#0f766e", opacity: 0.8 }}
                        title={`${cat} : ${formatCurrency(amount, undefined, dateLocale)}`}
                        />
                        <span className="text-xs text-gray-400 text-center truncate w-full">{cat}</span>
                    </div>
                    );
                })}
                </div>
            ) : (
                <div className="h-32 flex items-center justify-center text-sm text-gray-400">
                {tr("noExpenseReportsRecorded")}
                </div>
            )}
            </div>

            {/* Top destinations */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="mb-4">
                <h3 className="font-semibold text-gray-900">{tr("topDestinations")}</h3>
                <p className="text-xs text-gray-400">
                {tr("mostExpensiveDestinations", { length: allTravels.length })}
                </p>
            </div>
            {topDestinations.length > 0 ? (
                <div className="space-y-4">
                {topDestinations.map((d) => (
                    <div key={d.city} className="space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                        <MapPin size={14} style={{ color: d.color }} />
                        <span className="text-sm text-gray-700">{d.city}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(d.amount, undefined, dateLocale)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.round((d.amount / maxDest) * 100)}%`, background: d.color }}
                        />
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                <p className="text-sm text-gray-400 text-center py-6">{tr("noTripsRecorded")}</p>
            )}
            </div>
        </div>

        {/* ── Demandes récentes ── */}
        <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
                <h3 className="font-semibold text-gray-900">{tr("recentTravelRequests")}</h3>
                <p className="text-xs text-gray-400">
                {tr("latestSubmissionsAwaiting")}
                </p>
            </div>
            <button
                onClick={() => router.push("/companies/AfrikVoyage/reservations")}
                className="text-xs font-medium hover:underline flex items-center gap-1"
                style={{ color: "#0f766e" }}>
                {tr("viewAll")}
            </button>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-100">
                    {[tr("traveler"), tr("destination"), tr("department"), tr("travelDates"), tr("estCost"), tr("status"), tr("actions")].map((h) => (
                    <th key={h}
                        className="text-left text-xs text-gray-500 font-medium px-5 py-3">
                        {h}
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {recentTravels.length === 0 ? (
                    <tr>
                    <td colSpan={7} className="px-5 py-6 text-center text-sm text-gray-400">
                        {tr("noTravelRequestsMoment")}
                    </td>
                    </tr>
                ) : recentTravels.map((r) => {
                    const st = STATUS_LABEL[r.status] ?? { label: r.status, color: "#6b7280" };
                    const cost = r.actualCost ?? r.estimatedCost ?? 0;
                    const departure = new Date(r.departureDate);
                    const ret = new Date(r.returnDate);
                    const duration = Math.max(1, Math.round((ret.getTime() - departure.getTime()) / 86_400_000));
                    return (
                    <tr key={r.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                            <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: "#0f766e" }}
                            >
                            {(r.requestedBy.firstName[0] ?? "") + (r.requestedBy.lastName[0] ?? "")}
                            </div>
                            <div>
                            <p className="text-sm font-medium text-gray-900">
                                {r.requestedBy.firstName} {r.requestedBy.lastName}
                            </p>
                            <p className="text-xs text-gray-400">{r.requestedBy.email}</p>
                            </div>
                        </div>
                        </td>
                        <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900">{r.destination}</p>
                        <p className="text-xs text-gray-400">{r.purpose ?? "—"}</p>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">
                        {r.requestedBy.department ?? r.department ?? "—"}
                        </td>
                        <td className="px-5 py-3">
                        <p className="text-xs text-gray-700">
                            {departure.toLocaleDateString(dateLocale, { day: "numeric", month: "short" })}
                            {" – "}
                            {ret.toLocaleDateString(dateLocale, { day: "numeric", month: "short" })}
                        </p>
                        <p className="text-xs text-gray-400">{tr("day", { duration, p2: duration > 1 ? "s" : "" })}</p>
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                        {formatCurrency(cost, undefined, dateLocale)}
                        </td>
                        <td className="px-5 py-3">
                        <span
                            className="flex items-center gap-1.5 text-xs font-medium"
                            style={{ color: st.color }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full"
                            style={{ background: st.color }} />
                            {st.label}
                        </span>
                        </td>
                        <td className="px-5 py-3">
                        <button
                            onClick={() => router.push("/companies/AfrikVoyage/approbations")}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400">
                            <MoreVertical size={16} />
                        </button>
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

function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-white rounded-xl border border-gray-200 w-1/2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-28" />
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 h-56" />
            <div className="bg-white rounded-xl border border-gray-200 h-56" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 h-64" />
        </div>
    );
}
