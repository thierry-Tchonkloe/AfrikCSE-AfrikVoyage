"use client";

import { useState } from "react";
import {
    Euro, Users, Clock, AlertTriangle,
    TrendingUp, CheckCircle, XCircle,
} from "lucide-react";

// ── Données mock (à remplacer par appels API) ──────────
const STATS = [
    {
        label: "Total CSE Budget",
        value: "€125,000",
        sub: "+6.2% from last year",
        subColor: "#10b981",
        icon: Euro,
        iconBg: "#eff6ff",
        iconColor: "#3b82f6",
    },
    {
        label: "Budget utilisé",
        value: "€87,450",
        sub: "70% of total budget",
        subColor: "#f59e0b",
        icon: TrendingUp,
        iconBg: "#fffbeb",
        iconColor: "#f59e0b",
    },
    {
        label: "Employés actifs",
        value: "342",
        sub: "+12 this month",
        subColor: "#10b981",
        icon: Users,
        iconBg: "#f0fdf4",
        iconColor: "#10b981",
    },
    {
        label: "Demandes en attente",
        value: "23",
        sub: "Needs attention",
        subColor: "#ef4444",
        icon: AlertTriangle,
        iconBg: "#fef2f2",
        iconColor: "#ef4444",
    },
];

const AVANTAGES = [
    { icon: "🏋️", label: "Gym Membership",       enrolled: 156, spent: "€18,720" },
    { icon: "🎓", label: "Training & Education",  enrolled: 89,  spent: "€24,500" },
    { icon: "🍽️", label: "Meal Vouchers",         enrolled: 287, spent: "€31,250" },
];

const ALERTS = [
    {
        type: "error",
        title: "Budget Alert",
        desc: "Training budget is 85% used. Consider reviewing allocations.",
        time: "2 hours ago",
        color: "#ef4444",
        bg: "#fef2f2",
    },
    {
        type: "warning",
        title: "Pending Approval",
        desc: "23 benefit requests awaiting your approval.",
        time: "1 day ago",
        color: "#f59e0b",
        bg: "#fffbeb",
    },
    {
        type: "info",
        title: "System Update",
        desc: "New benefit categories have been added to the system.",
        time: "3 days ago",
        color: "#3b82f6",
        bg: "#eff6ff",
    },
];

// Données budget pie chart (simulé avec CSS)
const BUDGET_USED_PCT = 70;

// Données tendances mensuelles
const MONTHLY = [
    { month: "Jan", value: 7200 },
    { month: "Fév", value: 7800 },
    { month: "Mar", value: 8100 },
    { month: "Avr", value: 7600 },
    { month: "Mai", value: 8400 },
    { month: "Jun", value: 8900 },
    { month: "Jul", value: 8200 },
    { month: "Aoû", value: 8600 },
    { month: "Sep", value: 8800 },
    { month: "Oct", value: 9100 },
    { month: "Nov", value: 8700 },
    { month: "Déc", value: 8300 },
];

const MAX_MONTHLY = Math.max(...MONTHLY.map((m) => m.value));

