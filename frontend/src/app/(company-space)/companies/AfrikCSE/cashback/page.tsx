"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Loader2 } from "lucide-react";
import { cashbackAdminService, CashbackRuleInput } from "@/services/companies/cashback.service";
import { CashbackRule, CashbackType } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const TYPE_LABELS: Record<CashbackType, string> = {
    MERCHANT:  "Marchand",
    EMPLOYER:  "Employeur",
    HYBRID:    "Hybride",
    CAMPAIGN:  "Campagne",
};

const EMPTY_FORM: CashbackRuleInput = {
    type:    "EMPLOYER",
    rate:    0,
    currencyCode: "XOF",
};

export default function AdminCashbackPage() {
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
            toast.error(getErrorMessage(err, "Une erreur est survenue"));
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
        if (!form.rate || form.rate <= 0) { toast.error("Taux invalide"); return; }
        setSaving(true);
        try {
            if (editing) {
                await cashbackAdminService.updateRule(editing.id, form);
                toast.success("Règle mise à jour");
            } else {
                await cashbackAdminService.createRule(form);
                toast.success("Règle créée");
            }
            setShowModal(false);
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, "Une erreur est survenue"));
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (rule: CashbackRule) => {
        try {
            await cashbackAdminService.updateRule(rule.id, { isActive: !rule.isActive });
            toast.success(rule.isActive ? "Règle désactivée" : "Règle activée");
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, "Une erreur est survenue"));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer cette règle ?")) return;
        setDeleting(id);
        try {
            await cashbackAdminService.deleteRule(id);
            toast.success("Règle supprimée");
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, "Une erreur est survenue"));
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Règles de cashback</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{rules.length} règle{rules.length !== 1 ? "s" : ""} configurée{rules.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                    <Plus className="h-4 w-4" />
                    Nouvelle règle
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : rules.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-sm">Aucune règle cashback configurée</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Type</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Taux</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Catégorie</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Plafond / employé</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Validité</th>
                                <th className="text-center px-5 py-3 font-medium text-gray-500">Actif</th>
                                <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
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
                                                (+{parseFloat(rule.fixedAmount).toLocaleString("fr-FR")} fixe)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-gray-500">{rule.category ?? "—"}</td>
                                    <td className="px-5 py-3 text-gray-500 tabular-nums">
                                        {rule.maxPerEmployee
                                            ? `${parseFloat(rule.maxPerEmployee).toLocaleString("fr-FR")} ${rule.currencyCode}`
                                            : "—"}
                                    </td>
                                    <td className="px-5 py-3 text-gray-400 text-xs">
                                        {rule.startDate ? new Date(rule.startDate).toLocaleDateString("fr-FR") : "∞"}
                                        {" → "}
                                        {rule.endDate ? new Date(rule.endDate).toLocaleDateString("fr-FR") : "∞"}
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
                                {editing ? "Modifier la règle" : "Nouvelle règle de cashback"}
                            </h2>
                            <button onClick={() => setShowModal(false)}>
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Type *</label>
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
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Taux (0–1) *</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    max="1"
                                    value={form.rate || ""}
                                    onChange={(e) => setForm((p) => ({ ...p, rate: parseFloat(e.target.value) }))}
                                    placeholder="ex: 0.05 pour 5%"
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Montant fixe (optionnel)</label>
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
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Plafond / employé</label>
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
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Catégorie (optionnel)</label>
                            <input
                                type="text"
                                value={form.category ?? ""}
                                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value || undefined }))}
                                placeholder="ex: VOYAGE, CULTURE, LOISIRS"
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Date de début</label>
                                <input
                                    type="date"
                                    value={form.startDate ?? ""}
                                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value || undefined }))}
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Date de fin</label>
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
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 text-sm font-medium rounded-lg transition"
                            >
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                {editing ? "Enregistrer" : "Créer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
