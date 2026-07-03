"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { partnersService } from "@/services/admin/partners.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

export default function NewPartnerPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name:           "",
        sector:         "",
        logoUrl:        "",
        contactEmail:   "",
        websiteUrl:     "",
        notes:          "",
        status:         "DRAFT",
        scopeType:      "BOTH",
        apiEnabled:     false,
        apiBaseUrl:     "",
        apiKey:         "",
        apiFormat:      "REST",
        syncFrequencyH: 24,
        isGlobal:       false,
    });

    const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.sector.trim()) {
            toast.error("Nom et secteur sont obligatoires");
            return;
        }
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                name:      form.name,
                sector:    form.sector,
                status:    form.status,
                scopeType: form.scopeType,
                isGlobal:  form.isGlobal,
                apiEnabled: form.apiEnabled,
            };
            if (form.logoUrl)      payload.logoUrl      = form.logoUrl;
            if (form.contactEmail) payload.contactEmail = form.contactEmail;
            if (form.websiteUrl)   payload.websiteUrl   = form.websiteUrl;
            if (form.notes)        payload.notes        = form.notes;
            if (form.apiEnabled) {
                if (form.apiBaseUrl) payload.apiBaseUrl = form.apiBaseUrl;
                if (form.apiKey)     payload.apiKey     = form.apiKey;
                payload.apiFormat      = form.apiFormat;
                payload.syncFrequencyH = form.syncFrequencyH;
            }
            await partnersService.create(payload);
            toast.success("Partenaire créé");
            router.push("/admin/partners");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la création"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Nouveau partenaire</h1>
                    <p className="text-sm text-gray-500">Ajoutez un partenaire CSE ou Voyage à la plateforme</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations générales */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Informations générales</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                            <input value={form.name} onChange={(e) => set("name", e.target.value)} required
                                placeholder="Ex. : Accor Hotels"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Secteur *</label>
                            <input value={form.sector} onChange={(e) => set("sector", e.target.value)} required
                                placeholder="Ex. : Hôtellerie"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Email de contact</label>
                            <input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)}
                                placeholder="contact@partenaire.com"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Site web</label>
                            <input type="url" value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)}
                                placeholder="https://..."
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">URL du logo</label>
                            <input type="url" value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)}
                                placeholder="https://..."
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Notes internes</label>
                            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                                rows={2} placeholder="Notes visibles uniquement par les admins..."
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none resize-none focus:border-teal-400" />
                        </div>
                    </div>
                </div>

                {/* Configuration */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Configuration</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                            <select value={form.status} onChange={(e) => set("status", e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none">
                                <option value="DRAFT">Brouillon</option>
                                <option value="ACTIVE">Actif</option>
                                <option value="INACTIVE">Inactif</option>
                                <option value="SUSPENDED">Suspendu</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Périmètre</label>
                            <select value={form.scopeType} onChange={(e) => set("scopeType", e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none">
                                <option value="CSE">CSE uniquement</option>
                                <option value="VOYAGE">Voyage uniquement</option>
                                <option value="BOTH">CSE + Voyage</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="isGlobal" checked={form.isGlobal}
                                onChange={(e) => set("isGlobal", e.target.checked)}
                                className="w-4 h-4 rounded" />
                            <label htmlFor="isGlobal" className="text-sm text-gray-700">
                                Partenaire global (visible par toutes les organisations)
                            </label>
                        </div>
                    </div>
                </div>

                {/* Configuration API */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Intégration API</h2>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="apiEnabled" checked={form.apiEnabled}
                                onChange={(e) => set("apiEnabled", e.target.checked)}
                                className="w-4 h-4 rounded" />
                            <label htmlFor="apiEnabled" className="text-sm text-gray-700">Activer</label>
                        </div>
                    </div>

                    {form.apiEnabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">URL de base de l&apos;API</label>
                                <input type="url" value={form.apiBaseUrl} onChange={(e) => set("apiBaseUrl", e.target.value)}
                                    placeholder="https://api.partenaire.com/v1"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Clé API</label>
                                <input type="password" value={form.apiKey} onChange={(e) => set("apiKey", e.target.value)}
                                    placeholder="Sera chiffrée en base"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Format</label>
                                <select value={form.apiFormat} onChange={(e) => set("apiFormat", e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none">
                                    <option value="REST">REST</option>
                                    <option value="GRAPHQL">GraphQL</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Fréquence de sync (heures)</label>
                                <input type="number" min={1} max={168} value={form.syncFrequencyH}
                                    onChange={(e) => set("syncFrequencyH", parseInt(e.target.value))}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button type="button" onClick={() => router.back()}
                        className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium">
                        Annuler
                    </button>
                    <button type="submit" disabled={saving}
                        className="flex-1 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                        style={{ background: "var(--color-primary)" }}>
                        {saving && <Loader2 size={15} className="animate-spin" />}
                        Créer le partenaire
                    </button>
                </div>
            </form>
        </div>
    );
}
