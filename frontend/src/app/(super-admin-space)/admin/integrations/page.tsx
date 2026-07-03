"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Edit, Trash2, CheckCircle, XCircle, ToggleLeft, ToggleRight, X } from "lucide-react";
import { integrationService } from "@/services/companies/integrations.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

interface GdsIntegration {
    id:              string;
    name:            string;
    type:            string;
    integrationType: string;
    apiKey:          string | null;
    isActive:        boolean;
    lastSyncAt:      string | null;
    syncConfig:      { hasApiSecret?: boolean; baseUrl?: string } | null;
    createdAt:       string;
}

const EMPTY_FORM = {
    name:        "Amadeus GDS",
    apiKey:      "",
    apiSecret:   "",
    baseUrl:     "https://test.api.amadeus.com",
    isActive:    true,
};

export default function AdminIntegrationsPage() {
    const [integrations, setIntegrations] = useState<GdsIntegration[]>([]);
    const [loading, setLoading]           = useState(true);
    const [modal, setModal]               = useState<"create" | "edit" | null>(null);
    const [editTarget, setEditTarget]     = useState<GdsIntegration | null>(null);
    const [saving, setSaving]             = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<GdsIntegration | null>(null);
    const [deleting, setDeleting]         = useState(false);
    const [form, setForm]                 = useState({ ...EMPTY_FORM });
    const [changeSecret, setChangeSecret] = useState(false);

    const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const all = await integrationService.getAll();
            setIntegrations(
                (all as GdsIntegration[]).filter((i) => i.integrationType === "GDS" || i.type === "GDS")
            );
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur de chargement"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => {
        setForm({ ...EMPTY_FORM });
        setChangeSecret(true);
        setEditTarget(null);
        setModal("create");
    };

    const openEdit = (it: GdsIntegration) => {
        setForm({
            name:      it.name,
            apiKey:    it.apiKey ?? "",
            apiSecret: "",
            baseUrl:   it.syncConfig?.baseUrl ?? "https://test.api.amadeus.com",
            isActive:  it.isActive,
        });
        setChangeSecret(false);
        setEditTarget(it);
        setModal("edit");
    };

    const handleSave = async () => {
        if (!form.name || !form.apiKey) {
            toast.error("Nom et Client ID Amadeus sont obligatoires");
            return;
        }
        if (modal === "create" && !form.apiSecret) {
            toast.error("Le Client Secret Amadeus est obligatoire");
            return;
        }
        setSaving(true);
        try {
            const syncConfig: Record<string, unknown> = { baseUrl: form.baseUrl };
            if (changeSecret && form.apiSecret) syncConfig.apiSecret = form.apiSecret;

            const payload = {
                name:            form.name,
                type:            "GDS",
                integrationType: "GDS",
                apiKey:          form.apiKey,
                isActive:        form.isActive,
                syncConfig,
            };

            if (modal === "create") {
                await integrationService.create(payload);
                toast.success("Configuration Amadeus créée");
            } else if (editTarget) {
                await integrationService.update(editTarget.id, payload);
                toast.success("Configuration Amadeus mise à jour");
            }
            setModal(null);
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de l'enregistrement"));
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (it: GdsIntegration) => {
        try {
            await integrationService.update(it.id, { isActive: !it.isActive });
            toast.success(it.isActive ? "Désactivée" : "Activée");
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await integrationService.delete(deleteTarget.id);
            toast.success("Configuration supprimée");
            setDeleteTarget(null);
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la suppression"));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Intégrations GDS</h1>
                    <p className="text-sm text-gray-500">
                        Configuration Amadeus — utilisée par le moteur de recherche de vols comme source de données.
                        En l&apos;absence de configuration active, le système utilise les variables d&apos;environnement.
                    </p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
                    style={{ background: "var(--color-primary)" }}>
                    <Plus size={15} /> Configurer Amadeus
                </button>
            </div>

            {/* Liste */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400">
                        <Loader2 size={22} className="animate-spin mr-2" /> Chargement…
                    </div>
                ) : integrations.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <p className="text-4xl mb-3">✈️</p>
                        <p className="font-medium">Aucune configuration GDS</p>
                        <p className="text-xs mt-1">
                            La recherche de vols utilise actuellement les variables d&apos;environnement AMADEUS_API_KEY / AMADEUS_API_SECRET.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {integrations.map((it) => (
                            <div key={it.id} className="flex items-center gap-4 px-5 py-4">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                                    style={{ background: "#1a56db" }}
                                >
                                    GDS
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-gray-900 text-sm">{it.name}</p>
                                        {it.isActive
                                            ? <CheckCircle size={14} className="text-green-500" />
                                            : <XCircle size={14} className="text-gray-400" />}
                                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                            style={it.isActive
                                                ? { background: "#dcfce7", color: "#15803d" }
                                                : { background: "#f3f4f6", color: "#6b7280" }}>
                                            {it.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Client ID: {it.apiKey ? `${it.apiKey.substring(0, 8)}…` : "non défini"}
                                        {" · "}
                                        Secret: {it.syncConfig?.hasApiSecret ? "configuré ✓" : "non configuré"}
                                        {" · "}
                                        URL: {it.syncConfig?.baseUrl ?? "par défaut"}
                                    </p>
                                    {it.lastSyncAt && (
                                        <p className="text-xs text-gray-400">
                                            Dernier appel : {new Date(it.lastSyncAt).toLocaleString("fr-FR")}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button onClick={() => handleToggle(it)} title={it.isActive ? "Désactiver" : "Activer"}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
                                        {it.isActive
                                            ? <ToggleRight size={18} className="text-green-500" />
                                            : <ToggleLeft size={18} />}
                                    </button>
                                    <button onClick={() => openEdit(it)} title="Modifier"
                                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                                        <Edit size={14} />
                                    </button>
                                    <button onClick={() => setDeleteTarget(it)} title="Supprimer"
                                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Note technique */}
            <div className="rounded-xl p-4 text-sm text-blue-700" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <p className="font-semibold mb-1">Comment ça fonctionne</p>
                <p className="text-xs leading-relaxed">
                    Quand une intégration GDS est active, le système de recherche de vols l&apos;utilise en priorité pour s&apos;authentifier
                    auprès d&apos;Amadeus (Client ID + Secret). En l&apos;absence d&apos;intégration active, les variables
                    d&apos;environnement <code className="bg-blue-100 px-1 rounded">AMADEUS_API_KEY</code> et{" "}
                    <code className="bg-blue-100 px-1 rounded">AMADEUS_API_SECRET</code> prennent le relai.
                    Le Client Secret est chiffré (AES-256-GCM) et jamais renvoyé en clair.
                </p>
            </div>

            {/* Modal création / édition */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-gray-900">
                                {modal === "create" ? "Configurer Amadeus GDS" : "Modifier la configuration"}
                            </h3>
                            <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
                                <input value={form.name} onChange={(e) => set("name", e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Client ID Amadeus *</label>
                                <input value={form.apiKey} onChange={(e) => set("apiKey", e.target.value)}
                                    placeholder="Votre client_id Amadeus Self-Service"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                            </div>

                            {modal === "edit" && !changeSecret ? (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-medium text-gray-700">
                                            Client Secret {editTarget?.syncConfig?.hasApiSecret && <span className="text-green-600">(configuré ✓)</span>}
                                        </label>
                                        <button type="button" onClick={() => setChangeSecret(true)}
                                            className="text-xs text-blue-600 underline">
                                            Modifier
                                        </button>
                                    </div>
                                    <div className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50">
                                        ●●●●●●●●●●●●
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Client Secret Amadeus {modal === "create" ? "*" : "(nouveau)"}
                                    </label>
                                    <input type="password" value={form.apiSecret} onChange={(e) => set("apiSecret", e.target.value)}
                                        placeholder="Votre client_secret Amadeus Self-Service"
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                                    <p className="text-xs text-gray-400 mt-1">Sera chiffré (AES-256-GCM) avant stockage.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">URL de base Amadeus</label>
                                <input value={form.baseUrl} onChange={(e) => set("baseUrl", e.target.value)}
                                    placeholder="https://test.api.amadeus.com"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                                <p className="text-xs text-gray-400 mt-1">
                                    Test : https://test.api.amadeus.com · Prod : https://api.amadeus.com
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="gds-active" checked={form.isActive}
                                    onChange={(e) => set("isActive", e.target.checked)} className="w-4 h-4 rounded" />
                                <label htmlFor="gds-active" className="text-sm text-gray-700">
                                    Activer immédiatement comme source principale
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setModal(null)}
                                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                                Annuler
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                                style={{ background: "var(--color-primary)" }}>
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {modal === "create" ? "Créer" : "Enregistrer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal suppression */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="font-bold text-gray-900 mb-2">Supprimer cette configuration ?</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            <strong>{deleteTarget.name}</strong> sera supprimée. Le système basculera sur les variables d&apos;environnement.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                                Annuler
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                                style={{ background: "#ef4444" }}>
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
