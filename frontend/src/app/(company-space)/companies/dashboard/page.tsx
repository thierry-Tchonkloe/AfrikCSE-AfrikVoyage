"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { companyService } from "@/services/companies/company.service";
import { Users, Plane, Gift, Settings, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface DashboardData {
    org: {
        id: string;
        name: string;
        status: string;
        plan: string;
        hasCSE: boolean;
        hasVoyage: boolean;
        _count: { users: number };
    };
    activeUsers: number;
}

export default function CompanyDashboardPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [data, setData]     = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        companyService.getDashboard()
        .then(setData)
        .catch(() => toast.error("Erreur chargement"))
        .finally(() => setLoading(false));
    }, []);

    if (loading) return <Skeleton />;
    if (!data) return null;

    const { org } = data;

    const MODULE_CARDS = [
        {
        id: "cse",
        label: "AfrikCSE",
        desc: "Avantages salariés, billetterie, subventions",
        icon: Gift,
        active: org.hasCSE,
        color: "#0f766e",
        href: "/companies/AfrikCSE",
        },
        {
        id: "voyage",
        label: "AfrikVoyage",
        desc: "Réservations, notes de frais, politiques",
        icon: Plane,
        active: org.hasVoyage,
        color: "#f59e0b",
        href: "/companies/AfrikVoyage",
        },
    ];

    const QUICK_ACTIONS = [
        {
        label: "Ajouter un utilisateur",
        icon: UserPlus,
        href: "/companies/users?action=new",
        color: "var(--color-primary)",
        },
        {
        label: "Gérer les utilisateurs",
        icon: Users,
        href: "/companies/users",
        color: "#6366f1",
        },
        {
        label: "Paramètres",
        icon: Settings,
        href: "/companies/settings",
        color: "#6b7280",
        },
    ];

    return (
        <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">
                Bonjour, {user?.firstName} 👋
            </h1>
            <p className="text-sm text-gray-500">
                {org.name} — Plan <strong>{org.plan}</strong>
            </p>
            </div>
            <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full w-fit"
            style={{ background: "#f0fdf4", color: "#166534" }}
            >
            ● Actif
            </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
            {
                label: "Utilisateurs actifs",
                value: data.activeUsers,
                icon: Users,
                color: "#3b82f6",
                bg: "#eff6ff",
            },
            {
                label: "Modules activés",
                value: [org.hasCSE, org.hasVoyage].filter(Boolean).length,
                icon: Gift,
                color: "#10b981",
                bg: "#f0fdf4",
            },
            {
                label: "Plan actuel",
                value: org.plan,
                icon: Settings,
                color: "#8b5cf6",
                bg: "#f5f3ff",
            },
            ].map((stat) => (
            <div key={stat.label}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: stat.bg }}>
                <stat.icon size={22} style={{ color: stat.color }} />
                </div>
                <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
                </div>
            </div>
            ))}
        </div>

        {/* Modules */}
        <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Vos modules</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MODULE_CARDS.map((mod) => (
                <div key={mod.id}
                className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: mod.color + "18" }}>
                    <mod.icon size={20} style={{ color: mod.active ? mod.color : "#9ca3af" }} />
                    </div>
                    <div>
                    <p className="font-semibold text-sm text-gray-900">{mod.label}</p>
                    <p className="text-xs text-gray-500">{mod.desc}</p>
                    </div>
                    <span
                    className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                    style={mod.active
                        ? { background: "#f0fdf4", color: "#166534" }
                        : { background: "#f9fafb", color: "#9ca3af" }}
                    >
                    {mod.active ? "Actif" : "Inactif"}
                    </span>
                </div>
                {mod.active ? (
                    <button
                    onClick={() => router.push(mod.href)}
                    className="w-full py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
                    style={{ background: mod.color }}
                    >
                    Accéder
                    </button>
                ) : (
                    <button
                    disabled
                    className="w-full py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                    >
                    Non activé — Contacter le support
                    </button>
                )}
                </div>
            ))}
            </div>
        </div>

        {/* Actions rapides */}
        <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Actions rapides</h2>
            <div className="flex flex-wrap gap-3">
            {QUICK_ACTIONS.map((action) => (
                <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: action.color }}
                >
                <action.icon size={16} />
                {action.label}
                </button>
            ))}
            </div>
        </div>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-gray-100 rounded-xl w-64" />
        <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border" />
            ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
            <div key={i} className="h-36 bg-white rounded-xl border" />
            ))}
        </div>
        </div>
    );
}