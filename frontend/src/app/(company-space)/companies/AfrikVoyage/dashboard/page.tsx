"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    DollarSign, PieChart, Plane, AlertTriangle,
    MapPin, MoreVertical,
} from "lucide-react";
import { voyageService } from "@/services/companies/voyage.service";
import { toast } from "sonner";

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

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    PENDING: { label: "En attente", color: "#f59e0b" },
    APPROVED: { label: "Approuvé", color: "#10b981" },
    REJECTED: { label: "Rejeté", color: "#ef4444" },
    CANCELLED: { label: "Annulé", color: "#6b7280" },
    IN_PROGRESS: { label: "En cours", color: "#3b82f6" },
    COMPLETED: { label: "Terminé", color: "#10b981" },
};

const DEST_COLORS = ["#0f766e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];

export default function AfrikVoyageDashboard() {
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
            .catch(() => toast.error("Erreur lors du chargement du tableau de bord"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <DashboardSkeleton />;

    const STATS = [
        {
            label: "Dépenses totales voyages",
            value: `${(travelStats?.totalCost ?? 0).toLocaleString()} XOF`,
            sub: `${travelStats?.total ?? 0} voyage(s) au total`,
            badge: `${travelStats?.approved ?? 0} approuvés`,
            badgeColor: "#10b981",
            icon: DollarSign,
            iconBg: "#eff6ff",
            iconColor: "#3b82f6",
        },
        {
            label: "Notes de frais (30 jours)",
            value: `${(expenseStats?.totalAmount ?? 0).toLocaleString()} XOF`,
            sub: `Moyenne ${Math.round(expenseStats?.avgAmount ?? 0).toLocaleString()} XOF / note`,
            badge: `${expenseStats?.totalCount ?? 0} notes`,
            badgeColor: "#f59e0b",
            icon: PieChart,
            iconBg: "#fffbeb",
            iconColor: "#f59e0b",
        },
        {
            label: "Voyages actifs",
            value: String(travelStats?.approved ?? 0),
            sub: `${travelStats?.pending ?? 0} en attente de traitement`,
            badge: "Approuvés",
            badgeColor: "#10b981",
            icon: Plane,
            iconBg: "#f0fdf4",
            iconColor: "#10b981",
        },
        {
            label: "Demandes en attente",
            value: String(approvalStats?.pending ?? 0),
            sub: `Délai moyen de réponse : ${approvalStats?.avgResponseHours ?? 0}h`,
            badge: (approvalStats?.pending ?? 0) > 0 ? "Action requise" : "À jour",
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
        const cat = e.category || "Autre";
        catTotals.set(cat, (catTotals.get(cat) ?? 0) + e.amount);
    });
    const categoryBreakdown = [...catTotals.entries()].sort((a, b) => b[1] - a[1]);
    const maxCat = Math.max(...categoryBreakdown.map(([, v]) => v), 1);

    return (
        <div className="space-y-6">
        {/* ── En-tête ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Tableau de bord de voyage</h1>
            <p className="text-sm text-gray-500">
                Surveillez et gérez les activités de voyage de votre organisation.
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
                {approvalStats!.pending} demande{approvalStats!.pending > 1 ? "s" : ""} de voyage en attente d&#39;approbation
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                Ces demandes nécessitent une revue de la part du management.
                </p>
            </div>
            <button
                onClick={() => router.push("/companies/AfrikVoyage/approbations")}
                className="shrink-0 text-xs px-3 py-2 rounded-lg text-white font-medium bg-red-500"
            >
                Voir les demandes
            </button>
            </div>
        )}

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Répartition des dépenses par catégorie */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="mb-4">
                <h3 className="font-semibold text-gray-900">Répartition des dépenses par catégorie</h3>
                <p className="text-xs text-gray-400">
                Basé sur les {expenses.length} note(s) de frais les plus récentes
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
                        title={`${cat} : ${amount.toLocaleString()} XOF`}
                        />
                        <span className="text-xs text-gray-400 text-center truncate w-full">{cat}</span>
                    </div>
                    );
                })}
                </div>
            ) : (
                <div className="h-32 flex items-center justify-center text-sm text-gray-400">
                Aucune note de frais enregistrée.
                </div>
            )}
            </div>

            {/* Top destinations */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="mb-4">
                <h3 className="font-semibold text-gray-900">Top Destinations</h3>
                <p className="text-xs text-gray-400">
                Destinations les plus coûteuses ({allTravels.length} demande(s) récente(s))
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
                        <span className="text-sm font-semibold text-gray-900">{d.amount.toLocaleString()} XOF</span>
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
                <p className="text-sm text-gray-400 text-center py-6">Aucun voyage enregistré.</p>
            )}
            </div>
        </div>

        {/* ── Demandes récentes ── */}
        <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
                <h3 className="font-semibold text-gray-900">Demandes de voyage récentes</h3>
                <p className="text-xs text-gray-400">
                Dernières soumissions en attente d&#39;approbation ou récemment traitées
                </p>
            </div>
            <button
                onClick={() => router.push("/companies/AfrikVoyage/reservations")}
                className="text-xs font-medium hover:underline flex items-center gap-1"
                style={{ color: "#0f766e" }}>
                View All →
            </button>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-100">
                    {["Traveler", "Destination", "Department", "Travel Dates", "Est. Cost", "Status", "Actions"].map((h) => (
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
                        Aucune demande de voyage pour le moment.
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
                            {departure.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            {" – "}
                            {ret.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </p>
                        <p className="text-xs text-gray-400">{duration} jour{duration > 1 ? "s" : ""}</p>
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                        {cost.toLocaleString()} XOF
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
