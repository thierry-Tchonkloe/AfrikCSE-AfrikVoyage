"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { employeeService } from "@/services/employes/employee.service";
import { Plane, FileText, Gift, ChevronRight, Star } from "lucide-react";
import { toast } from "sonner";

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
        title: string;
        amount: number;
        status: string;
        createdAt: string;
    }>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    APPROVED: { label: "Approved", color: "#10b981" },
    PENDING:  { label: "Pending",  color: "#f59e0b" },
    REJECTED: { label: "Rejected", color: "#ef4444" },
};

// Activité mock enrichie
const MOCK_ACTIVITY = [
    {
        id: "1", icon: "✅", type: "expense",
        title: "Note de frais approuvée",
        desc: "Your expense report #EXP-2847 has been approved by your manager.",
        badge: "Approved", badgeColor: "#10b981",
        time: "2 hours ago",
    },
    {
        id: "2", icon: "✈️", type: "travel",
        title: "Rappel de voyage : conférence à Londres",
        desc: "Your trip to London is coming up in 3 days.",
        badge: "Reminder", badgeColor: "#3b82f6",
        time: "5 hours ago",
    },
    {
        id: "3", icon: "🎁", type: "benefit",
        title: "Nouveaux avantages CSE disponibles",
        desc: "Check out the new gym membership and wellness packages.",
        badge: "New", badgeColor: "#8b5cf6",
        time: "1 day ago",
    },
    {
        id: "4", icon: "⏳", type: "expense",
        title: "Note de frais en attente de vérification",
        desc: "Your expense report #EXP-2851 is awaiting manager approval.",
        badge: "Pending", badgeColor: "#f59e0b",
        time: "2 days ago",
    },
];

export default function EmployeeDashboardPage() {
    const { user } = useAuth();
    const router   = useRouter();
    const [data, setData]     = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        employeeService.getDashboard()
        .then(setData)
        .catch(() => toast.error("Erreur chargement"))
        .finally(() => setLoading(false));
    }, []);

    const STAT_CARDS = [
        {
        label: "CSE Balance",
        value: data ? `€${data.stats.cseBalance.toLocaleString()}` : "€1,250.00",
        sub: "Available to spend",
        badge: "Active",
        badgeColor: "#10b981",
        icon: "💳",
        iconBg: "#f0fdf4",
        },
        {
        label: "Next Trip",
        value: data?.stats.nextTripDays !== null ? `${data?.stats.nextTripDays} days` : "—",
        sub: data?.stats.nextTripRoute ?? "No upcoming trip",
        badge: "Upcoming",
        badgeColor: "#3b82f6",
        icon: "✈️",
        iconBg: "#eff6ff",
        },
        {
        label: "Expense Reports",
        value: data ? String(data.stats.pendingExpenses) : "2",
        sub: "Awaiting approval",
        badge: "Pending",
        badgeColor: "#f59e0b",
        icon: "📋",
        iconBg: "#fffbeb",
        },
        {
        label: "Benefits Used",
        value: data ? String(data.stats.benefitsUsed) : "12",
        sub: "This year",
        badge: "New",
        badgeColor: "#8b5cf6",
        icon: "🎁",
        iconBg: "#f5f3ff",
        },
    ];

    const QUICK_ACCESS = [
        {
        label: "Mes voyages d'affaires",
        desc: "Consultez et gérez vos voyages d'affaires à venir et passés",
        sub: "3 active trips",
        subLink: "View all →",
        icon: Plane,
        href: "/employes/voyages",
        color: "#3b82f6",
        },
        {
        label: "Mes notes de frais",
        desc: "Soumettez et suivez vos demandes de remboursement de frais",
        sub: "2 pending",
        subLink: "View all →",
        icon: FileText,
        href: "/employes/notes-de-frais",
        color: "#f59e0b",
        },
        {
        label: "Mes avantages CSE",
        desc: "Explorez et profitez de vos avantages sociaux",
        sub: "€1,250 available",
        subLink: "Explore →",
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
            Welcome back, {user?.firstName} ! 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
            Here&#39;s what&#39;s happening with your account today.
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
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Access</h2>
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
                <h3 className="font-semibold text-gray-900">Activité récente</h3>
                <button className="text-xs hover:underline" style={{ color: "#0f766e" }}>
                View all
                </button>
            </div>
            <div className="divide-y divide-gray-50">
                {MOCK_ACTIVITY.map((act) => (
                <div key={act.id} className="px-5 py-4 flex items-start gap-3">
                    <span className="text-xl shrink-0 mt-0.5">{act.icon}</span>
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{act.title}</p>
                        <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ color: act.badgeColor, background: act.badgeColor + "18" }}
                        >
                        {act.badge}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{act.desc}</p>
                    <p className="text-xs text-gray-400 mt-1">{act.time}</p>
                    </div>
                </div>
                ))}
            </div>
            </div>

            {/* Prochain voyage + Offre exclusive */}
            <div className="space-y-4">
            {/* Prochain voyage */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Prochain voyage</h3>
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
                        <span className="text-gray-400">Departure</span>
                        <span>{new Date(data.nextTravel.departureDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Return</span>
                        <span>{new Date(data.nextTravel.returnDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    </div>
                </>
                ) : (
                <div className="text-center py-4">
                    <Plane size={24} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Paris → London</p>
                    <p className="text-xs text-gray-400">Business Conference</p>
                    <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Departure</span>
                        <span>Dec 23, 2024</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Return</span>
                        <span>Dec 26, 2024</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Duration</span>
                        <span>3 days</span>
                    </div>
                    </div>
                </div>
                )}
                <button
                onClick={() => router.push("/employes/voyages")}
                className="w-full mt-4 py-2 rounded-lg text-white text-xs font-medium"
                style={{ background: "#0f766e" }}
                >
                View Details
                </button>
            </div>

            {/* Offre exclusive */}
            <div
                className="rounded-xl p-5 text-white"
                style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)" }}
            >
                <Star size={20} className="mb-2" />
                <p className="font-bold text-sm">Offre exclusive</p>
                <p className="text-xs opacity-80 mt-1">
                Get 20% off on all wellness packages this month with your CSE benefits!
                </p>
                <button
                onClick={() => router.push("/employes/avantages")}
                className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "rgba(255,255,255,0.2)" }}
                >
                Learn More
                </button>
            </div>
            </div>
        </div>
        </div>
    );
}