export default function AfrikCSEDashboard() {
    const [budgetPeriod, setBudgetPeriod] = useState("This Year");
    const [trendPeriod, setTrendPeriod]   = useState("Last 12 months");

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
                <p className="text-xs mt-0.5 flex items-center gap-1"
                    style={{ color: s.subColor }}>
                    <TrendingUp size={11} /> {s.sub}
                </p>
                </div>
            </div>
            ))}
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pie chart budget */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Aperçu de l&#39;utilisation du budget</h3>
                <select
                value={budgetPeriod}
                onChange={(e) => setBudgetPeriod(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none"
                >
                <option>This Year</option>
                <option>Last Year</option>
                </select>
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
                    strokeDasharray={`${BUDGET_USED_PCT * 2.513} ${251.3}`}
                    strokeLinecap="butt"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{BUDGET_USED_PCT}%</span>
                    <span className="text-xs text-gray-400">Utilisé</span>
                </div>
                </div>
                {/* Légende */}
                <div className="space-y-2">
                {[
                    { label: "Used Budget",      color: "#f59e0b", pct: "70%" },
                    { label: "Remaining Budget", color: "#e5e7eb", pct: "30%" },
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

            {/* Line chart tendances */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Tendances des dépenses mensuelles</h3>
                <select
                value={trendPeriod}
                onChange={(e) => setTrendPeriod(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none"
                >
                <option>Last 12 months</option>
                <option>Last 6 months</option>
                </select>
            </div>
            {/* Mini line chart SVG */}
            <div className="relative h-36">
                <svg viewBox="0 0 340 120" className="w-full h-full" preserveAspectRatio="none">
                {/* Grille horizontale */}
                {[0, 1, 2].map((i) => (
                    <line key={i}
                    x1="0" y1={i * 40 + 10} x2="340" y2={i * 40 + 10}
                    stroke="#f3f4f6" strokeWidth="1" />
                ))}
                {/* Aire */}
                <defs>
                    <linearGradient id="cseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon
                    points={[
                    ...MONTHLY.map((m, i) => {
                        const x = (i / (MONTHLY.length - 1)) * 320 + 10;
                        const y = 110 - ((m.value - 7000) / (MAX_MONTHLY - 7000)) * 90;
                        return `${x},${y}`;
                    }),
                    "330,110", "10,110",
                    ].join(" ")}
                    fill="url(#cseGrad)"
                />
                {/* Ligne */}
                <polyline
                    points={MONTHLY.map((m, i) => {
                    const x = (i / (MONTHLY.length - 1)) * 320 + 10;
                    const y = 110 - ((m.value - 7000) / (MAX_MONTHLY - 7000)) * 90;
                    return `${x},${y}`;
                    }).join(" ")}
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* Points */}
                {MONTHLY.map((m, i) => {
                    const x = (i / (MONTHLY.length - 1)) * 320 + 10;
                    const y = 110 - ((m.value - 7000) / (MAX_MONTHLY - 7000)) * 90;
                    return (
                    <circle key={i} cx={x} cy={y} r="3"
                        fill="white" stroke="#0f766e" strokeWidth="2" />
                    );
                })}
                </svg>
                {/* Labels X */}
                <div className="flex justify-between mt-1 px-2">
                {MONTHLY.filter((_, i) => i % 2 === 0).map((m) => (
                    <span key={m.month} className="text-xs text-gray-400">{m.month}</span>
                ))}
                </div>
            </div>
            </div>
        </div>

        {/* ── Avantages populaires + Alertes ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Avantages populaires */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Avantages populaires</h3>
                <button className="text-xs font-medium hover:underline"
                style={{ color: "var(--color-primary)" }}>
                View all
                </button>
            </div>
            <div className="space-y-4">
                {AVANTAGES.map((a) => (
                <div key={a.label} className="flex items-center gap-3">
                    <span className="text-2xl">{a.icon}</span>
                    <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{a.label}</p>
                    <p className="text-xs text-gray-500">
                        {a.enrolled} employees enrolled
                    </p>
                    </div>
                    <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{a.spent}</p>
                    <p className="text-xs text-gray-400">Total spent</p>
                    </div>
                </div>
                ))}
            </div>
            </div>

            {/* Alertes & Updates */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Alerts & Updates</h3>
            <div className="space-y-3">
                {ALERTS.map((alert) => (
                <div key={alert.title}
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
                        <p className="text-xs mt-1" style={{ color: alert.color }}>
                        {alert.time}
                        </p>
                    </div>
                    </div>
                </div>
                ))}
            </div>
            <button
                className="w-full mt-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "#0f766e" }}
            >
                View All Alerts
            </button>
            </div>
        </div>
        </div>
    );
}