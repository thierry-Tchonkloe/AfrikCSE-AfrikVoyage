"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Loader2 } from "lucide-react";
import { cashbackAdminService, CashbackRuleInput } from "@/services/companies/cashback.service";
import { CashbackRule, CashbackType } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";


type Translator = ReturnType<typeof useTranslations<"company.afrikcseCashback">>;

const getTypeLabels = (tt: Translator): Record<CashbackType, string> => ({
    MERCHANT:  tt("merchant"),
    EMPLOYER:  tt("employer"),
    HYBRID:    tt("hybrid"),
    CAMPAIGN:  tt("campaign"),
});

const EMPTY_FORM: CashbackRuleInput = {
    type:    "EMPLOYER",
    rate:    0,
    currencyCode: DEFAULT_CURRENCY,
};

export default function AdminCashbackPage() {
    const dateLocale = useDateLocale();
    const tt = useTranslations("company.afrikcseCashback");
    const TYPE_LABELS = useMemo(() => getTypeLabels(tt), [tt]);
    const tr = useTranslations("company.afrikcseCashback");
    const [rules, setRules]       = useState<CashbackRule[]>([]);
    const [loading, setLoading]   = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing]   = useState<CashbackRule | null>(null);
    const [form, setForm]         = useState<CashbackRuleInput>(EMPTY_FORM);
    const [saving, setSaving]     = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setRules(await cashbackAdminService.listRules());
        } catch (err) {
            toast.error(getErrorMessage(err, tr("errorOccurred")));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEdit = (rule: CashbackRule) => {
        setEditing(rule);
        setForm({
            type:           rule.type,
            rate:           parseFloat(rule.rate),
            fixedAmount:    rule.fixedAmount    ? parseFloat(rule.fixedAmount)    : undefined,
            maxPerEmployee: rule.maxPerEmployee ? parseFloat(rule.maxPerEmployee) : undefined,
            maxPerPeriod:   rule.maxPerPeriod   ? parseFloat(rule.maxPerPeriod)   : undefined,
            startDate:      rule.startDate?.slice(0, 10) ?? undefined,
            endDate:        rule.endDate?.slice(0, 10)   ?? undefined,
            category:       rule.category ?? undefined,
            partnerId:      rule.partnerId ?? undefined,
            currencyCode:   rule.currencyCode,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.rate || form.rate <= 0) { toast.error(tr("invalidRate")); return; }
        setSaving(true);
        try {
            if (editing) {
                await cashbackAdminService.updateRule(editing.id, form);
                toast.success(tr("ruleUpdated"));
            } else {
                await cashbackAdminService.createRule(form);
                toast.success(tr("ruleCreated"));
            }
            setShowModal(false);
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, tr("errorOccurred")));
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (rule: CashbackRule) => {
        try {
            await cashbackAdminService.updateRule(rule.id, { isActive: !rule.isActive });
            toast.success(rule.isActive ? tr("ruleDeactivated") : tr("ruleActivated"));
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, tr("errorOccurred")));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(tr("deleteRule"))) return;
        setDeleting(id);
        try {
            await cashbackAdminService.deleteRule(id);
            toast.success(tr("ruleDeleted"));
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, tr("errorOccurred")));
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tr("cashbackRules")}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{tr("ruleConfigured", { length: rules.length, p2: rules.length !== 1 ? "s" : "" })}</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                    <Plus className="h-4 w-4" />
                    {tr("newRule")}
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : rules.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-sm">{tr("noCashbackRuleConfigured")}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("type")}</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("rate")}</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("category")}</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("ceilingEmployee")}</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("validity")}</th>
                                <th className="text-center px-5 py-3 font-medium text-gray-500">{tr("active")}</th>
                                <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {rules.map((rule) => (
                                <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                    <td className="px-5 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                            {TYPE_LABELS[rule.type]}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                                        {(parseFloat(rule.rate) * 100).toFixed(1)} %
                                        {rule.fixedAmount && (
                                            <span className="text-xs text-gray-400 ml-1">
                                                {tr("fixed", { p1: formatCurrency(rule.fixedAmount, rule.currencyCode, dateLocale) })}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-gray-500">{rule.category ?? "—"}</td>
                                    <td className="px-5 py-3 text-gray-500 tabular-nums">
                                        {rule.maxPerEmployee
                                            ? formatCurrency(rule.maxPerEmployee, rule.currencyCode, dateLocale)
                                            : "—"}
                                    </td>
                                    <td className="px-5 py-3 text-gray-400 text-xs">
                                        {rule.startDate ? new Date(rule.startDate).toLocaleDateString(dateLocale) : "∞"}
                                        {" → "}
                                        {rule.endDate ? new Date(rule.endDate).toLocaleDateString(dateLocale) : "∞"}
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <button onClick={() => toggleActive(rule)}>
                                            {rule.isActive
                                                ? <ToggleRight className="h-5 w-5 text-green-500 mx-auto" />
                                                : <ToggleLeft  className="h-5 w-5 text-gray-400 mx-auto" />}
                                        </button>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(rule)}
                                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-500 hover:text-blue-600"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(rule.id)}
                                                disabled={deleting === rule.id}
                                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-gray-500 hover:text-red-600 disabled:opacity-50"
                                            >
                                                {deleting === rule.id
                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : <Trash2 className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                                {editing ? tr("editRule") : tr("newCashbackRule")}
                            </h2>
                            <button onClick={() => setShowModal(false)}>
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">{tr("type2")}</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as CashbackType }))}
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {(Object.keys(TYPE_LABELS) as CashbackType[]).map((t) => (
                                        <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">{tr("rate01")}</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    max="1"
                                    value={form.rate || ""}
                                    onChange={(e) => setForm((p) => ({ ...p, rate: parseFloat(e.target.value) }))}
                                    placeholder={tr("eG005")}
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">{tr("fixedAmountOptional")}</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.fixedAmount ?? ""}
                                    onChange={(e) => setForm((p) => ({ ...p, fixedAmount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                                    placeholder="XOF"
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">{tr("ceilingEmployee")}</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.maxPerEmployee ?? ""}
                                    onChange={(e) => setForm((p) => ({ ...p, maxPerEmployee: e.target.value ? parseFloat(e.target.value) : undefined }))}
                                    placeholder="XOF"
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">{tr("categoryOptional")}</label>
                            <input
                                type="text"
                                value={form.category ?? ""}
                                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value || undefined }))}
                                placeholder={tr("eGTravelCulture")}
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">{tr("startDate")}</label>
                                <input
                                    type="date"
                                    value={form.startDate ?? ""}
                                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value || undefined }))}
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">{tr("endDate")}</label>
                                <input
                                    type="date"
                                    value={form.endDate ?? ""}
                                    onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value || undefined }))}
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-1">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                            >
                                {tr("cancel")}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 text-sm font-medium rounded-lg transition"
                            >
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                {editing ? tr("save") : tr("create")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
