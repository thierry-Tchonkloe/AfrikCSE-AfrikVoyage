"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Euro, Users, Clock, AlertTriangle,
    TrendingUp, CheckCircle, XCircle,
} from "lucide-react";
import { cseService } from "@/services/companies/cse.service";
import { toast } from "sonner";

interface BudgetReport {
    year: number;
    totalBudget: number;
    usedBudget: number;
    activeEmployees: number;
    categories: { id: string; name: string; budget: number; used: number }[];
    quarters: { quarter: string; budget: number; actual: number }[];
    participation: { active: number; pending: number; inactive: number };
}

interface ApprovalStats {
    pending: number;
    approvedToday: number;
    totalAmount: number;
    avgResponseHours: number;
}

interface CategoryUsage {
    id: string;
    name: string;
    icon?: string | null;
    annualBudget: number;
    budgetUsed: number;
    _count: { requests: number };
}

interface ComplianceItem {
    id: string;
    label: string;
    status: string;
}

interface Alert {
    type: "error" | "warning" | "info";
    title: string;
    desc: string;
    color: string;
    bg: string;
}

export default function AfrikCSEDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [budgetReport, setBudgetReport] = useState<BudgetReport | null>(null);
    const [approvalStats, setApprovalStats] = useState<ApprovalStats | null>(null);
    const [categories, setCategories] = useState<CategoryUsage[]>([]);
    const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);

    useEffect(() => {
        Promise.allSettled([
            cseService.getBudgetReport(),
            cseService.getApprovalStats(),
            cseService.getCategories(),
            cseService.getComplianceReport(),
        ])
            .then(([budget, approvals, cats, compliance]) => {
                if (budget.status === "fulfilled") setBudgetReport(budget.value);
                if (approvals.status === "fulfilled") setApprovalStats(approvals.value);
                if (cats.status === "fulfilled") setCategories(cats.value);
                if (compliance.status === "fulfilled") setComplianceItems(compliance.value?.items ?? []);
            })
            .catch(() => toast.error("Erreur lors du chargement du tableau de bord"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <DashboardSkeleton />;

    const pctUsed = budgetReport && budgetReport.totalBudget > 0
        ? Math.min(100, Math.round((budgetReport.usedBudget / budgetReport.totalBudget) * 100))
        : 0;

    const STATS = [
        {
            label: "Budget CSE Total",
            value: `${(budgetReport?.totalBudget ?? 0).toLocaleString()} XOF`,
            sub: `Exercice ${budgetReport?.year ?? new Date().getFullYear()}`,
            subColor: "#10b981",
            icon: Euro,
            iconBg: "#eff6ff",
            iconColor: "#3b82f6",
        },
        {
            label: "Budget utilisé",
            value: `${(budgetReport?.usedBudget ?? 0).toLocaleString()} XOF`,
            sub: `${pctUsed}% du budget total`,
            subColor: "#f59e0b",
            icon: TrendingUp,
            iconBg: "#fffbeb",
            iconColor: "#f59e0b",
        },
        {
            label: "Employés actifs",
            value: String(budgetReport?.activeEmployees ?? 0),
            sub: `${budgetReport?.participation.active ?? 0} avec demande approuvée`,
            subColor: "#10b981",
            icon: Users,
            iconBg: "#f0fdf4",
            iconColor: "#10b981",
        },
        {
            label: "Demandes en attente",
            value: approvalStats ? String(approvalStats.pending) : "—",
            sub: approvalStats && approvalStats.pending > 0 ? "Nécessite une action" : "Aucune demande en attente",
            subColor: approvalStats && approvalStats.pending > 0 ? "#ef4444" : "#10b981",
            icon: AlertTriangle,
            iconBg: "#fef2f2",
            iconColor: "#ef4444",
        },
    ];

    // Top 3 avantages par dépense
    const topCategories = [...categories]
        .sort((a, b) => b.budgetUsed - a.budgetUsed)
        .slice(0, 3);

    // Alertes dynamiques basées sur le budget, les approbations et la conformité
    const alerts: Alert[] = [];
    budgetReport?.categories.forEach((cat) => {
        if (cat.budget > 0) {
            const pct = (cat.used / cat.budget) * 100;
            if (pct >= 85) {
                alerts.push({
                    type: "error",
                    title: "Alerte Budget",
                    desc: `Le budget « ${cat.name} » est utilisé à ${Math.round(pct)}%. Pensez à revoir les allocations.`,
                    color: "#ef4444",
                    bg: "#fef2f2",
                });
            }
        }
    });
    if (approvalStats && approvalStats.pending > 0) {
        alerts.push({
            type: "warning",
            title: "Demandes en attente",
            desc: `${approvalStats.pending} demande(s) d'avantages en attente de votre approbation.`,
            color: "#f59e0b",
            bg: "#fffbeb",
        });
    }
    complianceItems.forEach((item) => {
        if (item.status === "NON_CONFORME") {
            alerts.push({
                type: "error",
                title: "Non-conformité",
                desc: `« ${item.label} » nécessite une mise en conformité.`,
                color: "#ef4444",
                bg: "#fef2f2",
            });
        }
    });
    if (alerts.length === 0) {
        alerts.push({
            type: "info",
            title: "Tout est sous contrôle",
            desc: "Aucune alerte active pour le moment.",
            color: "#3b82f6",
            bg: "#eff6ff",
        });
    }

    const quarters = budgetReport?.quarters ?? [];
    const maxQuarter = Math.max(...quarters.flatMap((q) => [q.budget, q.actual]), 1);

    return (
        <div className="space-y-6">
        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {STATS.map((s) => (
            <div key={s.label}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: s.iconBg }}>
                <s.icon size={22} style={{ color: s.iconColor }} />
                </div>
                <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: s.subColor }}>
                    {s.sub}
                </p>
                </div>
            </div>
            ))}
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Donut chart budget */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Aperçu de l&#39;utilisation du budget</h3>
                <span className="text-xs text-gray-400">Exercice {budgetReport?.year ?? new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center justify-center gap-8">
                {/* Cercle CSS */}
                <div className="relative w-40 h-40 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {/* Fond */}
                    <circle cx="50" cy="50" r="40"
                    fill="none" stroke="#e5e7eb" strokeWidth="20" />
                    {/* Utilisé */}
                    <circle cx="50" cy="50" r="40"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="20"
                    strokeDasharray={`${pctUsed * 2.513} ${251.3}`}
                    strokeLinecap="butt"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{pctUsed}%</span>
                    <span className="text-xs text-gray-400">Utilisé</span>
                </div>
                </div>
                {/* Légende */}
                <div className="space-y-2">
                {[
                    { label: "Budget utilisé", color: "#f59e0b", pct: `${pctUsed}%` },
                    { label: "Budget restant", color: "#e5e7eb", pct: `${100 - pctUsed}%` },
                ].map((l) => (
                    <div key={l.label} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-sm shrink-0"
                        style={{ background: l.color }} />
                    <span className="text-gray-600">{l.label}</span>
                    <span className="font-semibold text-gray-900 ml-auto pl-4">{l.pct}</span>
                    </div>
                ))}
                </div>
            </div>
            </div>

            {/* Bar chart budget vs dépenses par trimestre */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Budget vs dépenses par trimestre</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#e5e7eb" }} /> Budget
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#0f766e" }} /> Dépenses
                </span>
                </div>
            </div>
            {quarters.length > 0 ? (
                <div className="flex items-end justify-between gap-4 h-40 px-2">
                {quarters.map((q) => (
                    <div key={q.quarter} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="flex items-end gap-1 h-32 w-full justify-center">
                        <div className="w-5 rounded-t-sm" style={{
                        height: `${Math.max(4, (q.budget / maxQuarter) * 120)}px`,
                        background: "#e5e7eb",
                        }} title={`Budget : ${q.budget.toLocaleString()} XOF`} />
                        <div className="w-5 rounded-t-sm" style={{
                        height: `${Math.max(4, (q.actual / maxQuarter) * 120)}px`,
                        background: "#0f766e",
                        }} title={`Dépenses : ${q.actual.toLocaleString()} XOF`} />
                    </div>
                    <span className="text-xs text-gray-400">{q.quarter}</span>
                    </div>
                ))}
                </div>
            ) : (
                <div className="h-40 flex items-center justify-center text-sm text-gray-400">
                Pas encore de données
                </div>
            )}
            </div>
        </div>

        {/* ── Avantages populaires + Alertes ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Avantages populaires */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Avantages populaires</h3>
                <button
                onClick={() => router.push("/companies/AfrikCSE/budget")}
                className="text-xs font-medium hover:underline"
                style={{ color: "var(--color-primary)" }}>
                View all
                </button>
            </div>
            {topCategories.length > 0 ? (
                <div className="space-y-4">
                {topCategories.map((a) => (
                    <div key={a.id} className="flex items-center gap-3">
                    <span className="text-2xl">{a.icon || "🎁"}</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{a.name}</p>
                        <p className="text-xs text-gray-500">
                        {a._count.requests} demande{a._count.requests !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{a.budgetUsed.toLocaleString()} XOF</p>
                        <p className="text-xs text-gray-400">Total dépensé</p>
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                <p className="text-sm text-gray-400 text-center py-6">Aucune catégorie configurée.</p>
            )}
            </div>

            {/* Alertes & mises à jour */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Alertes & mises à jour</h3>
            <div className="space-y-3">
                {alerts.map((alert, i) => (
                <div key={i}
                    className="p-3 rounded-xl"
                    style={{ background: alert.bg }}>
                    <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: alert.color }}>
                        {alert.type === "error" && <XCircle size={10} className="text-white" />}
                        {alert.type === "warning" && <Clock size={10} className="text-white" />}
                        {alert.type === "info" && <CheckCircle size={10} className="text-white" />}
                    </div>
                    <div>
                        <p className="text-xs font-semibold" style={{ color: alert.color }}>
                        {alert.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">{alert.desc}</p>
                    </div>
                    </div>
                </div>
                ))}
            </div>
            <button
                onClick={() => router.push("/companies/AfrikCSE/avantages")}
                className="w-full mt-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "#0f766e" }}
            >
                Voir toutes les approbations
            </button>
            </div>
        </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-24" />
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 h-64" />
            <div className="bg-white rounded-xl border border-gray-200 h-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 h-56" />
            <div className="bg-white rounded-xl border border-gray-200 h-56" />
        </div>
        </div>
    );
}
