"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Loader2, DollarSign, Send } from "lucide-react";
import { commissionsService, CommissionRuleInput } from "@/services/companies/commissions.service";
import { CommissionRule, CommissionEntry, PartnerPayout, CommissionType } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";


type Translator = ReturnType<typeof useTranslations<"admin.commissions">>;

const getTypeLabels = (tt: Translator): Record<CommissionType, string> => ({
    PERCENTAGE:  tt("percentage"),
    FIXED:       tt("fixedAmount"),
    MAX_OF_BOTH: tt("maxFixed"),
});

const EMPTY_RULE: CommissionRuleInput = { type: "PERCENTAGE", rate: 0.1, currencyCode: "XOF" };

type Tab = "rules" | "entries" | "payouts";

export default function AdminCommissionsPage() {
    const dateLocale = useDateLocale();
    const tt = useTranslations("admin.commissions");
    const TYPE_LABELS = useMemo(() => getTypeLabels(tt), [tt]);
    const tr = useTranslations("admin.commissions");
    const [tab, setTab]           = useState<Tab>("rules");
    const [rules, setRules]       = useState<CommissionRule[]>([]);
    const [entries, setEntries]   = useState<CommissionEntry[]>([]);
    const [payouts, setPayouts]   = useState<PartnerPayout[]>([]);
    const [loading, setLoading]   = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing]   = useState<CommissionRule | null>(null);
    const [form, setForm]         = useState<CommissionRuleInput>(EMPTY_RULE);
    const [saving, setSaving]     = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [payoutModal, setPayoutModal] = useState(false);
    const [payoutPartnerId, setPayoutPartnerId] = useState("");
    const [payoutPeriod, setPayoutPeriod]       = useState("");

    const loadTab = useCallback(async (t: Tab) => {
        setLoading(true);
        try {
            if (t === "rules")   setRules(await commissionsService.listRules());
            if (t === "entries") setEntries((await commissionsService.listEntries()).entries);
            if (t === "payouts") setPayouts((await commissionsService.listPayouts()).payouts);
        } catch (err) {
            toast.error(getErrorMessage(err, tr("loadingError")));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadTab(tab); }, [tab, loadTab]);

    const openCreate = () => { setEditing(null); setForm(EMPTY_RULE); setShowModal(true); };
    const openEdit   = (r: CommissionRule) => {
        setEditing(r);
        setForm({ type: r.type, rate: parseFloat(r.rate), fixedAmount: r.fixedAmount ? parseFloat(r.fixedAmount) : undefined, partnerId: r.partnerId ?? undefined, category: r.category ?? undefined, currencyCode: r.currencyCode });
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editing) {
                await commissionsService.updateRule(editing.id, form);
                toast.success(tr("ruleUpdated"));
            } else {
                await commissionsService.createRule(form);
                toast.success(tr("ruleCreated"));
            }
            setShowModal(false);
            loadTab("rules");
        } catch (err) {
            toast.error(getErrorMessage(err, tr("errorWhileSaving")));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(tr("deleteRule"))) return;
        setDeleting(id);
        try {
            await commissionsService.deleteRule(id);
            toast.success(tr("ruleDeleted"));
            loadTab("rules");
        } catch (err) {
            toast.error(getErrorMessage(err, tr("error")));
        } finally {
            setDeleting(null);
        }
    };

    const handleTriggerPayout = async () => {
        if (!payoutPartnerId || !payoutPeriod) { toast.error(tr("partneridPeriodRequired")); return; }
        setSaving(true);
        try {
            await commissionsService.triggerPayout(payoutPartnerId, payoutPeriod);
            toast.success(tr("payoutCreated"));
            setPayoutModal(false);
            setPayoutPartnerId(""); setPayoutPeriod("");
            loadTab("payouts");
        } catch (err) {
            toast.error(getErrorMessage(err, tr("errorDuringPayout")));
        } finally {
            setSaving(false);
        }
    };

    const handleMarkPaid = async (id: string) => {
        try {
            await commissionsService.markPayoutPaid(id);
            toast.success(tr("payoutMarkedAsPaid"));
            loadTab("payouts");
        } catch (err) {
            toast.error(getErrorMessage(err, tr("error")));
        }
    };

    const TABS: { id: Tab; label: string }[] = [
        { id: "rules",   label: tr("rules") },
        { id: "entries", label: tr("entries") },
        { id: "payouts", label: tr("payouts") },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tr("partnerCommissions")}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{tr("ruleConfigurationPayout")}</p>
                </div>
                <div className="flex gap-2">
                    {tab === "rules" && (
                        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                            <Plus className="h-4 w-4" />{tr("newRule")}
                        </button>
                    )}
                    {tab === "payouts" && (
                        <button onClick={() => setPayoutModal(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                            <Send className="h-4 w-4" />{tr("triggerPayout")}
                        </button>
                    )}
                </div>
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
                ) : tab === "rules" ? (
                    rules.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-sm">{tr("noRuleConfigured")}</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("type")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("partner")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("category")}</th>
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("rate")}</th>
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("fixed")}</th>
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {rules.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-5 py-3">
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                                {TYPE_LABELS[r.type]}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{r.partner?.name ?? <span className="text-gray-400 italic">{tr("global")}</span>}</td>
                                        <td className="px-5 py-3 text-gray-500">{r.category ?? "—"}</td>
                                        <td className="px-5 py-3 text-right font-semibold tabular-nums">{(parseFloat(r.rate) * 100).toFixed(1)} %</td>
                                        <td className="px-5 py-3 text-right text-gray-500 tabular-nums">
                                            {r.fixedAmount ? `${parseFloat(r.fixedAmount).toLocaleString(dateLocale)} ${r.currencyCode}` : "—"}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-blue-600 transition">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-500 hover:text-red-600 disabled:opacity-50 transition">
                                                    {deleting === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : tab === "entries" ? (
                    entries.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-sm">{tr("noCommissionEntries")}</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("partner")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("organization")}</th>
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("gross")}</th>
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("commission")}</th>
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("net")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("status")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("date")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {entries.map((e) => (
                                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{e.partner?.name ?? "—"}</td>
                                        <td className="px-5 py-3 text-gray-500">{e.booking?.organization?.name ?? "—"}</td>
                                        <td className="px-5 py-3 text-right tabular-nums">{parseFloat(e.grossAmount).toLocaleString(dateLocale)}</td>
                                        <td className="px-5 py-3 text-right tabular-nums text-red-600">{parseFloat(e.commissionAmount).toLocaleString(dateLocale)}</td>
                                        <td className="px-5 py-3 text-right tabular-nums text-green-600 font-semibold">{parseFloat(e.netAmount).toLocaleString(dateLocale)}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.status === "CONFIRMED" ? "bg-green-100 text-green-700" : e.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
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
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("gross")}</th>
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("commission")}</th>
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("netPaidOut")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("status")}</th>
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {payouts.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{p.partner?.name ?? "—"}</td>
                                        <td className="px-5 py-3 text-gray-500">{p.period}</td>
                                        <td className="px-5 py-3 text-right tabular-nums">{parseFloat(p.totalGross).toLocaleString(dateLocale)}</td>
                                        <td className="px-5 py-3 text-right tabular-nums text-red-600">{parseFloat(p.totalCommission).toLocaleString(dateLocale)}</td>
                                        <td className="px-5 py-3 text-right tabular-nums text-green-600 font-bold">{parseFloat(p.netAmount).toLocaleString(dateLocale)}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === "COMPLETED" ? "bg-green-100 text-green-700" : p.status === "PENDING" ? "bg-amber-100 text-amber-700" : p.status === "PROCESSING" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            {p.status === "PENDING" && (
                                                <button onClick={() => handleMarkPaid(p.id)} className="text-xs text-green-600 hover:underline flex items-center gap-1 ml-auto">
                                                    <DollarSign className="h-3 w-3" />{tr("markAsPaid")}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                )}
            </div>

            {/* Rule modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-lg text-gray-900 dark:text-white">{editing ? tr("editRule") : tr("newCommissionRule")}</h2>
                            <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">{tr("type2")}</label>
                                <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as CommissionType }))}
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    {(Object.keys(TYPE_LABELS) as CommissionType[]).map((t) => (
                                        <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">{tr("rate01")}</label>
                                <input type="number" step="0.01" min="0" max="1" value={form.rate} onChange={(e) => setForm((p) => ({ ...p, rate: parseFloat(e.target.value) }))}
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">{tr("fixedAmountOptional")}</label>
                            <input type="number" min="0" value={form.fixedAmount ?? ""} onChange={(e) => setForm((p) => ({ ...p, fixedAmount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                                placeholder="XOF"
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">{tr("categoryOptional")}</label>
                            <input type="text" value={form.category ?? ""} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value || undefined }))}
                                placeholder={tr("eGRestaurantHotel")}
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="flex justify-end gap-3 pt-1">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">{tr("cancel")}</button>
                            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 text-sm font-medium rounded-lg transition">
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? tr("save") : tr("create")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payout modal */}
            {payoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-lg text-gray-900 dark:text-white">{tr("triggerPayout2")}</h2>
                            <button onClick={() => setPayoutModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">{tr("partnerId")}</label>
                            <input type="text" value={payoutPartnerId} onChange={(e) => setPayoutPartnerId(e.target.value)} placeholder="cuid..."
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">{tr("period2")}</label>
                            <input type="month" value={payoutPeriod} onChange={(e) => setPayoutPeriod(e.target.value)}
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setPayoutModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">{tr("cancel")}</button>
                            <button onClick={handleTriggerPayout} disabled={saving} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2 text-sm font-medium rounded-lg transition">
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}<Send className="h-4 w-4" />{tr("trigger")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
