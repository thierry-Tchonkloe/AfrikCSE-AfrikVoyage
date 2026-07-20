"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight } from "lucide-react";
import {
    subsidyRulesService,
    SubsidyRule,
    SubsidyRuleInput,
} from "@/services/companies/subsidy-rules.service";
import { toast } from "sonner";

const OFFER_TYPES = ["VOUCHER", "BOOKING", "DISCOUNT_CODE"] as const;

const EMPTY_FORM: SubsidyRuleInput = {
    label: "", category: "", offerType: undefined,
    subsidyPct: undefined, subsidyAmount: undefined,
    currencyCode: "XOF", maxPerEmployee: undefined,
    startsAt: "", endsAt: "",
    isActive: true, priority: 0,
};

function fmt(n: string | number | null | undefined, currency = "XOF") {
    if (n == null) return "—";
    return `${Number(n).toLocaleString("fr-FR")} ${currency}`;
}

export default function SubventionsPage() {
    const [rules, setRules]     = useState<SubsidyRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal]     = useState<"create" | "edit" | null>(null);
    const [editId, setEditId]   = useState<string | null>(null);
    const [form, setForm]       = useState<SubsidyRuleInput>(EMPTY_FORM);
    const [saving, setSaving]   = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setRules(await subsidyRulesService.getAll());
        } catch { toast.error("Erreur chargement des règles"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setEditId(null);
        setModal("create");
    };

    const openEdit = (rule: SubsidyRule) => {
        setEditId(rule.id);
        setForm({
            label:          rule.label,
            category:       rule.category ?? "",
            offerType:      rule.offerType ?? undefined,
            subsidyPct:     rule.subsidyPct ?? undefined,
            subsidyAmount:  rule.subsidyAmount ? Number(rule.subsidyAmount) : undefined,
            currencyCode:   rule.currencyCode,
            maxPerEmployee: rule.maxPerEmployee ? Number(rule.maxPerEmployee) : undefined,
            startsAt:       rule.startsAt ? rule.startsAt.slice(0, 10) : "",
            endsAt:         rule.endsAt   ? rule.endsAt.slice(0, 10)   : "",
            isActive:       rule.isActive,
            priority:       rule.priority,
        });
        setModal("edit");
    };

    const handleSave = async () => {
        if (!form.label.trim()) { toast.error("Libellé requis"); return; }
        setSaving(true);
        try {
            const payload: SubsidyRuleInput = {
                ...form,
                startsAt:  form.startsAt  || undefined,
                endsAt:    form.endsAt    || undefined,
                category:  form.category  || undefined,
                offerType: form.offerType || undefined,
            };
            if (modal === "create") {
                await subsidyRulesService.create(payload);
                toast.success("Règle créée");
            } else if (editId) {
                await subsidyRulesService.update(editId, payload);
                toast.success("Règle mise à jour");
            }
            setModal(null);
            load();
        } catch { toast.error("Erreur lors de la sauvegarde"); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await subsidyRulesService.remove(deleteId);
            toast.success("Règle supprimée");
            setDeleteId(null);
            load();
        } catch { toast.error("Erreur lors de la suppression"); }
    };

    const toggleActive = async (rule: SubsidyRule) => {
        try {
            await subsidyRulesService.update(rule.id, { isActive: !rule.isActive });
            load();
        } catch { toast.error("Erreur"); }
    };

    const numField = (key: keyof SubsidyRuleInput, label: string) => (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input
                type="number"
                min={0}
                value={form[key] != null ? String(form[key]) : ""}
                onChange={(e) => setForm((f) => ({
                    ...f,
                    [key]: e.target.value === "" ? undefined : Number(e.target.value),
                }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-500"
            />
        </div>
    );

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Règles de subventionnement</h1>
                    <p className="text-sm text-gray-500">Définissez les règles de prise en charge employeur</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ background: "#0f766e" }}
                >
                    <Plus size={16} /> Nouvelle règle
                </button>
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                {["Libellé", "Catégorie", "Type offre", "Subvention", "Plafond / employé", "Période", "Priorité", "Statut", ""].map((h) => (
                                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i} className="border-b">
                                        <td colSpan={9} className="px-4 py-4">
                                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : rules.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                                        Aucune règle configurée
                                    </td>
                                </tr>
                            ) : (
                                rules.map((rule) => {
                                    const subsidy = rule.subsidyPct != null
                                        ? `${rule.subsidyPct}%`
                                        : rule.subsidyAmount != null
                                        ? fmt(rule.subsidyAmount, rule.currencyCode)
                                        : "—";

                                    const period = rule.startsAt || rule.endsAt
                                        ? [
                                            rule.startsAt ? new Date(rule.startsAt).toLocaleDateString("fr-FR") : "…",
                                            rule.endsAt   ? new Date(rule.endsAt).toLocaleDateString("fr-FR")   : "∞",
                                          ].join(" → ")
                                        : "Indéfinie";

                                    return (
                                        <tr key={rule.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{rule.label}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{rule.category ?? "—"}</td>
                                            <td className="px-4 py-3">
                                                {rule.offerType ? (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium">
                                                        {rule.offerType}
                                                    </span>
                                                ) : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#0f766e" }}>{subsidy}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{fmt(rule.maxPerEmployee, rule.currencyCode)}</td>
                                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{period}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 text-center">{rule.priority}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => toggleActive(rule)}
                                                    className="text-gray-400 hover:text-teal-600 transition-colors"
                                                    title={rule.isActive ? "Désactiver" : "Activer"}
                                                >
                                                    {rule.isActive
                                                        ? <ToggleRight size={22} className="text-teal-600" />
                                                        : <ToggleLeft size={22} />}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <button onClick={() => openEdit(rule)}
                                                        className="p-1.5 rounded hover:bg-teal-50 text-teal-600">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button onClick={() => setDeleteId(rule.id)}
                                                        className="p-1.5 rounded hover:bg-red-50 text-red-500">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Créer / Modifier */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-gray-900">
                                {modal === "create" ? "Nouvelle règle" : "Modifier la règle"}
                            </h3>
                            <button onClick={() => setModal(null)} className="text-gray-400"><X size={18} /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Libellé *</label>
                                <input type="text" value={form.label}
                                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Catégorie</label>
                                    <input type="text" value={form.category ?? ""}
                                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Type d&#39;offre</label>
                                    <select value={form.offerType ?? ""}
                                        onChange={(e) => setForm((f) => ({ ...f, offerType: e.target.value || undefined }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                                        <option value="">Tous types</option>
                                        {OFFER_TYPES.map((t) => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {numField("subsidyPct", "Subvention (%)")}
                                {numField("subsidyAmount", `Subvention fixe (${form.currencyCode})`)}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {numField("maxPerEmployee", `Plafond / employé (${form.currencyCode})`)}
                                {numField("priority", "Priorité (+ = plus haute)")}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Date début</label>
                                    <input type="date" value={form.startsAt ?? ""}
                                        onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Date fin</label>
                                    <input type="date" value={form.endsAt ?? ""}
                                        onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="isActiveRule"
                                    checked={form.isActive ?? true}
                                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                                    className="w-4 h-4"
                                    style={{ accentColor: "#0f766e" }} />
                                <label htmlFor="isActiveRule" className="text-sm text-gray-700">Règle active</label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setModal(null)}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                                Annuler
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                                style={{ background: "#0f766e" }}>
                                {saving ? "Sauvegarde…" : "Enregistrer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal suppression */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <h3 className="font-bold text-gray-900 mb-2">Supprimer cette règle ?</h3>
                        <p className="text-sm text-gray-500 mb-5">Cette action est irréversible.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteId(null)}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                                Annuler
                            </button>
                            <button onClick={handleDelete}
                                className="px-4 py-2 rounded-lg text-white text-sm bg-red-500">
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
