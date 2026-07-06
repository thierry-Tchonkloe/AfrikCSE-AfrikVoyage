"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { countryConfigService, CountryConfig, CountryConfigInput } from "@/services/admin/country-config.service";

const emptyForm: CountryConfigInput = {
    code: "", name: "", currencyCode: "", locale: "", taxRate: 0, phonePrefix: "", isActive: true,
};

function CountryModal({ initial, onClose, onSaved }: {
    initial?: CountryConfig | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [form, setForm] = useState<CountryConfigInput>(
        initial
            ? {
                code: initial.code, name: initial.name, currencyCode: initial.currencyCode,
                locale: initial.locale, taxRate: parseFloat(initial.taxRate),
                phonePrefix: initial.phonePrefix ?? "", isActive: initial.isActive,
            }
            : emptyForm,
    );
    const [error, setError] = useState<string | null>(null);
    const isEdit = !!initial;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        try {
            await countryConfigService.upsert(form);
            onSaved();
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur");
        }
    }

    function set(field: keyof CountryConfigInput, value: unknown) {
        setForm(f => ({ ...f, [field]: value }));
    }

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-gray-900">{isEdit ? "Modifier" : "Ajouter"} un pays</h2>
                    <button type="button" onClick={onClose}><X size={18} /></button>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-medium text-gray-600">Code ISO *</label>
                        <input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())}
                            required maxLength={4} placeholder="CI"
                            disabled={isEdit}
                            className="w-full border rounded px-3 py-1.5 text-sm mt-1 disabled:bg-gray-100" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Nom *</label>
                        <input value={form.name} onChange={e => set("name", e.target.value)}
                            required placeholder="Côte d'Ivoire"
                            className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Devise</label>
                        <input value={form.currencyCode} onChange={e => set("currencyCode", e.target.value.toUpperCase())}
                            placeholder="XOF" maxLength={4}
                            className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Locale</label>
                        <input value={form.locale} onChange={e => set("locale", e.target.value)}
                            placeholder="fr-CI"
                            className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Taux de taxe (0–1)</label>
                        <input value={form.taxRate} onChange={e => set("taxRate", parseFloat(e.target.value) || 0)}
                            type="number" step="0.001" min="0" max="1" placeholder="0.18"
                            className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Préfixe téléphone</label>
                        <input value={form.phonePrefix} onChange={e => set("phonePrefix", e.target.value)}
                            placeholder="+225"
                            className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                </div>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} />
                    Actif
                </label>

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="text-sm border px-4 py-1.5 rounded hover:bg-gray-50">Annuler</button>
                    <button type="submit" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700">Enregistrer</button>
                </div>
            </form>
        </div>
    );
}

export default function CountriesPage() {
    const [countries, setCountries]     = useState<CountryConfig[]>([]);
    const [loading, setLoading]         = useState(true);
    const [modal, setModal]             = useState<"create" | CountryConfig | null>(null);

    const load = useCallback(async () => {
        try { setCountries(await countryConfigService.list()); } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    async function handleDelete(code: string) {
        if (!confirm(`Supprimer le pays ${code} ?`)) return;
        await countryConfigService.remove(code);
        await load();
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {(modal === "create" || (modal && typeof modal === "object")) && (
                <CountryModal
                    initial={modal === "create" ? null : modal as CountryConfig}
                    onClose={() => setModal(null)}
                    onSaved={load}
                />
            )}

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Globe size={24} className="text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Pays & Devises</h1>
                        <p className="text-sm text-gray-500">Configuration des pays supportés par la plateforme</p>
                    </div>
                </div>
                <button onClick={() => setModal("create")}
                    className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Plus size={14} /> Ajouter un pays
                </button>
            </div>

            {loading ? (
                <p className="text-sm text-gray-500">Chargement…</p>
            ) : (
                <div className="bg-white rounded-xl border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-gray-500 text-xs">
                            <tr>
                                <th className="text-left px-4 py-3">Code</th>
                                <th className="text-left px-4 py-3">Nom</th>
                                <th className="text-left px-4 py-3">Devise</th>
                                <th className="text-left px-4 py-3">Locale</th>
                                <th className="text-left px-4 py-3">Taxe</th>
                                <th className="text-left px-4 py-3">Préfixe</th>
                                <th className="text-left px-4 py-3">Actif</th>
                                <th className="text-left px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {countries.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-8 text-gray-400">Aucun pays configuré</td></tr>
                            ) : countries.map(c => (
                                <tr key={c.code} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{c.code}</td>
                                    <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{c.currencyCode}</td>
                                    <td className="px-4 py-3 text-gray-500">{c.locale}</td>
                                    <td className="px-4 py-3 text-gray-600">{(parseFloat(c.taxRate) * 100).toFixed(1)} %</td>
                                    <td className="px-4 py-3 text-gray-500">{c.phonePrefix ?? "—"}</td>
                                    <td className="px-4 py-3">
                                        {c.isActive
                                            ? <Check size={16} className="text-green-500" />
                                            : <X size={16} className="text-gray-300" />}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => setModal(c)} className="text-gray-500 hover:text-blue-600"><Pencil size={14} /></button>
                                            <button onClick={() => handleDelete(c.code)} className="text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
