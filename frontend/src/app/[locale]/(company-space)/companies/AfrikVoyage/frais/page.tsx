"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Wallet, Receipt, TrendingUp, Leaf, Eye, Download, Check, X, PlusCircle } from "lucide-react";
import { voyageService } from "@/services/companies/voyage.service";
import { billingService } from "@/services/companies/billing.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/currency";
import { DEPARTMENTS } from "@/lib/departments";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";
import { useOptionLabel } from "@/hooks/useOptionLabel";

type Translator = ReturnType<typeof useTranslations<"company.afrikvoyageFrais">>;

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
    category: string | null;
    co2Emissions: number | null;
    createdAt: string;
    receipts: string[];
    employee: {
        user: { firstName: string; lastName: string; jobTitle: string | null };
    };
}

const getStatusConfig = (t: Translator): Record<string, { label: string; color: string }> => ({
    PENDING:  { label: t("pending"),  color: "#f59e0b" },
    APPROVED: { label: t("approved"), color: "#10b981" },
    REJECTED: { label: t("rejected"), color: "#ef4444" },
});

const PALETTE = ["#1e3a5f", "#0f766e", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"];

function getPiePath(pct: number, offset: number): string {
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
}

function monthKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string, locale: string): string {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1).toLocaleDateString(locale, { month: "short" });
}

function pctDelta(last: number, prev: number, t: ReturnType<typeof useTranslations<"company.afrikvoyageFrais">>): string {
    if (prev === 0) return last === 0 ? t("stableVsPreviousMonth") : t("newThisMonth");
    const pct = ((last - prev) / prev) * 100;
    return t("deltaVsPreviousMonth", { sign: pct >= 0 ? "+" : "", pct: pct.toFixed(1) });
}

