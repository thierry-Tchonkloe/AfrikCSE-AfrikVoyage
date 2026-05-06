"use client";

import { useState } from "react";
import {
    DollarSign, PieChart, Plane, AlertTriangle,
    MapPin, MoreVertical,
} from "lucide-react";

// ── Données mock ───────────────────────────────────────

const STATS = [
    {
        label: "Dépenses totales voyages",
        value: "$284,560",
        sub: "vs $252,940 last period",
        badge: "+12.5%",
        badgeColor: "#10b981",
        icon: DollarSign,
        iconBg: "#eff6ff",
        iconColor: "#3b82f6",
    },
    {
        label: "Utilisation du budget",
        value: "$312,000",
        sub: "of $400,000 annual budget",
        badge: "78%",
        badgeColor: "#f59e0b",
        icon: PieChart,
        iconBg: "#fffbeb",
        iconColor: "#f59e0b",
    },
    {
        label: "Voyages actifs",
        value: "47",
        sub: "126 travelers on the road",
        badge: "Active",
        badgeColor: "#10b981",
        icon: Plane,
        iconBg: "#f0fdf4",
        iconColor: "#10b981",
    },
    {
        label: "Violations des politiques",
        value: "23",
        sub: "Requires immediate review",
        badge: "8 New",
        badgeColor: "#ef4444",
        icon: AlertTriangle,
        iconBg: "#fef2f2",
        iconColor: "#ef4444",
    },
];

const TOP_DESTINATIONS = [
    { city: "Lagos, Nigeria",   amount: "$42,500", color: "#0f766e", pct: 90 },
    { city: "Nairobi, Kenya",   amount: "$38,200", color: "#3b82f6", pct: 80 },
    { city: "Cape Town, SA",    amount: "$31,800", color: "#f59e0b", pct: 67 },
    { city: "Accra, Ghana",     amount: "$28,600", color: "#8b5cf6", pct: 60 },
    { city: "Kigali, Rwanda",   amount: "$24,100", color: "#ef4444", pct: 50 },
];

const RECENT_REQUESTS = [
    {
        name: "Sarah Mitchell",
        email: "s.mitchell@company.com",
        destination: "Lagos, Nigeria",
        purpose: "Client Meeting",
        dept: "Sales",
        dates: "Feb 15 – Feb 18",
        duration: "3 days",
        cost: "$3,240",
        status: "Pending",
        statusColor: "#f59e0b",
    },
    {
        name: "David Chen",
        email: "d.chen@company.com",
        destination: "Nairobi, Kenya",
        purpose: "Conference",
        dept: "Engineering",
        dates: "Feb 20 – Feb 25",
        duration: "5 days",
        cost: "$4,890",
        status: "Approved",
        statusColor: "#10b981",
    },
    {
        name: "Emma Dubois",
        email: "e.dubois@company.com",
        destination: "Dakar, Sénégal",
        purpose: "Formation",
        dept: "RH",
        dates: "Mar 01 – Mar 03",
        duration: "2 days",
        cost: "$1,780",
        status: "Pending",
        statusColor: "#f59e0b",
    },
];

// Données frais mensuels
const MONTHLY_FRAIS = [
    { month: "Jan", flights: 28000, hotels: 18000, transport: 8000 },
    { month: "Fév", flights: 32000, hotels: 20000, transport: 9000 },
    { month: "Mar", flights: 25000, hotels: 16000, transport: 7000 },
    { month: "Avr", flights: 35000, hotels: 22000, transport: 10000 },
    { month: "Mai", flights: 30000, hotels: 19000, transport: 8500 },
    { month: "Jun", flights: 38000, hotels: 24000, transport: 11000 },
];

type TabType = "Flights" | "Hotels" | "Transport";

const TAB_KEY: Record<TabType, keyof (typeof MONTHLY_FRAIS)[0]> = {
    Flights:   "flights",
    Hotels:    "hotels",
    Transport: "transport",
};

const MAX_FRAIS = 40000;

