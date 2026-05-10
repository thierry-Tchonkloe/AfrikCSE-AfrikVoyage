"use client";

import { useEffect, useState, useCallback } from "react";
import { Euro, Plane, TrendingUp, Leaf, Eye, Download } from "lucide-react";
import { voyageService } from "@/services/companies/voyage.service";
import { toast } from "sonner";

interface ExpenseStats {
    totalAmount: number;
    totalCount: number;
    avgAmount: number;
    co2Emissions: number;
}

interface Expense {
    id: string;
    title: string;
    destination: string | null;
    amount: number;
    status: string;
    department: string | null;
    co2Emissions: number | null;
    createdAt: string;
    employee: {
        user: { firstName: string; lastName: string; jobTitle: string | null };
    };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING:  { label: "Pending",  color: "#f59e0b" },
    APPROVED: { label: "Approved", color: "#10b981" },
    REJECTED: { label: "Rejected", color: "#ef4444" },
};

// Données chart mensuelles mock
const MONTHLY_DATA = [
    { month: "Jan", value: 38000 }, { month: "Fév", value: 42000 },
    { month: "Mar", value: 35000 }, { month: "Avr", value: 48000 },
    { month: "Mai", value: 44000 }, { month: "Jun", value: 51000 },
    { month: "Jul", value: 46000 }, { month: "Aoû", value: 43000 },
    { month: "Sep", value: 52000 }, { month: "Oct", value: 48000 },
    { month: "Nov", value: 45000 }, { month: "Déc", value: 41000 },
];

const MAX_VAL = Math.max(...MONTHLY_DATA.map((m) => m.value));

// Données pie chart mock (dépenses par département)
const DEPT_DATA = [
    { label: "Ventes",     pct: 40.9, color: "#1e3a5f" },
    { label: "Marketing",  pct: 27.3, color: "#0f766e" },
    { label: "Ingénierie", pct: 19.7, color: "#f59e0b" },
    { label: "Opérations", pct: 7.1,  color: "#ef4444" },
    { label: "Finance",    pct: 5.0,  color: "#8b5cf6" },
];

