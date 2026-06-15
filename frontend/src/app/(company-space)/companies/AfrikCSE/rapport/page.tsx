"use client";

import { useEffect, useState, useCallback } from "react";
import { cseService } from "@/services/companies/cse.service";
import { toast } from "sonner";
import {
    Download, FileSpreadsheet, Wallet, TrendingUp, Users, ShieldCheck,
    type LucideIcon,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────
interface QuarterData { quarter: string; budget: number; actual: number; }
interface CategoryData { id: string; name: string; budget: number; used: number; }
interface Participation { active: number; pending: number; inactive: number; }
interface BudgetReport {
    year: number;
    totalBudget: number;
    usedBudget: number;
    activeEmployees: number;
    categories: CategoryData[];
    quarters: QuarterData[];
    participation: Participation;
}
type ComplianceStatus = "CONFORME" | "NON_CONFORME" | "EN_COURS";
interface ComplianceItem {
    id: string;
    label: string;
    description: string | null;
    status: ComplianceStatus;
    lastAuditDate: string | null;
    nextAuditDate: string | null;
}
interface ComplianceReport { score: number; items: ComplianceItem[]; }

const DEPARTMENTS = [
    "Direction", "Ressources Humaines", "Finance & Comptabilité",
    "Commercial", "Marketing", "Technologie", "Opérations", "Autre",
];

const COMPLIANCE_CONFIG: Record<ComplianceStatus, { label: string; color: string }> = {
    CONFORME:     { label: "Conforme",     color: "#10b981" },
    NON_CONFORME: { label: "Non conforme", color: "#ef4444" },
    EN_COURS:     { label: "En cours",     color: "#f59e0b" },
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

const fmt = (n: number) => `€${Math.round(n).toLocaleString("fr-FR")}`;
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

export default function RapportPage() {
    const [year, setYear]             = useState(CURRENT_YEAR);
    const [department, setDepartment] = useState("");
    const [startDate, setStartDate]   = useState("");
    const [endDate, setEndDate]       = useState("");
    const [report, setReport]         = useState<BudgetReport | null>(null);
    const [compliance, setCompliance] = useState<ComplianceReport | null>(null);
    const [loading, setLoading]       = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const [budget, comp] = await Promise.all([
            cseService.getBudgetReport({
            year,
            department: department || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            }),
            cseService.getComplianceReport(),
        ]);
        setReport(budget);
        setCompliance(comp);
        } catch {
        toast.error("Erreur lors du chargement du rapport");
        } finally {
        setLoading(false);
        }
    }, [year, department, startDate, endDate]);

    useEffect(() => { load(); }, [load]);

    if (loading || !report || !compliance) {
        return <Skeleton />;
    }

    const { totalBudget, usedBudget, activeEmployees, categories, quarters, participation } = report;
    const usagePct = totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0;
    const maxQuarter = Math.max(1, ...quarters.flatMap((q) => [q.actual, q.budget]));
    const sortedCategories = [...categories].sort((a, b) => b.used - a.used);
    const maxCategoryUsed = Math.max(1, ...categories.map((c) => c.used));
    const participationTotal = participation.active + participation.pending + participation.inactive;

    const handleExportPdf = () => {
        const w = window.open("", "_blank");
        if (!w) {
        toast.error("Veuillez autoriser les pop-ups pour exporter le rapport");
        return;
        }

        const categoriesRows = sortedCategories.map((c) => {
        const pct = c.budget > 0 ? Math.round((c.used / c.budget) * 100) : 0;
        return `<tr><td>${c.name}</td><td>${fmt(c.budget)}</td><td>${fmt(c.used)}</td><td>${fmt(c.budget - c.used)}</td><td>${pct}%</td></tr>`;
        }).join("") || `<tr><td colspan="5">Aucune catégorie</td></tr>`;

        const complianceRows = compliance.items.map((i) => {
        const cfg = COMPLIANCE_CONFIG[i.status];
        return `<tr><td>${i.label}</td><td><span class="badge" style="background:${cfg.color}22;color:${cfg.color}">${cfg.label}</span></td><td>${fmtDate(i.lastAuditDate)}</td><td>${fmtDate(i.nextAuditDate)}</td></tr>`;
        }).join("");

        w.document.write(`<!DOCTYPE html><html><head><title>Rapport financier ${report.year}</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111827; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            h2 { font-size: 15px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; text-align: left; }
            .badge { padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
            .stats { display: flex; gap: 16px; margin-top: 12px; }
            .stat { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
            .stat p:first-child { font-size: 11px; color: #6b7280; margin: 0 0 4px; }
            .stat p:last-child { font-size: 18px; font-weight: 700; margin: 0; }
            .footer { margin-top: 32px; font-size: 11px; color: #9ca3af; }
        </style></head><body>
            <h1>Rapport financier — Exercice ${report.year}</h1>
            ${department ? `<p style="color:#6b7280;font-size:13px">Département : ${department}</p>` : ""}
            <div class="stats">
            <div class="stat"><p>Total Budget</p><p>${fmt(report.totalBudget)}</p></div>
            <div class="stat"><p>Budget utilisé</p><p>${fmt(report.usedBudget)}</p></div>
            <div class="stat"><p>Employés actifs</p><p>${report.activeEmployees}</p></div>
            <div class="stat"><p>Score conformité</p><p>${compliance.score}%</p></div>
            </div>
            <h2>Dépenses par catégorie</h2>
            <table>
            <tr><th>Catégorie</th><th>Budget</th><th>Utilisé</th><th>Restant</th><th>%</th></tr>
            ${categoriesRows}
            </table>
            <h2>Rapport de conformité</h2>
            <table>
            <tr><th>Exigence</th><th>Statut</th><th>Dernier audit</th><th>Prochain audit</th></tr>
            ${complianceRows}
            </table>
            <p class="footer">Document généré le ${new Date().toLocaleString("fr-FR")} — AfrikCSE &amp; AfrikVoyage</p>
        </body></html>`);
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 300);
    };

    const handleExportExcel = () => {
        const rows: string[] = [];
        rows.push(`Rapport financier;${report.year}`);
        if (department) rows.push(`Département;${department}`);
        rows.push("");
        rows.push("Indicateur;Valeur");
        rows.push(`Total Budget;${report.totalBudget}`);
        rows.push(`Budget utilisé;${report.usedBudget}`);
        rows.push(`Employés actifs;${report.activeEmployees}`);
        rows.push(`Score conformité;${compliance.score}%`);
        rows.push("");
        rows.push("Catégorie;Budget;Utilisé;Restant;% utilisé");
        sortedCategories.forEach((c) => {
        const pct = c.budget > 0 ? Math.round((c.used / c.budget) * 100) : 0;
        rows.push(`${c.name};${c.budget};${c.used};${c.budget - c.used};${pct}%`);
        });
        rows.push("");
        rows.push("Exigence;Statut;Dernier audit;Prochain audit");
        compliance.items.forEach((i) => {
        rows.push(`${i.label};${COMPLIANCE_CONFIG[i.status].label};${fmtDate(i.lastAuditDate)};${fmtDate(i.nextAuditDate)}`);
        });

        const csv = "﻿" + rows.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rapport-financier-${report.year}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Rapport financier</h1>
            <p className="text-sm text-gray-500">
                Suivi du budget CSE, de la participation et de la conformité
            </p>
            </div>
            <div className="flex gap-2">
            <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
                <FileSpreadsheet size={15} /> Export Excel
            </button>
            <button
                onClick={handleExportPdf}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "var(--color-primary)" }}
            >
                <Download size={15} /> Download Report
            </button>
            </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
            <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700"
            >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700 sm:w-56"
            >
            <option value="">Tous les départements</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Du</label>
            <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-700"
            />
            <label className="text-xs text-gray-500">au</label>
            <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-700"
            />
            </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Wallet}      label="Total Budget"     value={fmt(totalBudget)} sub={`Exercice ${year}`} color="#0f766e" />
            <StatCard icon={TrendingUp}  label="Budget utilisé"   value={fmt(usedBudget)}  sub={`${usagePct}% du budget`} color="#f59e0b" />
            <StatCard icon={Users}       label="Employés actifs"  value={String(activeEmployees)} sub="Éligibles aux subventions" color="#3b82f6" />
            <StatCard icon={ShieldCheck} label="Score conformité" value={`${compliance.score}%`}
            sub={`${compliance.items.filter((i) => i.status === "CONFORME").length}/${compliance.items.length} exigences`} color="#10b981" />
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Barres : budget par trimestre */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-1">Utilisation du budget par trimestre</h3>
            <p className="text-xs text-gray-500 mb-4">Réel vs Budget alloué ({year})</p>
            <div className="flex items-end justify-between gap-3 h-48">
                {quarters.map((q) => (
                <div key={q.quarter} className="flex-1 flex flex-col items-center gap-2">
                    <div className="flex items-end gap-1.5 h-40 w-full justify-center">
                    <div
                        className="w-6 rounded-t-md transition-all"
                        style={{ height: `${(q.actual / maxQuarter) * 100}%`, background: "#0f766e" }}
                        title={`Réel : ${fmt(q.actual)}`}
                    />
                    <div
                        className="w-6 rounded-t-md transition-all"
                        style={{ height: `${(q.budget / maxQuarter) * 100}%`, background: "#e5e7eb" }}
                        title={`Budget : ${fmt(q.budget)}`}
                    />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{q.quarter}</span>
                </div>
                ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ background: "#0f766e" }} /> Réel
                </span>
                <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ background: "#e5e7eb" }} /> Budget
                </span>
            </div>
            </div>

            {/* Camembert : participation employés */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-1">Participation des employés</h3>
            <p className="text-xs text-gray-500 mb-4">Statut des demandes sur la période</p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
                <DonutChart segments={[
                { label: "Actif",   value: participation.active,   color: "#0f766e" },
                { label: "Pending", value: participation.pending,  color: "#f59e0b" },
                { label: "Inactif", value: participation.inactive, color: "#e5e7eb" },
                ]} />
                <div className="space-y-2 text-sm min-w-[140px]">
                <LegendItem color="#0f766e" label="Actif"   value={participation.active}   total={participationTotal} />
                <LegendItem color="#f59e0b" label="Pending" value={participation.pending}  total={participationTotal} />
                <LegendItem color="#e5e7eb" label="Inactif" value={participation.inactive} total={participationTotal} />
                </div>
            </div>
            </div>
        </div>

        {/* Barres : dépenses par catégorie */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-1">Dépenses par catégorie</h3>
            <p className="text-xs text-gray-500 mb-4">Montants utilisés sur la période</p>
            <div className="space-y-3">
            {sortedCategories.map((c) => (
                <div key={c.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-700">{c.name}</span>
                    <span className="text-gray-500">{fmt(c.used)} / {fmt(c.budget)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${(c.used / maxCategoryUsed) * 100}%`, background: "#0f766e" }} />
                </div>
                </div>
            ))}
            {sortedCategories.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucune catégorie de subvention</p>
            )}
            </div>
        </div>

        {/* Principales catégories */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Principales catégories</h3>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">Catégorie</th>
                    <th className="pb-2 font-medium text-right">Budget</th>
                    <th className="pb-2 font-medium text-right">Utilisé</th>
                    <th className="pb-2 font-medium text-right">Restant</th>
                    <th className="pb-2 font-medium text-right">% utilisé</th>
                </tr>
                </thead>
                <tbody>
                {sortedCategories.map((c) => {
                    const pct = c.budget > 0 ? Math.round((c.used / c.budget) * 100) : 0;
                    const badgeStyle = pct > 100
                    ? { color: "#ef4444", background: "#fef2f2" }
                    : pct > 80
                    ? { color: "#f59e0b", background: "#fffbeb" }
                    : { color: "#0f766e", background: "#f0fdf4" };
                    return (
                    <tr key={c.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5 font-medium text-gray-800">{c.name}</td>
                        <td className="py-2.5 text-right text-gray-600">{fmt(c.budget)}</td>
                        <td className="py-2.5 text-right text-gray-600">{fmt(c.used)}</td>
                        <td className="py-2.5 text-right text-gray-600">{fmt(c.budget - c.used)}</td>
                        <td className="py-2.5 text-right">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={badgeStyle}>
                            {pct}%
                        </span>
                        </td>
                    </tr>
                    );
                })}
                {sortedCategories.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-gray-400">Aucune catégorie</td></tr>
                )}
                </tbody>
            </table>
            </div>
        </div>

        {/* Rapport de conformité */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-semibold text-gray-900">Rapport de conformité</h3>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: "#10b981", background: "#ecfdf5" }}>
                Score global : {compliance.score}%
            </span>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">Exigence réglementaire</th>
                    <th className="pb-2 font-medium">Statut</th>
                    <th className="pb-2 font-medium">Dernier audit</th>
                    <th className="pb-2 font-medium">Prochain audit</th>
                </tr>
                </thead>
                <tbody>
                {compliance.items.map((item) => {
                    const cfg = COMPLIANCE_CONFIG[item.status];
                    return (
                    <tr key={item.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5">
                        <p className="font-medium text-gray-800">{item.label}</p>
                        {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                        </td>
                        <td className="py-2.5">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: `${cfg.color}1a` }}>
                            {cfg.label}
                        </span>
                        </td>
                        <td className="py-2.5 text-gray-600">{fmtDate(item.lastAuditDate)}</td>
                        <td className="py-2.5 text-gray-600">{fmtDate(item.nextAuditDate)}</td>
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

// ── Composants ──────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
    icon: LucideIcon; label: string; value: string; sub: string; color: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
        <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{label}</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}1a` }}>
            <Icon size={15} style={{ color }} />
            </div>
        </div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{sub}</p>
        </div>
    );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    let cumulative = 0;

    return (
        <svg viewBox="0 0 160 160" className="w-36 h-36 shrink-0">
        <g transform="rotate(-90 80 80)">
            {total === 0 ? (
            <circle cx="80" cy="80" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="22" />
            ) : (
            segments.filter((s) => s.value > 0).map((s) => {
                const dash = (s.value / total) * circumference;
                const el = (
                <circle
                    key={s.label}
                    cx="80" cy="80" r={radius} fill="none"
                    stroke={s.color} strokeWidth="22"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-cumulative}
                />
                );
                cumulative += dash;
                return el;
            })
            )}
        </g>
        <text x="80" y="80" textAnchor="middle" dominantBaseline="central" className="fill-gray-900 font-bold text-2xl">
            {total}
        </text>
        </svg>
    );
}

function LegendItem({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: color }} />
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900 ml-auto">{value}</span>
        <span className="text-xs text-gray-400">({pct}%)</span>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-100 rounded" />
            <div className="h-4 w-72 bg-gray-100 rounded" />
            </div>
            <div className="flex gap-2">
            <div className="h-9 w-36 bg-gray-100 rounded-lg" />
            <div className="h-9 w-40 bg-gray-100 rounded-lg" />
            </div>
        </div>
        <div className="h-14 bg-white rounded-xl border border-gray-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-gray-200" />
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-xl border border-gray-200" />
            ))}
        </div>
        <div className="h-48 bg-white rounded-xl border border-gray-200" />
        <div className="h-64 bg-white rounded-xl border border-gray-200" />
        <div className="h-64 bg-white rounded-xl border border-gray-200" />
        </div>
    );
}
