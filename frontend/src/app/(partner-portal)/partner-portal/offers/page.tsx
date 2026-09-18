"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, X, Loader2, Layers, Settings, ImagePlus } from "lucide-react";
import { partnerPortalService, PartnerOffer, OfferInput } from "@/services/partner/partner-portal.service";
import { OfferCard } from "@/components/partner-portal/OfferCard";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const EMPTY_FORM: OfferInput = { title: "", category: "", employeePrice: 0, companyPrice: 0, subsidyPct: 0 };

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3 Mo — doit rester cohérent avec offerImageUpload côté backend

export default function PartnerOffersPage() {
    const router = useRouter();
    const [offers, setOffers]     = useState<PartnerOffer[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading]   = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing]   = useState<PartnerOffer | null>(null);
    const [form, setForm]         = useState<OfferInput>(EMPTY_FORM);
    const [saving, setSaving]     = useState(false);
    // L'image n'est envoyée au serveur qu'au clic sur "Enregistrer", avec le reste du
    // formulaire — pas d'upload instantané à la sélection du fichier (juste un aperçu local).
    const [imageFile, setImageFile]       = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetImagePick = () => {
        setImagePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
        setImageFile(null);
    };

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

    useEffect(() => {
        partnerPortalService.listOfferCategories()
            .then(setCategories)
            .catch(() => toast.error("Erreur chargement des catégories"));
    }, []);

    const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); resetImagePick(); setShowModal(true); };
    const openEdit   = (o: PartnerOffer) => {
        setEditing(o);
        setForm({
            title:         o.title,
            description:   o.description ?? "",
            imageUrl:      o.imageUrl ?? undefined,
            employeePrice: o.employeePrice,
            companyPrice:  o.companyPrice,
            subsidyPct:    o.subsidyPct,
            category:      o.category,
            stock:         o.stock ?? undefined,
            validUntil:    o.validUntil ? o.validUntil.slice(0, 10) : "",
        });
        resetImagePick();
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); resetImagePick(); };

    const handleSave = async () => {
        if (!form.title.trim() || !form.category.trim() || form.employeePrice <= 0 || form.companyPrice <= 0) {
            toast.error("Titre, catégorie et prix requis");
            return;
        }
        if (!imageFile && !form.imageUrl) {
            toast.error("Une image est requise pour l'offre");
            return;
        }
        setSaving(true);
        try {
            // L'image part avec le reste du formulaire, au clic sur "Enregistrer" :
            // upload (si un nouveau fichier a été choisi) puis création/mise à jour de l'offre.
            const imageUrl = imageFile ? (await partnerPortalService.uploadOfferImage(imageFile)).imageUrl : form.imageUrl;
            const payload = {
                ...form,
                imageUrl,
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
            closeModal();
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la sauvegarde"));
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (offer: PartnerOffer) => {
        const nextActive = !offer.isActive;
        try {
            const updated = await partnerPortalService.toggleOfferActive(offer.id, nextActive);
            setOffers((prev) => prev.map((o) => (o.id === offer.id ? updated : o)));
            toast.success(nextActive ? "Offre visible par les employés" : "Offre masquée");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors du changement de visibilité"));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // permet de re-sélectionner le même fichier
        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            toast.error("Format non supporté (JPG, PNG ou WEBP uniquement)");
            return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            toast.error("Image trop volumineuse (3 Mo maximum)");
            return;
        }

        setImageFile(file);
        setImagePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
    };

    const previewSrc = imagePreview ?? form.imageUrl;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Offres</h1>
                    <p className="text-xs text-gray-500 mt-0.5">{offers.length} offre{offers.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => router.push("/partner-portal/settings")}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition">
                        <Settings size={16} /> Paramètres
                    </button>
                    <button onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition">
                        <Plus size={16} /> Nouvelle offre
                    </button>
                </div>
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
                <motion.div
                    variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                    initial="hidden"
                    animate="show"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                >
                    {offers.map((o) => (
                        <OfferCard key={o.id} offer={o} onEdit={openEdit} onToggleActive={handleToggleActive} />
                    ))}
                </motion.div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-gray-900 dark:text-white">
                                {editing ? "Modifier l'offre" : "Nouvelle offre"}
                            </h2>
                            <button onClick={closeModal} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <Field label="Image *">
                                <div className="flex items-center gap-3">
                                    {previewSrc ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={previewSrc} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                            <ImagePlus size={20} />
                                        </div>
                                    )}
                                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={saving}
                                        className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1.5">
                                        <ImagePlus size={13} />
                                        {previewSrc ? "Changer" : "Ajouter une image"}
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                                        onChange={handleImageChange} className="hidden" />
                                </div>
                                <p className="text-xs text-gray-400">L&apos;image sera envoyée avec le reste du formulaire, au clic sur « Enregistrer ».</p>
                            </Field>
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
                                    {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                                {categories.length === 0 && (
                                    <p className="text-xs text-amber-600">Aucune catégorie disponible actuellement.</p>
                                )}
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
                            <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2.5 py-2">
                                {editing ? "Toute modification renvoie l'offre en validation auprès du Super Admin." : "Cette offre sera soumise au Super Admin avant d'être visible par les employés."}
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={closeModal}
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