export default function FraisPage() {
    const dateLocale = useDateLocale();
    const optionLabel = useOptionLabel();
    const tr = useTranslations("company.afrikvoyageFrais");
    const t = useTranslations("company.afrikvoyageFrais");
    const STATUS_CONFIG = useMemo(() => getStatusConfig(t), [t]);
    const [stats, setStats]         = useState<ExpenseStats | null>(null);
    const [expenses, setExpenses]   = useState<Expense[]>([]);
    // Échantillon plus large, chargé uniquement pour les agrégations (tendance
    // mensuelle, répartition département/CO2) — jamais affiché directement.
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [loading, setLoading]     = useState(true);

    // Filtres — seuls ceux réellement supportés par l'API (department, status)
    // sont exposés ; il n'existe pas de filtrage par plage de dates côté backend.
    const [dept, setDept]     = useState("All Departments");
    const [status, setStatus] = useState("All Status");

    const [processing, setProcessing] = useState(false);
    const [rejectItem, setRejectItem] = useState<Expense | null>(null);

    const [wallet, setWallet] = useState<{ balance: number; currencyCode: string } | null>(null);
    const [showTopup, setShowTopup] = useState(false);
    const [toppingUp, setToppingUp] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const department = dept !== "All Departments" ? dept : undefined;
        const [statsRes, expRes, allRes, walletRes] = await Promise.all([
            voyageService.getExpenseStats(),
            voyageService.getExpenses({ status: status !== "All Status" ? status : undefined, department }),
            voyageService.getExpenses({ department, limit: 200 }),
            billingService.getWalletBalance(),
        ]);
        setStats(statsRes);
        setExpenses(expRes.data);
        setAllExpenses(allRes.data);
        setWallet(walletRes);
        } catch { toast.error(t("loadingError")); }
        finally { setLoading(false); }
    }, [status, dept]);

    useEffect(() => { load(); }, [load]);

    const handleTopup = async (amount: number) => {
        setToppingUp(true);
        try {
        const res = await billingService.topUpWallet(amount);
        setWallet(res);
        toast.success(t("walletToppedUp"));
        setShowTopup(false);
        } catch (err) {
        toast.error(getErrorMessage(err, t("errorWhileToppingUp")));
        } finally {
        setToppingUp(false);
        }
    };

    const handleApprove = async (id: string) => {
        setProcessing(true);
        try {
        await voyageService.approveExpense(id);
        toast.success(t("expenseReportApproved"));
        load();
        } catch (err) {
        toast.error(getErrorMessage(err, t("errorWhileApproving")));
        } finally {
        setProcessing(false);
        }
    };

    const handleReject = async (item: Expense, note: string) => {
        setProcessing(true);
        try {
        await voyageService.rejectExpense(item.id, note);
        toast.success(t("expenseReportRejected"));
        setRejectItem(null);
        load();
        } catch (err) {
        toast.error(getErrorMessage(err, t("errorWhileRejecting")));
        } finally {
        setProcessing(false);
        }
    };

    const handleExport = () => {
        if (!expenses.length) { toast.error(t("noReportExport")); return; }
        const rows = [t("csvHeader")];
        expenses.forEach((exp) => {
        rows.push([
            `${exp.employee.user.firstName} ${exp.employee.user.lastName}`,
            exp.destination ?? exp.title,
            exp.department ?? "—",
            exp.amount.toString(),
            STATUS_CONFIG[exp.status]?.label ?? exp.status,
            new Date(exp.createdAt).toLocaleDateString(dateLocale),
        ].join(";"));
        });
        const csv = "﻿" + rows.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "notes-de-frais.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Agrégations réelles (calculées côté client sur allExpenses) ──────────

    const monthlyBuckets = new Map<string, { amount: number }>();
    allExpenses.forEach((e) => {
        const key = monthKey(new Date(e.createdAt));
        const b = monthlyBuckets.get(key) ?? { amount: 0 };
        b.amount += e.amount;
        monthlyBuckets.set(key, b);
    });
    const sortedMonthKeys = [...monthlyBuckets.keys()].sort();
    const monthlyData = sortedMonthKeys.slice(-12).map((key) => ({ month: monthLabel(key, dateLocale), value: monthlyBuckets.get(key)!.amount }));
    const maxMonthlyVal = Math.max(1, ...monthlyData.map((m) => m.value));
    const lastMonthAmount = sortedMonthKeys.length ? monthlyBuckets.get(sortedMonthKeys[sortedMonthKeys.length - 1])!.amount : 0;
    const prevMonthAmount = sortedMonthKeys.length > 1 ? monthlyBuckets.get(sortedMonthKeys[sortedMonthKeys.length - 2])!.amount : 0;

    const deptTotals = new Map<string, number>();
    allExpenses.forEach((e) => {
        const d = e.department || t("notSpecified");
        deptTotals.set(d, (deptTotals.get(d) ?? 0) + e.amount);
    });
    const totalDeptAmount = [...deptTotals.values()].reduce((a, b) => a + b, 0) || 1;
    const deptBreakdown = [...deptTotals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, amount], i) => ({ label, pct: (amount / totalDeptAmount) * 100, color: PALETTE[i % PALETTE.length] }));
    const deptSlices = deptBreakdown.reduce<{ items: Array<(typeof deptBreakdown)[number] & { path: string }>; offset: number }>(
        (acc, d) => ({
            items: [...acc.items, { ...d, path: getPiePath(d.pct, acc.offset) }],
            offset: acc.offset + d.pct,
        }),
        { items: [], offset: 0 },
    ).items;

    const co2ByCategory = new Map<string, number>();
    allExpenses.forEach((e) => {
        if (!e.co2Emissions) return;
        const cat = e.category || t("other");
        co2ByCategory.set(cat, (co2ByCategory.get(cat) ?? 0) + e.co2Emissions);
    });
    const co2Breakdown = [...co2ByCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

    return (
        <div className="space-y-5">
        {/* En-tête + filtres */}
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">{t("travelExpenseReports")}</h1>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
            <div className="flex flex-wrap gap-2 bg-white border border-gray-200 rounded-xl p-3">
                <div>
                <p className="text-xs text-gray-500 mb-1">{t("filtersExport")}</p>
                <div className="flex flex-wrap gap-2">
                    {[
                    { label: t("department"), value: dept, setter: setDept,
                        options: ["All Departments", ...DEPARTMENTS] },
                    { label: t("status"), value: status, setter: setStatus,
                        options: ["All Status", "PENDING", "APPROVED", "REJECTED"] },
                    ].map((f) => (
                    <select key={f.label} value={f.value}
                        onChange={(e) => f.setter(e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none text-gray-600">
                        {f.options.map((o) => <option key={o} value={o}>{optionLabel(o)}</option>)}
                    </select>
                    ))}
                    <button onClick={handleExport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                    style={{ background: "#0f766e" }}>
                    <Download size={13} /> {t("exportCsv")}
                    </button>
                </div>
                </div>
            </div>
            </div>
        </div>

        {/* Portefeuille entreprise (trésorerie de remboursement) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#eff6ff" }}>
                <Wallet size={20} style={{ color: "#3b82f6" }} />
            </div>
            <div>
                <p className="text-xs text-gray-500">{t("companyWalletBalance")}</p>
                <p className="text-lg font-bold text-gray-900" data-testid="wallet-balance" data-balance={wallet?.balance ?? ""}>
                {wallet ? formatCurrency(wallet.balance, undefined, dateLocale) : "—"}
                </p>
                <p className="text-xs text-gray-400">{t("usedReimburseApprovedExpense")}</p>
            </div>
            </div>
            <button onClick={() => setShowTopup(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium"
            style={{ background: "#3b82f6" }}>
            <PlusCircle size={14} /> {t("topUpBalance")}
            </button>
        </div>

        {/* Stats */}
        {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
                {
                label: t("totalExpenses"), value: formatCurrency(stats.totalAmount, undefined, dateLocale),
                sub: pctDelta(lastMonthAmount, prevMonthAmount, t), icon: Wallet, iconBg: "#eff6ff", iconColor: "#3b82f6",
                },
                {
                label: t("numberExpenseReports"), value: stats.totalCount.toString(),
                sub: t("last200Analyzed", { length: allExpenses.length }), icon: Receipt, iconBg: "#f0fdf4", iconColor: "#10b981",
                },
                {
                label: t("averageCostPerReport"), value: formatCurrency(Math.round(stats.avgAmount), undefined, dateLocale),
                sub: t("allReportsCombined"), icon: TrendingUp, iconBg: "#fffbeb", iconColor: "#f59e0b",
                },
                {
                label: t("coEmissions"), value: `${stats.co2Emissions.toFixed(1)}t`,
                sub: t("organizationTotal"), icon: Leaf, iconBg: "#fef2f2", iconColor: "#ef4444",
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
            <h3 className="font-semibold text-gray-900 mb-4">{t("monthlySpendingTrends")}</h3>
            {monthlyData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-gray-400">
                {t("noDataPeriod")}
                </div>
            ) : (
                <div className="relative h-40">
                <svg viewBox="0 0 340 130" className="w-full h-full">
                    {[0.25, 0.5, 0.75, 1].map((f, i) => (
                    <g key={i}>
                        <line x1="0" y1={10 + i * 28} x2="340" y2={10 + i * 28}
                        stroke="#f3f4f6" strokeWidth="1" />
                        <text x="0" y={14 + i * 28} fill="#9ca3af" fontSize="8">
                        {((maxMonthlyVal * (1 - f)) / 1000).toFixed(0)}k
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
                        ...monthlyData.map((m, i) => {
                        const x = monthlyData.length > 1 ? 20 + (i / (monthlyData.length - 1)) * 300 : 170;
                        const y = 115 - (m.value / maxMonthlyVal) * 95;
                        return `${x},${y}`;
                        }),
                        "320,115", "20,115",
                    ].join(" ")}
                    fill="url(#voyageGrad)"
                    />
                    <polyline
                    points={monthlyData.map((m, i) => {
                        const x = monthlyData.length > 1 ? 20 + (i / (monthlyData.length - 1)) * 300 : 170;
                        const y = 115 - (m.value / maxMonthlyVal) * 95;
                        return `${x},${y}`;
                    }).join(" ")}
                    fill="none" stroke="#0f766e" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    />
                </svg>
                <div className="flex justify-between mt-1 px-5">
                    {monthlyData.map((m, i) => (
                    <span key={`${m.month}-${i}`} className="text-xs text-gray-400">{m.month}</span>
                    ))}
                </div>
                </div>
            )}
            </div>

            {/* Pie chart départements */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">{t("spendingDepartment")}</h3>
            {deptBreakdown.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-gray-400">
                {t("noDataPeriod")}
                </div>
            ) : (
                <div className="flex items-center gap-6">
                <svg viewBox="0 0 200 200" className="w-40 h-40 shrink-0">
                    {deptSlices.map((d) => (
                    <path key={d.label} d={d.path} fill={d.color} />
                    ))}
                </svg>
                <div className="space-y-2">
                    {deptBreakdown.map((d) => (
                    <div key={d.label} className="flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 rounded-sm shrink-0"
                        style={{ background: d.color }} />
                        <span className="text-gray-600">{d.label}</span>
                        <span className="font-semibold text-gray-900 ml-auto pl-4">{d.pct.toFixed(1)}%</span>
                    </div>
                    ))}
                </div>
                </div>
            )}
            </div>
        </div>

        {/* Impact CO₂ */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">{t("environmentalImpact")}</h3>
            {co2Breakdown.length === 0 ? (
            <p className="text-sm text-gray-400">{t("noCoEmissionsRecorded")}</p>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {co2Breakdown.map(([category, tons], i) => (
                <div key={category} className="text-center">
                    <p className="text-lg font-bold" style={{ color: PALETTE[i % PALETTE.length] }}>{t("tCo", { p1: tons.toFixed(1) })}</p>
                    <p className="text-xs text-gray-500">{category}</p>
                </div>
                ))}
            </div>
            )}
        </div>

        {/* Rapports récents */}
        <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">{t("recentExpenseReports")}</h3>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                    {["Employee", "Trip Details", "Date", "Amount", "Status", tr("receiptColumn"), "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {loading ? (
                    [...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b">
                        <td colSpan={7} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                    </tr>
                    ))
                ) : expenses.length === 0 ? (
                    <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">
                        {t("noReportFound")}
                    </td>
                    </tr>
                ) : (
                    expenses.map((exp) => {
                    const st = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.PENDING;
                    return (
                        <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50" data-testid="expense-row" data-expense-id={exp.id}>
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
                            {new Date(exp.createdAt).toLocaleDateString(dateLocale)}
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                            {formatCurrency(exp.amount, undefined, dateLocale)}
                        </td>
                        <td className="px-5 py-3">
                            <span className="flex items-center gap-1.5 text-xs font-medium" data-testid="expense-status"
                            style={{ color: st.color }}>
                            <span className="w-1.5 h-1.5 rounded-full"
                                style={{ background: st.color }} />
                            {st.label}
                            </span>
                        </td>
                        <td className="px-5 py-3">
                            {exp.receipts && exp.receipts.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {exp.receipts.map((url, i) => (
                                <a key={url} href={url} target="_blank" rel="noopener noreferrer" data-testid="justificatif-link"
                                    className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                                    {t("receipt", { p1: exp.receipts.length > 1 ? ` ${i + 1}` : "" })}
                                </a>
                                ))}
                            </div>
                            ) : (
                            <span className="text-xs text-gray-400">—</span>
                            )}
                        </td>
                        <td className="px-5 py-3">
                            {exp.status === "PENDING" ? (
                            <div className="flex gap-2">
                                <button onClick={() => handleApprove(exp.id)} disabled={processing}
                                title={t("approve")}
                                className="p-1.5 rounded-lg text-white disabled:opacity-50"
                                style={{ background: "#10b981" }}>
                                <Check size={14} />
                                </button>
                                <button onClick={() => setRejectItem(exp)} disabled={processing}
                                title={t("reject")}
                                className="p-1.5 rounded-lg text-white bg-red-500 disabled:opacity-50">
                                <X size={14} />
                                </button>
                            </div>
                            ) : (
                            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500" disabled>
                                <Eye size={15} />
                            </button>
                            )}
                        </td>
                        </tr>
                    );
                    })
                )}
                </tbody>
            </table>
            </div>
        </div>

        {rejectItem && (
            <RejectExpenseModal
            item={rejectItem}
            processing={processing}
            onClose={() => setRejectItem(null)}
            onConfirm={(note) => handleReject(rejectItem, note)}
            />
        )}

        {showTopup && (
            <TopupModal
            processing={toppingUp}
            onClose={() => setShowTopup(false)}
            onConfirm={handleTopup}
            />
        )}
        </div>
    );
}

// ── Modal Rechargement wallet ────────────────────────────

function TopupModal({ processing, onClose, onConfirm }: {
    processing: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => void;
}) {
    const t = useTranslations("company.afrikvoyageFrais");
    const [amount, setAmount] = useState("");
    const parsed = Number(amount);
    const isValid = amount.trim() !== "" && Number.isFinite(parsed) && parsed > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">{t("topUpWallet")}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
            {t("amountCreditCompanyWallet")}
            </p>
            <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder={t("eG500000")}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
            <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                {t("cancel")}
            </button>
            <button disabled={processing || !isValid} onClick={() => onConfirm(parsed)}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50"
                style={{ background: "#3b82f6" }}>
                {processing && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {t("topUp")}
            </button>
            </div>
        </div>
        </div>
    );
}

// ── Modal Rejet ────────────────────────────────────────

function RejectExpenseModal({ item, processing, onClose, onConfirm }: {
    item: Expense;
    processing: boolean;
    onClose: () => void;
    onConfirm: (note: string) => void;
}) {
    const t = useTranslations("company.afrikvoyageFrais");
    const [note, setNote] = useState("");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">{t("reject2", { p1: item.destination ?? item.title })}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
            {t("provideRejectionReason", { firstName: item.employee.user.firstName, lastName: item.employee.user.lastName })}
            </p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder={t("rejectionReason")}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-none" />
            <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                {t("cancel")}
            </button>
            <button disabled={processing || note.trim().length < 5} onClick={() => onConfirm(note.trim())}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50"
                style={{ background: "#ef4444" }}>
                {processing && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {t("reject")}
            </button>
            </div>
        </div>
        </div>
    );
}