export default function AfrikVoyageDashboard() {
    const [activeTab, setActiveTab] = useState<TabType>("Flights");

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
            <div className="flex flex-wrap gap-2">
            <select className="text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none">
                <option>All Departments</option>
                <option>Sales</option>
                <option>Engineering</option>
                <option>RH</option>
            </select>
            <select className="text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none">
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
            </select>
            <button
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg text-white font-medium"
                style={{ background: "#0f766e" }}
            >
                ↓ Export Report
            </button>
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

        {/* ── Alerte violation ── */}
        <div
            className="flex items-start gap-3 p-4 rounded-xl border"
            style={{ background: "#fef2f2", borderColor: "#fca5a5" }}
        >
            <AlertTriangle size={20} style={{ color: "#ef4444" }} className="shrink-0 mt-0.5" />
            <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">
                8 Policy Violations Detected
            </p>
            <p className="text-xs text-red-600 mt-0.5">
                The following trips exceed budget limits or violate travel policies and require
                immediate attention from finance or management.
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
                {[
                "Flight class upgrade (3)",
                "Hotel budget exceeded (2)",
                "Missing approvals (3)",
                ].map((v) => (
                <span key={v}
                    className="text-xs underline cursor-pointer"
                    style={{ color: "#ef4444" }}>
                    {v}
                </span>
                ))}
            </div>
            </div>
            <button
            className="shrink-0 text-xs px-3 py-2 rounded-lg text-white font-medium bg-red-500"
            >
            Review Now
            </button>
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Frais mensuels */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-1">
                <div>
                <h3 className="font-semibold text-gray-900">Frais de voyage mensuels</h3>
                <p className="text-xs text-gray-400">
                    Breakdown of travel spending over the last 12 months
                </p>
                </div>
            </div>
            {/* Tabs */}
            <div className="flex gap-1 mt-3 mb-4">
                {(["Flights", "Hotels", "Transport"] as TabType[]).map((tab) => (
                <button key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                    style={activeTab === tab
                    ? { background: "#0f766e", color: "white" }
                    : { color: "#6b7280", background: "#f9fafb" }}>
                    {tab}
                </button>
                ))}
            </div>
            {/* Bar chart */}
            <div className="flex items-end gap-2 h-32">
                {MONTHLY_FRAIS.map((m) => {
                const val = m[TAB_KEY[activeTab]] as number;
                const h = Math.max(4, (val / MAX_FRAIS) * 110);
                return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div
                        className="w-full rounded-t-md transition-all"
                        style={{ height: `${h}px`, background: "#0f766e", opacity: 0.8 }}
                        title={`${m.month}: $${val.toLocaleString()}`}
                    />
                    <span className="text-xs text-gray-400">{m.month}</span>
                    </div>
                );
                })}
            </div>
            </div>

            {/* Top destinations */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="mb-4">
                <h3 className="font-semibold text-gray-900">Top Destinations</h3>
                <p className="text-xs text-gray-400">
                Destinations les plus fréquentées ce trimestre
                </p>
            </div>
            <div className="space-y-4">
                {TOP_DESTINATIONS.map((d) => (
                <div key={d.city} className="space-y-1">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapPin size={14} style={{ color: d.color }} />
                        <span className="text-sm text-gray-700">{d.city}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{d.amount}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${d.pct}%`, background: d.color }}
                    />
                    </div>
                </div>
                ))}
            </div>
            </div>
        </div>

        {/* ── Demandes récentes ── */}
        <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
                <h3 className="font-semibold text-gray-900">Demandes de voyage récentes</h3>
                <p className="text-xs text-gray-400">
                Latest submissions pending approval or recently completed
                </p>
            </div>
            <button className="text-xs font-medium hover:underline flex items-center gap-1"
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
                {RECENT_REQUESTS.map((r) => (
                    <tr key={r.email}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: "#0f766e" }}
                        >
                            {r.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">{r.name}</p>
                            <p className="text-xs text-gray-400">{r.email}</p>
                        </div>
                        </div>
                    </td>
                    <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900">{r.destination}</p>
                        <p className="text-xs text-gray-400">{r.purpose}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{r.dept}</td>
                    <td className="px-5 py-3">
                        <p className="text-xs text-gray-700">{r.dates}</p>
                        <p className="text-xs text-gray-400">{r.duration}</p>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">{r.cost}</td>
                    <td className="px-5 py-3">
                        <span
                        className="flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: r.statusColor }}
                        >
                        <span className="w-1.5 h-1.5 rounded-full"
                            style={{ background: r.statusColor }} />
                        {r.status}
                        </span>
                    </td>
                    <td className="px-5 py-3">
                        <button className="p-1 rounded hover:bg-gray-100 text-gray-400">
                        <MoreVertical size={16} />
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
        </div>
    );
}