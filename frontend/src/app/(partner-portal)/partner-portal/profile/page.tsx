"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Save, Loader2, Building2, Globe, Mail, Phone, ImagePlus, ShieldAlert } from "lucide-react";
import { partnerPortalService, ProfileInput } from "@/services/partner/partner-portal.service";
import { PartnerProfile } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";

const EMPTY: ProfileInput = { name: "", sector: "", description: "", contactEmail: "", websiteUrl: "", phone: "" };

const SECTORS = [
    "Restauration", "Hôtellerie", "Transport", "Loisirs", "Culture", "Sport",
    "Bien-être", "Santé", "Éducation", "Commerce", "Services", "Autre",
];

const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"];
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2 Mo — doit rester cohérent avec logoUpload côté backend

export default function PartnerProfilePage() {
    const { user } = usePartnerAuth();
    const isAdmin = user?.role === "PARTNER_ADMIN";
    const [partner, setPartner] = useState<PartnerProfile | null>(null);
    const [form, setForm]       = useState<ProfileInput>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const p = await partnerPortalService.getProfile();
                setPartner(p);
                setForm({
                    name:         p.name,
                    sector:       p.sector,
                    description:  p.description ?? "",
                    contactEmail: p.contactEmail ?? "",
                    websiteUrl:   p.websiteUrl ?? "",
                    phone:        p.phone ?? "",
                });
            } catch (err) {
                toast.error(getErrorMessage(err, "Erreur de chargement"));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        if (!form.name?.trim()) { toast.error("Le nom est requis"); return; }
        setSaving(true);
        try {
            const updated = await partnerPortalService.updateProfile(form);
            setPartner(updated);
            toast.success("Profil mis à jour");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la sauvegarde"));
        } finally {
            setSaving(false);
        }
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // permet de re-sélectionner le même fichier
        if (!file) return;

        if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
            toast.error("Format non supporté (JPG, PNG, SVG ou WEBP uniquement)");
            return;
        }
        if (file.size > MAX_LOGO_SIZE) {
            toast.error("Image trop volumineuse (2 Mo maximum)");
            return;
        }

        setUploadingLogo(true);
        try {
            // Persisté immédiatement côté backend (contrairement à l'image d'offre qui
            // attend l'enregistrement du formulaire) — le partenaire existe déjà.
            const { logoUrl } = await partnerPortalService.uploadPartnerLogo(file);
            setPartner((prev) => prev ? { ...prev, logoUrl } : prev);
            toast.success("Logo mis à jour");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de l'upload du logo"));
        } finally {
            setUploadingLogo(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Profil partenaire</h1>
                <p className="text-xs text-gray-500 mt-0.5">Informations visibles par les employés sur le catalogue</p>
            </div>

            {/* Avatar / nom */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 overflow-hidden">
                        {partner?.logoUrl
                            ? <Image src={partner.logoUrl} alt="" fill className="object-cover" />
                            : <Building2 className="h-7 w-7 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{partner?.name}</p>
                        <p className="text-xs text-gray-500">{partner?.sector}</p>
                    </div>
                    <div>
                        <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition">
                            {uploadingLogo ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                            {partner?.logoUrl ? "Changer le logo" : "Ajouter un logo"}
                        </button>
                        <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/svg+xml,image/webp"
                            onChange={handleLogoChange} className="hidden" />
                    </div>
                </div>

                <div className={`space-y-4 ${!isAdmin ? "opacity-60 pointer-events-none" : ""}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Nom du partenaire *" icon={<Building2 size={14} />}>
                            <input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                className="input-field" placeholder="Nom de votre établissement" />
                        </Field>
                        <Field label="Secteur" icon={null}>
                            <select value={form.sector ?? ""} onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                                className="input-field">
                                <option value="">— Choisir —</option>
                                {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </Field>
                    </div>

                    <Field label="Description" icon={null}>
                        <textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            rows={3} className="input-field resize-none"
                            placeholder="Décrivez votre activité, vos services…" />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Email de contact" icon={<Mail size={14} />}>
                            <input type="email" value={form.contactEmail ?? ""}
                                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                                className="input-field" placeholder="contact@etablissement.com" />
                        </Field>
                        <Field label="Téléphone" icon={<Phone size={14} />}>
                            <input value={form.phone ?? ""}
                                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                className="input-field" placeholder="+229 XX XX XX XX" />
                        </Field>
                    </div>

                    <Field label="Site web" icon={<Globe size={14} />}>
                        <input value={form.websiteUrl ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                            className="input-field" placeholder="https://www.monsite.com" />
                    </Field>
                </div>
            </div>

            {!isAdmin && (
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
                    <ShieldAlert size={15} className="shrink-0" />
                    Seul l&apos;administrateur partenaire peut modifier les informations du profil.
                </div>
            )}

            <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving || !isAdmin}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={15} />}
                    Enregistrer
                </button>
            </div>

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

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                {icon}
                {label}
            </label>
            {children}
        </div>
    );
}
