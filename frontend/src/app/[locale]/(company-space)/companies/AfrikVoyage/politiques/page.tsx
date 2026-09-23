"use client";

import { useState, useEffect, useMemo } from "react";
import {
    ShieldCheck, Plus, Pencil, Trash2, X, Loader2, AlertCircle,
    Star, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { travelPoliciesService, TravelPolicyInput } from "@/services/employes/travel-policies.service";
import { TravelPolicy } from "@/types";
import { DEPARTMENTS } from "@/lib/departments";
import { getErrorMessage } from "@/lib/errors";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";
import { useOptionLabel } from "@/hooks/useOptionLabel";


type Translator = ReturnType<typeof useTranslations<"company.afrikvoyagePolitiques">>;

type FlightClass = "ECONOMY" | "BUSINESS" | "FIRST";

function isFlightClass(value: string | null | undefined): value is FlightClass {
    return value === "ECONOMY" || value === "BUSINESS" || value === "FIRST";
}

const getFlightClassLabels = (tr: Translator): Record<FlightClass, string> => ({
    ECONOMY: tr("economy"),
    BUSINESS: tr("business"),
    FIRST: tr("first"),
});

type BudgetFieldKey = "maxFlightBudget" | "maxHotelBudgetPerNight" | "maxDailyAllowance";

const getBudgetFields = (t: Translator): { key: BudgetFieldKey; label: string }[] => ([
    { key: "maxFlightBudget",        label: t("flightTrip") },
    { key: "maxHotelBudgetPerNight", label: t("hotelNight") },
    { key: "maxDailyAllowance",      label: t("perDiemDay") },
]);

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
    const t = useTranslations("company.afrikvoyagePolitiques");
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
                    placeholder={t("typeEnter")} />
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

/**
 * Sélection de départements par cases à cocher, sourcée sur la liste
 * canonique — remplace un ancien TagInput texte libre où un admin pouvait
 * taper "Technologie" alors que l'employé a "Technologie & IT" dans son
 * profil, rendant la politique invisible pour lui (aucune correspondance
 * exacte lors de la résolution de politique à la création d'une demande).
 */
function DepartmentMultiSelect({
    label, value, onChange,
}: { label: string; value: string[]; onChange: (v: string[]) => void }) {
    const optionLabel = useOptionLabel();
    const toggle = (dept: string) => {
        onChange(value.includes(dept) ? value.filter(d => d !== dept) : [...value, dept]);
    };
    return (
        <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
            <div className="flex flex-wrap gap-2">
                {DEPARTMENTS.map(dept => (
                    <label key={dept}
                        className="flex items-center gap-1.5 px-2.5 py-1 border rounded-full text-xs cursor-pointer transition-colors"
                        style={value.includes(dept)
                            ? { borderColor: "#6366f1", background: "#eef2ff", color: "#4338ca" }
                            : { borderColor: "#e5e7eb", color: "#6b7280" }}>
                        <input type="checkbox" checked={value.includes(dept)}
                            onChange={() => toggle(dept)} className="hidden" />
                        {optionLabel(dept)}
                    </label>
                ))}
            </div>
        </div>
    );
}

export default function PolitiquesPage() {
    const dateLocale = useDateLocale();
    const tr = useTranslations("company.afrikvoyagePolitiques");
    const FLIGHT_CLASS_LABELS = useMemo(() => getFlightClassLabels(tr), [tr]);
    const t = useTranslations("company.afrikvoyagePolitiques");
    const BUDGET_FIELDS = useMemo(() => getBudgetFields(t), [t]);
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
        catch { toast.error(t("unableLoadPolicies")); }
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
            allowedFlightClass:     isFlightClass(p.allowedFlightClass) ? p.allowedFlightClass : null,
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
                toast.success(t("policyUpdated"));
            } else {
                await travelPoliciesService.create(form);
                toast.success(t("policyCreated"));
            }
            closeForm();
            load();
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, t("errorWhileSaving")));
        } finally { setSubmitting(false); }
    };

    const toggleActive = async (p: TravelPolicy) => {
        try {
            await travelPoliciesService.update(p.id, { isActive: !p.isActive });
            toast.success(p.isActive ? t("policyDeactivated") : t("policyActivated"));
            load();
        } catch { toast.error(t("errorWhileUpdating")); }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await travelPoliciesService.remove(deleteId);
            toast.success(t("policyDeleted"));
            setDeleteId(null);
            load();
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, t("unableDelete")));
        } finally { setDeleting(false); }
    };

    const f = (n: number | null | undefined) => n != null ? n.toLocaleString(dateLocale) : "—";

    return (
        <div className="mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
                        <ShieldCheck size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{t("travelPolicies")}</h1>
                        <p className="text-sm text-gray-500">{t("configuredPolicies", { length: policies.length, p2: policies.length !== 1 ? "s" : "" })}</p>
                    </div>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                    <Plus size={16} /> {t("newPolicy")}
                </button>
            </div>

            {/* Formulaire */}
            {showForm && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-semibold text-gray-900">
                            {editing ? t("editPolicy") : t("newTravelPolicy")}
                        </h2>
                        <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                            <X size={16} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Général */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">{t("name")}</label>
                                <input required value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                    placeholder={t("eGStandardEconomy")} />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">{t("description")}</label>
                                <textarea value={form.description ?? ""} rows={2}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none"
                                    placeholder={t("describeMainRules")} />
                            </div>
                        </div>

                        {/* Plafonds budgétaires */}
                        <fieldset className="border border-gray-200 rounded-xl p-4 space-y-3">
                            <legend className="px-2 text-xs font-semibold text-gray-600">{t("budgetCeilings", { currency: form.currency ?? "" })}</legend>
                            <div className="grid grid-cols-3 gap-3">
                                {BUDGET_FIELDS.map(({ key, label }) => (
                                    <div key={key}>
                                        <label className="block text-xs text-gray-500 mb-1">{label}</label>
                                        <input type="number" min={0}
                                            value={form[key] ?? ""}
                                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value ? Number(e.target.value) : null }))}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                                    </div>
                                ))}
                            </div>
                        </fieldset>

                        {/* Règles */}
                        <fieldset className="border border-gray-200 rounded-xl p-4 space-y-3">
                            <legend className="px-2 text-xs font-semibold text-gray-600">{t("bookingRules")}</legend>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">{t("allowedFlightClass")}</label>
                                    <select value={form.allowedFlightClass ?? ""}
                                        onChange={e => setForm(f => ({ ...f, allowedFlightClass: isFlightClass(e.target.value) ? e.target.value : null }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                                        <option value="">{t("noRestriction")}</option>
                                        <option value="ECONOMY">{t("economy")}</option>
                                        <option value="BUSINESS">{t("business")}</option>
                                        <option value="FIRST">{t("first")}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">{t("minimumAdvanceBookingDays")}</label>
                                    <input type="number" min={0}
                                        value={form.maxAdvanceBookingDays ?? ""}
                                        onChange={e => setForm(f => ({ ...f, maxAdvanceBookingDays: e.target.value ? Number(e.target.value) : null }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">{t("autoApprovalThreshold", { currency: form.currency ?? "" })}</label>
                                    <input type="number" min={0}
                                        value={form.approvalThreshold ?? ""}
                                        onChange={e => setForm(f => ({ ...f, approvalThreshold: e.target.value ? Number(e.target.value) : null }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                                        placeholder={t("belowAutoApproved")} />
                                </div>
                                <div className="flex items-center gap-3 pt-4">
                                    <label className="text-xs text-gray-700">{t("approvalRequired")}</label>
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
                            <TagInput label={t("allowedDestinations")}
                                value={form.allowedDestinations ?? []}
                                onChange={v => setForm(f => ({ ...f, allowedDestinations: v }))} />
                            <TagInput label={t("forbiddenDestinations")}
                                value={form.restrictedDestinations ?? []}
                                onChange={v => setForm(f => ({ ...f, restrictedDestinations: v }))} />
                        </div>
                        <DepartmentMultiSelect label={t("departmentsConcernedEmptyAll")}
                            value={form.appliesToDepartments ?? []}
                            onChange={v => setForm(f => ({ ...f, appliesToDepartments: v }))} />

                        {/* Options */}
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={form.isDefault ?? false}
                                    onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                                    className="accent-indigo-600" />
                                {t("defaultPolicy")}
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={form.isActive ?? true}
                                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                                    className="accent-indigo-600" />
                                {t("active")}
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={closeForm}
                                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                                {t("cancel")}
                            </button>
                            <button type="submit" disabled={submitting}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60">
                                {submitting && <Loader2 size={14} className="animate-spin" />}
                                {editing ? t("save") : t("create")}
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
                    <p className="text-gray-500 font-medium">{t("noPolicyConfigured")}</p>
                    <p className="text-sm text-gray-400 mt-1">{t("defineTravelRulesApplicable")}</p>
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
                                                    <Star size={10} /> {t("default")}
                                                </span>
                                            )}
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                {p.isActive ? t("active") : t("inactive")}
                                            </span>
                                        </div>
                                        {p.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{p.description}</p>}
                                        <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                                            {p.maxFlightBudget && <span>✈ {f(p.maxFlightBudget)} {p.currency}</span>}
                                            {p.maxHotelBudgetPerNight && <span>{t("night", { p1: f(p.maxHotelBudgetPerNight) })}</span>}
                                            {isFlightClass(p.allowedFlightClass) && <span>💺 {FLIGHT_CLASS_LABELS[p.allowedFlightClass]}</span>}
                                            <span>{t("request", { p1: p._count?.travelRequests ?? 0, p2: (p._count?.travelRequests ?? 0) !== 1 ? "s" : "" })}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button onClick={() => toggleActive(p)} title={p.isActive ? t("deactivate") : t("activate")}
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
                                            [tr("perDiemDay"), p.maxDailyAllowance ? `${f(p.maxDailyAllowance)} ${p.currency}` : "—"],
                                            [t("minBooking"), p.maxAdvanceBookingDays ? t("dayS", { maxAdvanceBookingDays: p.maxAdvanceBookingDays }) : "—"],
                                            [tr("autoApprovalThresholdShort"), p.approvalThreshold ? `${f(p.approvalThreshold)} ${p.currency}` : "—"],
                                            [tr("approvalRequired"), p.requiresApproval ? t("yes") : t("no")],
                                            [t("allowedDestinations"), p.allowedDestinations.length ? p.allowedDestinations.join(", ") : t("all")],
                                            [tr("prohibitedDestinations"), p.restrictedDestinations.length ? p.restrictedDestinations.join(", ") : t("none")],
                                            [t("departments"), p.appliesToDepartments.length ? p.appliesToDepartments.join(", ") : t("all2")],
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
                                <p className="font-semibold text-gray-900">{t("deletePolicy")}</p>
                                <p className="text-sm text-gray-500">{t("cannotDoneIfLinked")}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} disabled={deleting}
                                className="flex-1 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                                {t("cancel")}
                            </button>
                            <button onClick={confirmDelete} disabled={deleting}
                                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
                                {deleting && <Loader2 size={14} className="animate-spin" />}
                                {t("delete")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
