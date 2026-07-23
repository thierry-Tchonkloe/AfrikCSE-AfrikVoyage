"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, ToggleLeft, ToggleRight, X, Loader2, Layers } from "lucide-react";
import { partnerPortalService, PartnerOffer, OfferInput } from "@/services/partner/partner-portal.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const EMPTY_FORM: OfferInput = { title: "", category: "", employeePrice: 0, companyPrice: 0, subsidyPct: 0, isActive: true };

const CATEGORIES = ["Restauration", "Loisirs", "Sport", "Culture", "Bien-être", "Transport", "Éducation", "Autre"];

export default function PartnerOffersPage() {
    const [offers, setOffers]     = useState<PartnerOffer[]>([]);
    const [loading, setLoading]   = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing]   = useState<PartnerOffer | null>(null);
    const [form, setForm]         = useState<OfferInput>(EMPTY_FORM);
    const [saving, setSaving]     = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setOffers(await partnerPortalService.listOffers());
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur de chargement"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
    const openEdit   = (o: PartnerOffer) => {
        setEditing(o);
        setForm({
            title:         o.title,
            description:   o.description ?? "",
            employeePrice: o.employeePrice,
            companyPrice:  o.companyPrice,
            subsidyPct:    o.subsidyPct,
            category:      o.category,
            stock:         o.stock ?? undefined,
            validUntil:    o.validUntil ? o.validUntil.slice(0, 10) : "",
            isActive:      o.isActive,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.category.trim() || form.employeePrice <= 0 || form.companyPrice <= 0) {
            toast.error("Titre, catégorie et prix requis");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
            };
            if (editing) {
                const updated = await partnerPortalService.updateOffer(editing.id, payload);
                setOffers((prev) => prev.map((o) => o.id === editing.id ? updated : o));
                toast.success("Offre mise à jour");
            } else {
                const created = await partnerPortalService.createOffer(payload);
                setOffers((prev) => [created, ...prev]);
                toast.success("Offre créée");
            }
            setShowModal(false);
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la sauvegarde"));
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (o: PartnerOffer) => {
        try {
            const updated = await partnerPortalService.updateOffer(o.id, { isActive: !o.isActive });
            setOffers((prev) => prev.map((x) => x.id === o.id ? updated : x));
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        }
    };

    const fmt = (v: number) => new Intl.NumberFormat("fr-FR").format(v);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Offres</h1>
                    <p className="text-xs text-gray-500 mt-0.5">{offers.length} offre{offers.length !== 1 ? "s" : ""}</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition">
                    <Plus size={16} /> Nouvelle offre
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : offers.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <Layers className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">Aucune offre</p>
                    <p className="text-xs text-gray-400 mt-1">Créez votre première offre pour la rendre disponible aux employés.</p>
                    <button onClick={openCreate}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl transition">
                        Créer une offre
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {offers.map((o) => (
                        <div key={o.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{o.title}</p>
                                    {o.category && <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded px-1.5 py-0.5">{o.category}</span>}
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                    <button onClick={() => openEdit(o)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => toggleActive(o)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                        {o.isActive
                                            ? <ToggleRight size={18} className="text-green-500" />
                                            : <ToggleLeft  size={18} className="text-gray-400" />}
                                    </button>
                                </div>
                            </div>

                            {o.description && (
                                <p className="text-xs text-gray-500 line-clamp-2">{o.description}</p>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {fmt(o.employeePrice)} <span className="text-xs font-normal text-gray-400">XOF employé</span>
                                    <span className="text-xs font-normal text-gray-400"> · {fmt(o.companyPrice)} entreprise</span>
                                </p>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    o.isActive ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                               : "bg-gray-100 text-gray-500"
                                }`}>
                                    {o.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-gray-900 dark:text-white">
                                {editing ? "Modifier l'offre" : "Nouvelle offre"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <Field label="Titre *">
                                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                    className="input-field" placeholder="Ex. Menu déjeuner" />
                            </Field>
                            <Field label="Description">
                                <textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                    rows={2} className="input-field resize-none" placeholder="Décrivez l'offre…" />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Prix employé *">
                                    <input type="number" min={0} value={form.employeePrice}
                                        onChange={(e) => setForm((f) => ({ ...f, employeePrice: parseFloat(e.target.value) || 0 }))}
                                        className="input-field" />
                                </Field>
                                <Field label="Prix entreprise *">
                                    <input type="number" min={0} value={form.companyPrice}
                                        onChange={(e) => setForm((f) => ({ ...f, companyPrice: parseFloat(e.target.value) || 0 }))}
                                        className="input-field" />
                                </Field>
                            </div>
                            <Field label="Catégorie *">
                                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                                    className="input-field">
                                    <option value="">— Choisir —</option>
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Stock">
                                    <input type="number" min={1} value={form.stock ?? ""}
                                        onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value ? parseInt(e.target.value) : undefined }))}
                                        className="input-field" placeholder="—" />
                                </Field>
                                <Field label="Valide jusqu'au">
                                    <input type="date" value={form.validUntil ?? ""}
                                        onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                                        className="input-field" />
                                </Field>
                            </div>
                            <Field label="Subvention (%)">
                                <input type="number" min={0} max={100} value={form.subsidyPct ?? 0}
                                    onChange={(e) => setForm((f) => ({ ...f, subsidyPct: parseInt(e.target.value) || 0 }))}
                                    className="input-field" />
                            </Field>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isActive ?? true}
                                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Offre active (visible par les employés)</span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">
                                Annuler
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .input-field {
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    font-size: 0.875rem;
                    border-radius: 0.75rem;
                    border: 1px solid #e5e7eb;
                    background: white;
                    outline: none;
                    transition: border-color 0.15s;
                }
                .input-field:focus { border-color: #2563eb; }
                :global(.dark) .input-field { background: #1f2937; border-color: #374151; color: white; }
                select.input-field { appearance: auto; }
            `}</style>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
            {children}
        </div>
    );
}
