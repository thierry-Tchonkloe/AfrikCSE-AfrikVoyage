"use client";

import { useState, useEffect } from "react";
import {
    ShieldCheck, Plus, Pencil, Trash2, X, Loader2, AlertCircle,
    Star, StarOff, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { travelPoliciesService, TravelPolicyInput } from "@/services/employes/travel-policies.service";
import { TravelPolicy } from "@/types";

const FLIGHT_CLASS_LABELS: Record<string, string> = {
    ECONOMY: "Économique",
    BUSINESS: "Affaires",
    FIRST: "Première",
};

const EMPTY_FORM: TravelPolicyInput = {
    name: "",
    description: "",
    isDefault: false,
    isActive: true,
    currency: "XOF",
    requiresApproval: true,
    allowedFlightClass: null,
    maxFlightBudget: null,
    maxHotelBudgetPerNight: null,
    maxDailyAllowance: null,
    maxAdvanceBookingDays: null,
    approvalThreshold: null,
    allowedDestinations: [],
    restrictedDestinations: [],
    appliesToDepartments: [],
};

function TagInput({
    label, value, onChange,
}: { label: string; value: string[]; onChange: (v: string[]) => void }) {
    const [input, setInput] = useState("");
    const add = () => {
        const v = input.trim();
        if (v && !value.includes(v)) onChange([...value, v]);
        setInput("");
    };
    return (
        <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
            <div className="flex gap-2 mb-1.5">
                <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    placeholder="Taper + Entrée" />
                <button type="button" onClick={add}
                    className="px-3 py-1.5 text-sm rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                    <Plus size={14} />
                </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {value.map(v => (
                    <span key={v} className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {v}
                        <button onClick={() => onChange(value.filter(x => x !== v))} className="text-gray-400 hover:text-red-500">
                            <X size={10} />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function PolitiquesPage() {
    const [policies, setPolicies]       = useState<TravelPolicy[]>([]);
    const [loading, setLoading]         = useState(true);
    const [showForm, setShowForm]       = useState(false);
    const [editing, setEditing]         = useState<TravelPolicy | null>(null);
    const [form, setForm]               = useState<TravelPolicyInput>(EMPTY_FORM);
    const [submitting, setSubmitting]   = useState(false);
    const [deleteId, setDeleteId]       = useState<string | null>(null);
    const [deleting, setDeleting]       = useState(false);
    const [expandedId, setExpandedId]   = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try { setPolicies(await travelPoliciesService.getAll()); }
        catch { toast.error("Impossible de charger les politiques"); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
    const openEdit   = (p: TravelPolicy) => {
        setEditing(p);
        setForm({
            name:                   p.name,
            description:            p.description ?? "",
            isDefault:              p.isDefault,
            isActive:               p.isActive,
            currency:               p.currency,
            requiresApproval:       p.requiresApproval,
            allowedFlightClass:     p.allowedFlightClass as any ?? null,
            maxFlightBudget:        p.maxFlightBudget ?? null,
            maxHotelBudgetPerNight: p.maxHotelBudgetPerNight ?? null,
            maxDailyAllowance:      p.maxDailyAllowance ?? null,
            maxAdvanceBookingDays:  p.maxAdvanceBookingDays ?? null,
            approvalThreshold:      p.approvalThreshold ?? null,
            allowedDestinations:    p.allowedDestinations ?? [],
            restrictedDestinations: p.restrictedDestinations ?? [],
            appliesToDepartments:   p.appliesToDepartments ?? [],
        });
        setShowForm(true);
    };

    const closeForm = () => { setShowForm(false); setEditing(null); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editing) {
                await travelPoliciesService.update(editing.id, form);
                toast.success("Politique mise à jour");
            } else {
                await travelPoliciesService.create(form);
                toast.success("Politique créée");
            }
            closeForm();
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Erreur lors de l'enregistrement");
        } finally { setSubmitting(false); }
    };

    const toggleActive = async (p: TravelPolicy) => {
        try {
            await travelPoliciesService.update(p.id, { isActive: !p.isActive });
            toast.success(p.isActive ? "Politique désactivée" : "Politique activée");
            load();
        } catch { toast.error("Erreur lors de la mise à jour"); }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await travelPoliciesService.remove(deleteId);
            toast.success("Politique supprimée");
            setDeleteId(null);
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Suppression impossible");
        } finally { setDeleting(false); }
    };

    const f = (n: number | null | undefined) => n != null ? n.toLocaleString("fr-FR") : "—";

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
                        <ShieldCheck size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Politiques de voyage</h1>
                        <p className="text-sm text-gray-500">{policies.length} politique{policies.length !== 1 ? "s" : ""} configurée{policies.length !== 1 ? "s" : ""}</p>
                    </div>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                    <Plus size={16} /> Nouvelle politique
                </button>
            </div>

            {/* Formulaire */}
            {showForm && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-semibold text-gray-900">
                            {editing ? "Modifier la politique" : "Nouvelle politique de voyage"}
                        </h2>
                        <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                            <X size={16} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Général */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                                <input required value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                    placeholder="ex. Politique Économique Standard" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                <textarea value={form.description ?? ""} rows={2}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none"
                                    placeholder="Décrivez les règles principales..." />
                            </div>
                        </div>

                        {/* Plafonds budgétaires */}
                        <fieldset className="border border-gray-200 rounded-xl p-4 space-y-3">
                            <legend className="px-2 text-xs font-semibold text-gray-600">Plafonds budgétaires ({form.currency})</legend>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { key: "maxFlightBudget",        label: "Vol / trajet" },
                                    { key: "maxHotelBudgetPerNight", label: "Hôtel / nuit" },
                                    { key: "maxDailyAllowance",      label: "Per diem / jour" },
                                ].map(({ key, label }) => (
                                    <div key={key}>
                                        <label className="block text-xs text-gray-500 mb-1">{label}</label>
                                        <input type="number" min={0}
                                            value={(form as any)[key] ?? ""}
                                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value ? Number(e.target.value) : null }))}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                                    </div>
                                ))}
                            </div>
                        </fieldset>

                        {/* Règles */}
                        <fieldset className="border border-gray-200 rounded-xl p-4 space-y-3">
                            <legend className="px-2 text-xs font-semibold text-gray-600">Règles de réservation</legend>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Classe de vol autorisée</label>
                                    <select value={form.allowedFlightClass ?? ""}
                                        onChange={e => setForm(f => ({ ...f, allowedFlightClass: e.target.value || null as any }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                                        <option value="">Sans restriction</option>
                                        <option value="ECONOMY">Économique</option>
                                        <option value="BUSINESS">Affaires</option>
                                        <option value="FIRST">Première</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Réservation min. à l'avance (jours)</label>
                                    <input type="number" min={0}
                                        value={form.maxAdvanceBookingDays ?? ""}
                                        onChange={e => setForm(f => ({ ...f, maxAdvanceBookingDays: e.target.value ? Number(e.target.value) : null }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Seuil d'approbation auto ({form.currency})</label>
                                    <input type="number" min={0}
                                        value={form.approvalThreshold ?? ""}
                                        onChange={e => setForm(f => ({ ...f, approvalThreshold: e.target.value ? Number(e.target.value) : null }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                                        placeholder="En dessous = auto-approuvé" />
                                </div>
                                <div className="flex items-center gap-3 pt-4">
                                    <label className="text-xs text-gray-700">Approbation requise</label>
                                    <button type="button" onClick={() => setForm(f => ({ ...f, requiresApproval: !f.requiresApproval }))}>
                                        {form.requiresApproval
                                            ? <ToggleRight size={28} className="text-indigo-600" />
                                            : <ToggleLeft size={28} className="text-gray-400" />}
                                    </button>
                                </div>
                            </div>
                        </fieldset>

                        {/* Destinations */}
                        <div className="grid grid-cols-2 gap-4">
                            <TagInput label="Destinations autorisées"
                                value={form.allowedDestinations ?? []}
                                onChange={v => setForm(f => ({ ...f, allowedDestinations: v }))} />
                            <TagInput label="Destinations interdites"
                                value={form.restrictedDestinations ?? []}
                                onChange={v => setForm(f => ({ ...f, restrictedDestinations: v }))} />
                        </div>
                        <TagInput label="Services / départements concernés (vide = tous)"
                            value={form.appliesToDepartments ?? []}
                            onChange={v => setForm(f => ({ ...f, appliesToDepartments: v }))} />

                        {/* Options */}
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={form.isDefault ?? false}
                                    onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                                    className="accent-indigo-600" />
                                Politique par défaut
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={form.isActive ?? true}
                                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                                    className="accent-indigo-600" />
                                Active
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={closeForm}
                                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                                Annuler
                            </button>
                            <button type="submit" disabled={submitting}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60">
                                {submitting && <Loader2 size={14} className="animate-spin" />}
                                {editing ? "Enregistrer" : "Créer"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Liste */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
            ) : policies.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
                    <ShieldCheck size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">Aucune politique configurée</p>
                    <p className="text-sm text-gray-400 mt-1">Définissez les règles de voyage applicables à vos collaborateurs.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {policies.map(p => {
                        const expanded = expandedId === p.id;
                        return (
                            <div key={p.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                                <div className="flex items-center gap-4 px-5 py-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                                            {p.isDefault && (
                                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                                                    <Star size={10} /> Défaut
                                                </span>
                                            )}
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                {p.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                        {p.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{p.description}</p>}
                                        <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                                            {p.maxFlightBudget && <span>✈ {f(p.maxFlightBudget)} {p.currency}</span>}
                                            {p.maxHotelBudgetPerNight && <span>🏨 {f(p.maxHotelBudgetPerNight)}/nuit</span>}
                                            {p.allowedFlightClass && <span>💺 {FLIGHT_CLASS_LABELS[p.allowedFlightClass]}</span>}
                                            <span>{p._count?.travelRequests ?? 0} demande{(p._count?.travelRequests ?? 0) !== 1 ? "s" : ""}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button onClick={() => toggleActive(p)} title={p.isActive ? "Désactiver" : "Activer"}
                                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600">
                                            {p.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                        </button>
                                        <button onClick={() => openEdit(p)}
                                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600">
                                            <Pencil size={15} />
                                        </button>
                                        <button onClick={() => setDeleteId(p.id)}
                                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600">
                                            <Trash2 size={15} />
                                        </button>
                                        <button onClick={() => setExpandedId(expanded ? null : p.id)}
                                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                                            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                        </button>
                                    </div>
                                </div>
                                {expanded && (
                                    <div className="border-t border-gray-100 px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                        {[
                                            ["Per diem / jour", p.maxDailyAllowance ? `${f(p.maxDailyAllowance)} ${p.currency}` : "—"],
                                            ["Réservation min.", p.maxAdvanceBookingDays ? `${p.maxAdvanceBookingDays} jour(s)` : "—"],
                                            ["Seuil auto-approbation", p.approvalThreshold ? `${f(p.approvalThreshold)} ${p.currency}` : "—"],
                                            ["Approbation requise", p.requiresApproval ? "Oui" : "Non"],
                                            ["Destinations autorisées", p.allowedDestinations.length ? p.allowedDestinations.join(", ") : "Toutes"],
                                            ["Destinations interdites", p.restrictedDestinations.length ? p.restrictedDestinations.join(", ") : "Aucune"],
                                            ["Départements", p.appliesToDepartments.length ? p.appliesToDepartments.join(", ") : "Tous"],
                                        ].map(([k, v]) => (
                                            <div key={k as string}>
                                                <p className="text-gray-400">{k}</p>
                                                <p className="font-medium text-gray-700 mt-0.5">{v}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Confirmation suppression */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-red-100 text-red-600"><AlertCircle size={20} /></div>
                            <div>
                                <p className="font-semibold text-gray-900">Supprimer cette politique ?</p>
                                <p className="text-sm text-gray-500">Impossible si elle est liée à des demandes.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} disabled={deleting}
                                className="flex-1 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                                Annuler
                            </button>
                            <button onClick={confirmDelete} disabled={deleting}
                                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
                                {deleting && <Loader2 size={14} className="animate-spin" />}
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
