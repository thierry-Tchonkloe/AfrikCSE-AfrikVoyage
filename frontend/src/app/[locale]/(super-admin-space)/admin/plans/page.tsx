"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Save, Building2, Users } from "lucide-react";
import { plansService, PlanConfig, PlanConfigPayload } from "@/services/admin/plans.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";

const emptyForm: PlanConfigPayload & { name: string } = {
    name: "",
    label: "",
    price: "",
    maxUsers: null,
    hasVoyage: false,
    hasCSE: false,
    features: [],
    isActive: true,
    pricePerEmployee: undefined,
    billingCycle: "",
    apiAccess: false,
    webhookAccess: false,
};

export default function PlansPage() {
    const dateLocale = useDateLocale();
    const t = useTranslations("admin.plans");
    const [plans, setPlans]       = useState<PlanConfig[]>([]);
    const [loading, setLoading]   = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<PlanConfig | null>(null);
    const [form, setForm]           = useState(emptyForm);
    const [featuresText, setFeaturesText] = useState("");
    const [saving, setSaving]       = useState(false);

    const [deleteId, setDeleteId]   = useState<string | null>(null);
    const [deleting, setDeleting]   = useState(false);

    const load = async () => {
        setLoading(true);
        try {
        const data = await plansService.getAll();
        setPlans(data);
        } catch {
        toast.error(t("errorLoadingPlans"));
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setFeaturesText("");
        setModalOpen(true);
    };

    const openEdit = (plan: PlanConfig) => {
        setEditing(plan);
        setForm({
        name: plan.name,
        label: plan.label,
        price: plan.price,
        maxUsers: plan.maxUsers,
        hasVoyage: plan.hasVoyage,
        hasCSE: plan.hasCSE,
        features: plan.features,
        isActive: plan.isActive,
        pricePerEmployee: plan.pricePerEmployee ? parseFloat(plan.pricePerEmployee) : undefined,
        billingCycle: plan.billingCycle ?? "",
        apiAccess: plan.apiAccess,
        webhookAccess: plan.webhookAccess,
        });
        setFeaturesText(plan.features.join("\n"));
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.label.trim() || !form.price.trim() || (!editing && !form.name.trim())) {
        toast.error(t("pleaseFillRequiredFields"));
        return;
        }

        setSaving(true);
        const features = featuresText.split("\n").map((f) => f.trim()).filter(Boolean);
        try {
        if (editing) {
            await plansService.update(editing.id, {
            label: form.label,
            price: form.price,
            maxUsers: form.maxUsers,
            hasVoyage: form.hasVoyage,
            hasCSE: form.hasCSE,
            features,
            isActive: form.isActive,
            pricePerEmployee: form.pricePerEmployee,
            billingCycle: form.billingCycle || undefined,
            apiAccess: form.apiAccess,
            webhookAccess: form.webhookAccess,
            });
            toast.success(t("planUpdated"));
        } else {
            await plansService.create({
            name: form.name.toUpperCase().replace(/\s+/g, "_"),
            label: form.label,
            price: form.price,
            maxUsers: form.maxUsers,
            hasVoyage: form.hasVoyage,
            hasCSE: form.hasCSE,
            features,
            isActive: form.isActive,
            pricePerEmployee: form.pricePerEmployee,
            billingCycle: form.billingCycle || undefined,
            apiAccess: form.apiAccess,
            webhookAccess: form.webhookAccess,
            });
            toast.success(t("planCreated"));
        }
        setModalOpen(false);
        load();
        } catch (err) {
        toast.error(getErrorMessage(err, t("errorWhileSaving")));
        } finally {
        setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
        await plansService.remove(deleteId);
        toast.success(t("planDeleted"));
        setDeleteId(null);
        load();
        } catch (err) {
        toast.error(getErrorMessage(err, t("errorWhileDeleting")));
        } finally {
        setDeleting(false);
        }
    };

    const handleToggleActive = async (plan: PlanConfig) => {
        try {
        await plansService.update(plan.id, { isActive: !plan.isActive });
        setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, isActive: !p.isActive } : p)));
        } catch {
        toast.error(t("errorWhileUpdating"));
        }
    };

    return (
        <div className="space-y-5">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">{t("pricingPlans")}</h1>
            <p className="text-sm text-gray-500">
                {t("manageCatalogPlansOffered")}
            </p>
            </div>
            <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: "var(--color-primary)" }}
            >
            <Plus size={15} /> {t("addPlan")}
            </button>
        </div>

        {/* Cartes plans */}
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-72 bg-white rounded-xl border border-gray-200 animate-pulse" />
            ))}
            </div>
        ) : plans.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">
            {t("noPlanConfigured")}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <div>
                    <p className="text-xs font-mono text-gray-400">{plan.name}</p>
                    <h3 className="text-lg font-bold text-gray-900">{plan.label}</h3>
                    </div>
                    <button
                    type="button"
                    onClick={() => handleToggleActive(plan)}
                    className="relative w-10 h-5.5 rounded-full transition-colors shrink-0"
                    title={plan.isActive ? t("activePlan") : t("inactivePlan")}
                    style={{ background: plan.isActive ? "var(--color-primary)" : "#d1d5db" }}
                    >
                    <span
                        className="absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform"
                        style={{ transform: plan.isActive ? "translateX(18px)" : "translateX(0px)" }}
                    />
                    </button>
                </div>

                <p className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                    {plan.price}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Users size={13} />
                    {plan.maxUsers ? t("upUsers", { maxUsers: plan.maxUsers }) : t("unlimitedUsers")}
                </div>

                {plan.pricePerEmployee && (
                    <p className="text-xs text-gray-500">
                        {t("fcfaActiveEmployee", { p1: parseFloat(plan.pricePerEmployee).toLocaleString(dateLocale), p2: (plan.billingCycle && ` · ${plan.billingCycle}`) || "" })}
                    </p>
                )}

                <div className="flex gap-1.5 flex-wrap">
                    {plan.hasCSE && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: "#0f766e", background: "#0f766e18" }}>
                        {t("afrikcse")}
                    </span>
                    )}
                    {plan.hasVoyage && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: "#f59e0b", background: "#f59e0b18" }}>
                        {t("afrikvoyage")}
                    </span>
                    )}
                </div>

                <ul className="text-sm text-gray-600 space-y-1 flex-1">
                    {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">✓</span> {f}
                    </li>
                    ))}
                    {plan.features.length === 0 && (
                    <li className="text-gray-400">{t("noFeatureListed")}</li>
                    )}
                </ul>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <Building2 size={13} />
                    {t("companiesPlan", { orgCount: plan.orgCount, p2: plan.orgCount > 1 ? "s" : "" })}
                </div>

                <div className="flex gap-2 pt-1">
                    <button
                    onClick={() => openEdit(plan)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                    <Pencil size={13} /> {t("edit")}
                    </button>
                    <button
                    onClick={() => setDeleteId(plan.id)}
                    disabled={plan.orgCount > 0}
                    title={plan.orgCount > 0 ? t("planUsedOrganizations") : t("delete")}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-gray-200 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                    <Trash2 size={13} />
                    </button>
                </div>
                </div>
            ))}
            </div>
        )}

        {/* ── Modal création/édition ── */}
        {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" style={{ width: "520px", maxWidth: "100%" }}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
                <h3 className="font-bold text-gray-900">{editing ? t("edit2", { label: editing.label }) : t("newPlan")}</h3>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                    <X size={18} />
                </button>
                </div>
                <div className="p-5 space-y-4">
                {!editing && (
                    <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t("identifierUppercase")}
                    </label>
                    <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
                        placeholder={t("exPremium")}
                        className={inp}
                    />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{t("displayName")}</label>
                    <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={inp} />
                    </div>
                    <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{t("displayedPrice")}</label>
                    <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder={t("eG175000")} className={inp} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("maximumNumberUsersEmpty")}
                    </label>
                    <input
                    type="number"
                    min={1}
                    value={form.maxUsers ?? ""}
                    onChange={(e) => setForm({ ...form, maxUsers: e.target.value ? parseInt(e.target.value) : null })}
                    className={inp}
                    />
                </div>

                <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">{t("includedModules")}</p>
                    <div className="flex gap-3">
                    {[
                        { key: "hasCSE" as const, label: t("afrikcse"), color: "#0f766e" },
                        { key: "hasVoyage" as const, label: t("afrikvoyage"), color: "#f59e0b" },
                    ].map((mod) => (
                        <label
                        key={mod.key}
                        className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm"
                        style={form[mod.key] ? { borderColor: mod.color, background: mod.color + "10", color: mod.color } : { borderColor: "#e5e7eb", color: "#6b7280" }}
                        >
                        <input
                            type="checkbox"
                            checked={form[mod.key]}
                            onChange={(e) => setForm({ ...form, [mod.key]: e.target.checked })}
                            style={{ accentColor: mod.color }}
                        />
                        {mod.label}
                        </label>
                    ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{t("pricePerActiveEmployee")}</label>
                    <input
                        type="number" min={0}
                        value={form.pricePerEmployee ?? ""}
                        onChange={(e) => setForm({ ...form, pricePerEmployee: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder={t("ex2500")}
                        className={inp}
                    />
                    </div>
                    <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{t("billingCycle")}</label>
                    <select value={form.billingCycle ?? ""} onChange={e => setForm({ ...form, billingCycle: e.target.value })} className={inp}>
                        <option value="">—</option>
                        <option value="mensuel">{t("monthly")}</option>
                        <option value="trimestriel">{t("quarterly")}</option>
                        <option value="annuel">{t("yearly")}</option>
                    </select>
                    </div>
                </div>

                <div className="flex gap-3">
                    {[
                    { key: "apiAccess" as const, label: t("apiAccess") },
                    { key: "webhookAccess" as const, label: t("webhooks") },
                    ].map(opt => (
                    <label key={opt.key} className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm ${form[opt.key] ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500"}`}>
                        <input type="checkbox" checked={!!form[opt.key]} onChange={e => setForm({ ...form, [opt.key]: e.target.checked })} />
                        {opt.label}
                    </label>
                    ))}
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("featuresOnePerLine")}
                    </label>
                    <textarea
                    value={featuresText}
                    onChange={(e) => setFeaturesText(e.target.value)}
                    rows={5}
                    placeholder={t("cseBenefitsManagement")}
                    className={inp + " resize-none"}
                    />
                </div>

                <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{t("activePlan")}</span>
                    <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className="relative w-11 h-6 rounded-full transition-colors shrink-0"
                    style={{ background: form.isActive ? "var(--color-primary)" : "#d1d5db" }}
                    >
                    <span
                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                        style={{ transform: form.isActive ? "translateX(20px)" : "translateX(0px)" }}
                    />
                    </button>
                </label>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                    {t("cancel")}
                    </button>
                    <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white disabled:opacity-70"
                    style={{ background: "var(--color-primary)" }}
                    >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {t("save")}
                    </button>
                </div>
                </div>
            </div>
            </div>
        )}

        {/* ── Modal confirmation suppression ── */}
        {deleteId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl" style={{ width: "420px", maxWidth: "100%" }}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">{t("deletePlan")}</h3>
                <button onClick={() => setDeleteId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                    <X size={18} />
                </button>
                </div>
                <div className="p-5">
                <p className="text-sm text-gray-500 mb-5">
                    {t("actionCannotUndonePlan")}
                </p>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                    {t("cancel")}
                    </button>
                    <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white bg-red-500 disabled:opacity-70"
                    >
                    {deleting && <Loader2 size={14} className="animate-spin" />}
                    {t("delete")}
                    </button>
                </div>
                </div>
            </div>
            </div>
        )}
        </div>
    );
}

const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400 bg-white text-gray-900";
