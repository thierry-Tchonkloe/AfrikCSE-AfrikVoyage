"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import { commissionsService } from "@/services/companies/commissions.service";
import { CommissionEntry, PartnerPayout, CommissionStatus } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/currency";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";

const STATUS_COLOR: Record<CommissionStatus, string> = {
    PENDING:   "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
    CONFIRMED: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
    CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    REVERSED:  "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400",
};

type Tab = "entries" | "payouts";

export default function CompanyCommissionsPage() {
    const dateLocale = useDateLocale();
    const tr = useTranslations("company.afrikcseCommissions");
    const [tab, setTab]         = useState<Tab>("entries");
    const [entries, setEntries] = useState<CommissionEntry[]>([]);
    const [payouts, setPayouts] = useState<PartnerPayout[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalEntries, setTotalEntries] = useState(0);

    const loadTab = useCallback(async (t: Tab) => {
        setLoading(true);
        try {
            if (t === "entries") {
                const res = await commissionsService.listEntries(undefined, 1, 50);
                setEntries(res.entries);
                setTotalEntries(res.total);
            } else {
                const res = await commissionsService.listPayouts(undefined, 1, 20);
                setPayouts(res.payouts);
            }
        } catch (err) {
            toast.error(getErrorMessage(err, tr("loadingError")));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadTab(tab); }, [tab, loadTab]);

    // Regroupé par devise plutôt qu'additionné à l'aveugle : des entrées de
    // devises différentes ne doivent jamais être sommées sous un seul total.
    const netByCurrency = entries
        .filter((e) => e.status === "CONFIRMED")
        .reduce<Record<string, number>>((acc, e) => {
            acc[e.currencyCode] = (acc[e.currencyCode] ?? 0) + parseFloat(e.netAmount);
            return acc;
        }, {});

    const TABS: { id: Tab; label: string }[] = [
        { id: "entries", label: tr("entries") },
        { id: "payouts", label: tr("payouts") },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tr("partnerCommissions")}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{tr("trackCommissionsGenerated")}</p>
                </div>
                {tab === "entries" && totalEntries > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2 text-right">
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">{tr("confirmedNet")}</p>
                        {Object.entries(netByCurrency).map(([currency, amount]) => (
                            <p key={currency} className="text-lg font-bold text-green-700 dark:text-green-300 tabular-nums flex items-center justify-end gap-1">
                                <TrendingUp className="h-4 w-4" />
                                {formatCurrency(amount, currency, dateLocale)}
                            </p>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                            tab === t.id
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : tab === "entries" ? (
                    entries.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-sm">{tr("noCommissionEntries")}</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("partner")}</th>
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("gross")}</th>
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("commission")}</th>
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("netPaidOut")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("status")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("date")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {entries.map((e) => (
                                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{e.partner?.name ?? "—"}</td>
                                        <td className="px-5 py-3 text-right tabular-nums text-gray-600">{formatCurrency(e.grossAmount, e.currencyCode, dateLocale)}</td>
                                        <td className="px-5 py-3 text-right tabular-nums text-red-600">-{formatCurrency(e.commissionAmount, e.currencyCode, dateLocale)}</td>
                                        <td className="px-5 py-3 text-right tabular-nums font-semibold text-green-600">{formatCurrency(e.netAmount, e.currencyCode, dateLocale)}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[e.status]}`}>
                                                {e.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-400 text-xs">{new Date(e.createdAt).toLocaleDateString(dateLocale)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    payouts.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-sm">{tr("noPayouts")}</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("partner")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("period")}</th>
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("netPaidOut")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("status")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("paid")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {payouts.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{p.partner?.name ?? "—"}</td>
                                        <td className="px-5 py-3 text-gray-500">{p.period}</td>
                                        <td className="px-5 py-3 text-right font-bold text-green-600 tabular-nums">{formatCurrency(p.netAmount, p.currencyCode, dateLocale)}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === "COMPLETED" ? "bg-green-100 text-green-700" : p.status === "PENDING" ? "bg-amber-100 text-amber-700" : p.status === "PROCESSING" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-400 text-xs">
                                            {p.paidAt ? new Date(p.paidAt).toLocaleDateString(dateLocale) : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                )}
            </div>
        </div>
    );
}
