"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Building2, Globe, Mail, Phone } from "lucide-react";
import { partnerPortalService, ProfileInput } from "@/services/partner/partner-portal.service";
import { Partner } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const EMPTY: ProfileInput = { name: "", sector: "", description: "", contactEmail: "", websiteUrl: "", phone: "" };

const SECTORS = [
    "Restauration", "Hôtellerie", "Transport", "Loisirs", "Culture", "Sport",
    "Bien-être", "Santé", "Éducation", "Commerce", "Services", "Autre",
];

export default function PartnerProfilePage() {
    const [partner, setPartner] = useState<Partner | null>(null);
    const [form, setForm]       = useState<ProfileInput>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const p = await partnerPortalService.getProfile();
                setPartner(p);
                setForm({
                    name:         p.name,
                    sector:       p.sector,
                    description:  "",
                    contactEmail: p.contactEmail ?? "",
                    websiteUrl:   p.websiteUrl ?? "",
                    phone:        "",
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

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Profil partenaire</h1>
                <p className="text-xs text-gray-500 mt-0.5">Informations visibles par les employés sur le catalogue</p>
            </div>

            {/* Avatar / nom */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                        {partner?.logoUrl
                            ? <img src={partner.logoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                            : <Building2 className="h-7 w-7 text-blue-600" />}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{partner?.name}</p>
                        <p className="text-xs text-gray-500">{partner?.sector}</p>
                    </div>
                </div>

                <div className="space-y-4">
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

            <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving}
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