export default function FraisPage() {
    const [stats, setStats]     = useState<ExpenseStats | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtres
    const [dateRange, setDateRange] = useState("Last 30 days");
    const [dept, setDept]           = useState("All Departments");
    const [status, setStatus]       = useState("All Status");

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const [statsRes, expRes] = await Promise.all([
            voyageService.getExpenseStats(),
            voyageService.getExpenses({ status: status !== "All Status" ? status : undefined }),
        ]);
        setStats(statsRes);
        setExpenses(expRes.data);
        } catch { toast.error("Erreur chargement"); }
        finally { setLoading(false); }
    }, [status]);

    useEffect(() => { load(); }, [load]);

    // Calcul SVG pie chart simplifié
    const getPiePath = (pct: number, offset: number): string => {
        const r = 80;
        const cx = 100; const cy = 100;
        const startAngle = (offset / 100) * 2 * Math.PI - Math.PI / 2;
        const endAngle = ((offset + pct) / 100) * 2 * Math.PI - Math.PI / 2;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const large = pct > 50 ? 1 : 0;
        return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`;
    };

    let offset = 0;

    return (
        <div className="space-y-5">
        {/* En-tête + filtres */}
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Rapports de frais de voyage</h1>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
            <div className="flex flex-wrap gap-2 bg-white border border-gray-200 rounded-xl p-3">
                <div>
                <p className="text-xs text-gray-500 mb-1">Filters & Export</p>
                <div className="flex flex-wrap gap-2">
                    {[
                    { label: "Date Range", value: dateRange, setter: setDateRange,
                        options: ["Last 30 days", "Last 90 days", "This Year"] },
                    { label: "Department", value: dept, setter: setDept,
                        options: ["All Departments", "Ventes", "Marketing", "Ingénierie"] },
                    { label: "Status", value: status, setter: setStatus,
                        options: ["All Status", "PENDING", "APPROVED", "REJECTED"] },
                    ].map((f) => (
                    <select key={f.label} value={f.value}
                        onChange={(e) => f.setter(e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none text-gray-600">
                        {f.options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                    ))}
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                    style={{ background: "#0f766e" }}>
                    <Download size={13} /> Export PDF
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium bg-green-600">
                    <Download size={13} /> Export Excel
                    </button>
                </div>
                </div>
            </div>
            </div>
        </div>

        {/* Stats */}
        {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
                {
                label: "Dépenses totales", value: `€${stats.totalAmount.toLocaleString()}`,
                sub: "+12.5% from last month", icon: Euro, iconBg: "#eff6ff", iconColor: "#3b82f6",
                },
                {
                label: "Nombre total de voyages", value: stats.totalCount.toString(),
                sub: "+8.3% from last month", icon: Plane, iconBg: "#f0fdf4", iconColor: "#10b981",
                },
                {
                label: "Coût moyen du voyage", value: `€${Math.round(stats.avgAmount)}`,
                sub: "-2.1% from last month", icon: TrendingUp, iconBg: "#fffbeb", iconColor: "#f59e0b",
                },
                {
                label: "Émissions de CO₂", value: `${stats.co2Emissions.toFixed(1)}t`,
                sub: "+5.2% from last month", icon: Leaf, iconBg: "#fef2f2", iconColor: "#ef4444",
                },
            ].map((s) => (
                <div key={s.label}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: s.iconBg }}>
                    <s.icon size={20} style={{ color: s.iconColor }} />
                </div>
                <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </div>
                </div>
            ))}
            </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Line chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Tendances des dépenses mensuelles</h3>
            <div className="relative h-40">
                <svg viewBox="0 0 340 130" className="w-full h-full">
                {[35000, 42000, 49000, 56000].map((v, i) => (
                    <g key={i}>
                    <line x1="0" y1={10 + i * 28} x2="340" y2={10 + i * 28}
                        stroke="#f3f4f6" strokeWidth="1" />
                    <text x="0" y={14 + i * 28} fill="#9ca3af" fontSize="8">
                        {(v / 1000).toFixed(0)}k
                    </text>
                    </g>
                ))}
                <defs>
                    <linearGradient id="voyageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon
                    points={[
                    ...MONTHLY_DATA.map((m, i) => {
                        const x = 20 + (i / (MONTHLY_DATA.length - 1)) * 300;
                        const y = 115 - ((m.value - 33000) / (MAX_VAL - 33000)) * 95;
                        return `${x},${y}`;
                    }),
                    "320,115", "20,115",
                    ].join(" ")}
                    fill="url(#voyageGrad)"
                />
                <polyline
                    points={MONTHLY_DATA.map((m, i) => {
                    const x = 20 + (i / (MONTHLY_DATA.length - 1)) * 300;
                    const y = 115 - ((m.value - 33000) / (MAX_VAL - 33000)) * 95;
                    return `${x},${y}`;
                    }).join(" ")}
                    fill="none" stroke="#0f766e" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                />
                </svg>
                <div className="flex justify-between mt-1 px-5">
                {MONTHLY_DATA.filter((_, i) => i % 2 === 0).map((m) => (
                    <span key={m.month} className="text-xs text-gray-400">{m.month}</span>
                ))}
                </div>
            </div>
            </div>

            {/* Pie chart départements */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Dépenses par département</h3>
            <div className="flex items-center gap-6">
                <svg viewBox="0 0 200 200" className="w-40 h-40 shrink-0">
                {DEPT_DATA.map((d) => {
                    const path = getPiePath(d.pct, offset);
                    offset += d.pct;
                    return <path key={d.label} d={path} fill={d.color} />;
                })}
                </svg>
                <div className="space-y-2">
                {DEPT_DATA.map((d) => (
                    <div key={d.label} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-sm shrink-0"
                        style={{ background: d.color }} />
                    <span className="text-gray-600">{d.label}</span>
                    <span className="font-semibold text-gray-900 ml-auto pl-4">{d.pct}%</span>
                    </div>
                ))}
                </div>
            </div>
            </div>
        </div>

        {/* Impact CO₂ */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Impact environnemental</h3>
            <span className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: "#f0fdf4", color: "#0f766e" }}>
                🌱 Carbon Neutral Goal: 2025
            </span>
            </div>
            <div className="grid grid-cols-3 gap-6 mb-4">
            {[
                { label: "Flight Emissions",    value: "8.2t CO₂", icon: "✈️", color: "#ef4444" },
                { label: "Ground Transport",    value: "2.8t CO₂", icon: "🚗", color: "#3b82f6" },
                { label: "Accommodation",       value: "1.4t CO₂", icon: "🏨", color: "#10b981" },
            ].map((s) => (
                <div key={s.label} className="text-center">
                <span className="text-3xl">{s.icon}</span>
                <p className="text-lg font-bold mt-2" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
                </div>
            ))}
            </div>
            <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progrès en matière de compensation carbone</span>
                <span className="font-medium text-green-600">65%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="h-2.5 rounded-full" style={{ width: "65%", background: "#0f766e" }} />
            </div>
            </div>
        </div>

        {/* Rapports récents */}
        <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Rapports de dépenses récents</h3>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                    {["Employee", "Trip Details", "Date", "Amount", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {loading ? (
                    [...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b">
                        <td colSpan={6} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                    </tr>
                    ))
                ) : expenses.length === 0 ? (
                    <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">
                        Aucun rapport trouvé
                    </td>
                    </tr>
                ) : (
                    expenses.map((exp) => {
                    const st = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.PENDING;
                    return (
                        <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">
                                {exp.employee.user.firstName[0]}{exp.employee.user.lastName[0]}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                {exp.employee.user.firstName} {exp.employee.user.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{exp.employee.user.jobTitle}</p>
                            </div>
                            </div>
                        </td>
                        <td className="px-5 py-3">
                            <p className="text-sm text-gray-900">
                            {exp.destination ?? exp.title}
                            </p>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                            {new Date(exp.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                            €{exp.amount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                            <span className="flex items-center gap-1.5 text-xs font-medium"
                            style={{ color: st.color }}>
                            <span className="w-1.5 h-1.5 rounded-full"
                                style={{ background: st.color }} />
                            {st.label}
                            </span>
                        </td>
                        <td className="px-5 py-3">
                            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                            <Eye size={15} />
                            </button>
                        </td>
                        </tr>
                    );
                    })
                )}
                </tbody>
            </table>
            </div>
        </div>
        </div>
    );
}