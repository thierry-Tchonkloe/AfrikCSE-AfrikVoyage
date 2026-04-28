"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Building2, Clock, CheckCircle, XCircle, Plus, Download, Settings, Eye
} from "lucide-react";
import { adminService } from "@/services/admin/admin.service";
import { toast } from "sonner";

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

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    PENDING: { label: "En attente", color: "#f59e0b" },
    ACTIVE: { label: "Actif", color: "#10b981" },
    SUSPENDED: { label: "Suspendu", color: "#ef4444" },
    REJECTED: { label: "Refusé", color: "#6b7280" },
};

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminService
        .getDashboard()
        .then(setData)
        .catch(() => toast.error("Erreur chargement dashboard"))
        .finally(() => setLoading(false));
    }, []);

    if (loading) return <DashboardSkeleton />;
    if (!data) return null;

    const { stats, recent, monthly } = data;

    // Calcul du max pour le mini chart
    const maxCount = Math.max(...monthly.map((m) => m.count), 1);

    const STAT_CARDS = [
        {
        label: "Total des entreprises",
        value: stats.total,
        sub: "+12% ce mois",
        icon: Building2,
        iconBg: "#eff6ff",
        iconColor: "#3b82f6",
        subColor: "#10b981",
        },
        {
        label: "En attente validation",
        value: stats.pending,
        sub: "Nécessite action",
        icon: Clock,
        iconBg: "#fffbeb",
        iconColor: "#f59e0b",
        subColor: "#f59e0b",
        },
        {
        label: "Entreprises actives",
        value: stats.active,
        sub: `${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% du total`,
        icon: CheckCircle,
        iconBg: "#f0fdf4",
        iconColor: "#10b981",
        subColor: "#10b981",
        },
        {
        label: "Entreprises suspendues",
        value: stats.suspended,
        sub: `${stats.total ? Math.round((stats.suspended / stats.total) * 100) : 0}% du total`,
        icon: XCircle,
        iconBg: "#fef2f2",
        iconColor: "#ef4444",
        subColor: "#ef4444",
        },
    ];

    const QUICK_ACTIONS = [
        {
        label: "Voir les demandes en attente",
        icon: Clock,
        bg: "#f59e0b",
        href: "/admin/validations",
        },
        {
        label: "Créer une entreprise",
        icon: Plus,
        bg: "#1e293b",
        href: "/admin/companies/new",
        },
        {
        label: "Exporter les données",
        icon: Download,
        bg: "#10b981",
        href: "#",
        },
        {
        label: "Paramètres système",
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
                <h3 className="font-semibold text-gray-900">Évolution des inscriptions</h3>
                <p className="text-xs text-gray-500">12 derniers mois</p>
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
                    Pas encore de données
                </div>
                )}
            </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Actions rapides</h3>
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
            <h3 className="font-semibold text-gray-900">Dernières inscriptions</h3>
            <button
                onClick={() => router.push("/admin/companies")}
                className="text-sm hover:underline"
                style={{ color: "var(--color-primary)" }}
            >
                Voir tout
            </button>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-100">
                    {["Entreprise", "Module demandé", "Statut", "Date", "Actions"].map((h) => (
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
                            {org.hasCSE && <ModuleBadge label="AfrikCSE" color="#0f766e" />}
                            {org.hasVoyage && <ModuleBadge label="AfrikVoyage" color="#f59e0b" />}
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
                        {new Date(org.createdAt).toLocaleDateString("fr-FR", {
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
                                Valider
                            </button>
                            )}
                            <button
                            onClick={() => router.push(`/admin/companies/${org.id}`)}
                            className="text-xs font-medium text-gray-500 hover:underline flex items-center gap-1"
                            >
                            <Eye size={12} /> Voir
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