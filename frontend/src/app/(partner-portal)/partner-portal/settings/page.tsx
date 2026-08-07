"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Coins, Key, Wallet, Plus, Trash2, ShieldAlert, X } from "lucide-react";
import {
    partnerPortalService, SUPPORTED_CURRENCIES, ApiIntegrationInput,
} from "@/services/partner/partner-portal.service";
import { PartnerSettings, PartnerPaymentMethod, PartnerPaymentMethodType } from "@/types";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const PAYMENT_TYPE_LABELS: Record<PartnerPaymentMethodType, string> = {
    MOBILE_MONEY:  "Mobile Money",
    BANK_TRANSFER: "Virement bancaire",
    OTHER:         "Autre",
};

const EMPTY_PM_FORM = {
    type:          "MOBILE_MONEY" as PartnerPaymentMethodType,
    provider:      "",
    label:         "",
    phoneNumber:   "",
    accountNumber: "",
    bankName:      "",
    value:         "",
};

export default function PartnerSettingsPage() {
    const { user } = usePartnerAuth();
    const isAdmin = user?.role === "PARTNER_ADMIN";

    const [settings, setSettings] = useState<PartnerSettings | null>(null);
    const [loading, setLoading]   = useState(true);

    const [currency, setCurrency]           = useState<string>("XOF");
    const [savingCurrency, setSavingCurrency] = useState(false);

    const [apiForm, setApiForm]   = useState<ApiIntegrationInput>({ apiEnabled: false, apiBaseUrl: "", apiFormat: "", apiKey: "" });
    const [savingApi, setSavingApi] = useState(false);

    const [showPmModal, setShowPmModal] = useState(false);
    const [pmForm, setPmForm]           = useState(EMPTY_PM_FORM);
    const [savingPm, setSavingPm]       = useState(false);
    const [deletingPmId, setDeletingPmId] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const s = await partnerPortalService.getSettings();
                setSettings(s);
                setCurrency(s.currencyCode);
                setApiForm({ apiEnabled: s.apiEnabled, apiBaseUrl: s.apiBaseUrl ?? "", apiFormat: s.apiFormat ?? "", apiKey: "" });
            } catch (err) {
                toast.error(getErrorMessage(err, "Erreur de chargement"));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSaveCurrency = async () => {
        setSavingCurrency(true);
        try {
            await partnerPortalService.updateCurrency(currency);
            setSettings((s) => s && { ...s, currencyCode: currency });
            toast.success("Devise mise à jour");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la sauvegarde"));
        } finally {
            setSavingCurrency(false);
        }
    };

    const handleSaveApi = async () => {
        setSavingApi(true);
        try {
            const payload: ApiIntegrationInput = {
                apiEnabled: apiForm.apiEnabled,
                apiBaseUrl: apiForm.apiBaseUrl || undefined,
                apiFormat:  apiForm.apiFormat || undefined,
                ...(apiForm.apiKey ? { apiKey: apiForm.apiKey } : {}),
            };
            const result = await partnerPortalService.updateApiIntegration(payload);
            setSettings((s) => s && { ...s, ...result });
            setApiForm((f) => ({ ...f, apiKey: "" })); // jamais réaffiché après soumission
            toast.success("Intégration API mise à jour");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la sauvegarde"));
        } finally {
            setSavingApi(false);
        }
    };

    const openCreatePm = () => { setPmForm(EMPTY_PM_FORM); setShowPmModal(true); };

    const handleCreatePm = async () => {
        if (!pmForm.provider.trim() || !pmForm.label.trim()) {
            toast.error("Fournisseur et libellé requis"); return;
        }
        let details: Record<string, string> = {};
        if (pmForm.type === "MOBILE_MONEY") {
            if (!pmForm.phoneNumber.trim()) { toast.error("Numéro Mobile Money requis"); return; }
            details = { "Numéro": pmForm.phoneNumber.trim() };
        } else if (pmForm.type === "BANK_TRANSFER") {
            if (!pmForm.accountNumber.trim()) { toast.error("Numéro de compte / IBAN requis"); return; }
            details = { "Banque": pmForm.bankName.trim(), "Numéro de compte / IBAN": pmForm.accountNumber.trim() };
        } else {
            if (!pmForm.value.trim()) { toast.error("Détail requis"); return; }
            details = { "Détail": pmForm.value.trim() };
        }

        setSavingPm(true);
        try {
            const created = await partnerPortalService.createPaymentMethod({
                type: pmForm.type, provider: pmForm.provider.trim(), label: pmForm.label.trim(), details,
            });
            setSettings((s) => s && { ...s, paymentMethods: [created, ...s.paymentMethods] });
            toast.success("Moyen de paiement ajouté");
            setShowPmModal(false);
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de l'ajout"));
        } finally {
            setSavingPm(false);
        }
    };

    const handleToggleActive = async (pm: PartnerPaymentMethod) => {
        try {
            const updated = await partnerPortalService.updatePaymentMethod(pm.id, { isActive: !pm.isActive });
            setSettings((s) => s && { ...s, paymentMethods: s.paymentMethods.map((m) => m.id === pm.id ? updated : m) });
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        }
    };

    const handleDeletePm = async (id: string) => {
        if (!confirm("Supprimer ce moyen de paiement ?")) return;
        setDeletingPmId(id);
        try {
            await partnerPortalService.deletePaymentMethod(id);
            setSettings((s) => s && { ...s, paymentMethods: s.paymentMethods.filter((m) => m.id !== id) });
            toast.success("Supprimé");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        } finally {
            setDeletingPmId(null);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
                <p className="text-xs text-gray-500 mt-0.5">Devise, intégration API et moyens de réception de paiement</p>
            </div>

            {/* Devise */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h2 className="flex items-center gap-2 font-semibold text-sm text-gray-900 dark:text-white">
                    <Coins size={16} /> Devise de paiement
                </h2>
                <div className="flex items-end gap-3">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Devise utilisée pour vos offres</label>
                        <select value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={!isAdmin}
                            className="input-field w-40 disabled:opacity-50">
                            {SUPPORTED_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    {isAdmin && (
                        <button onClick={handleSaveCurrency} disabled={savingCurrency || currency === settings?.currencyCode}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition">
                            {savingCurrency ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={15} />}
                            Enregistrer
                        </button>
                    )}
                </div>
            </section>

            {!isAdmin && (
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
                    <ShieldAlert size={15} className="shrink-0" />
                    L'intégration API et les moyens de réception de paiement sont réservés à l'administrateur partenaire.
                </div>
            )}

            {/* Intégration API */}
            <section className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 ${!isAdmin ? "opacity-60 pointer-events-none" : ""}`}>
                <h2 className="flex items-center gap-2 font-semibold text-sm text-gray-900 dark:text-white">
                    <Key size={16} /> Intégration API
                </h2>
                <p className="text-xs text-gray-500">Permet la récupération automatique de vos offres depuis votre système.</p>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={apiForm.apiEnabled ?? false}
                        onChange={(e) => setApiForm((f) => ({ ...f, apiEnabled: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Activer la synchronisation automatique</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">URL de base de l&apos;API</label>
                        <input value={apiForm.apiBaseUrl ?? ""} onChange={(e) => setApiForm((f) => ({ ...f, apiBaseUrl: e.target.value }))}
                            className="input-field" placeholder="https://api.votre-systeme.com" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Format</label>
                        <input value={apiForm.apiFormat ?? ""} onChange={(e) => setApiForm((f) => ({ ...f, apiFormat: e.target.value }))}
                            className="input-field" placeholder="ex. JSON" />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Clé API</label>
                    <input type="password" value={apiForm.apiKey ?? ""} onChange={(e) => setApiForm((f) => ({ ...f, apiKey: e.target.value }))}
                        className="input-field"
                        placeholder={settings?.hasApiKey ? "•••••••• (clé déjà enregistrée — laisser vide pour ne pas la changer)" : "Aucune clé enregistrée"} />
                    <p className="text-xs text-gray-400">La clé n&apos;est jamais réaffichée après enregistrement, pour votre sécurité.</p>
                </div>
                <div className="flex justify-end">
                    <button onClick={handleSaveApi} disabled={savingApi || !isAdmin}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition">
                        {savingApi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={15} />}
                        Enregistrer
                    </button>
                </div>
            </section>

            {/* Moyens de réception de paiement */}
            <section className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 ${!isAdmin ? "opacity-60 pointer-events-none" : ""}`}>
                <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-semibold text-sm text-gray-900 dark:text-white">
                        <Wallet size={16} /> Moyens de réception de paiement
                    </h2>
                    <button onClick={openCreatePm} disabled={!isAdmin}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition">
                        <Plus size={14} /> Ajouter
                    </button>
                </div>

                {(settings?.paymentMethods.length ?? 0) === 0 ? (
                    <p className="text-xs text-gray-400 py-4 text-center">Aucun moyen de paiement configuré</p>
                ) : (
                    <div className="space-y-2">
                        {settings!.paymentMethods.map((pm) => (
                            <div key={pm.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {pm.label} <span className="text-xs font-normal text-gray-400">· {PAYMENT_TYPE_LABELS[pm.type]}</span>
                                    </p>
                                    <p className="text-xs text-gray-500">{pm.provider}{pm.maskedHint ? ` · ${pm.maskedHint}` : ""}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button onClick={() => handleToggleActive(pm)}
                                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${pm.isActive
                                            ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-400"}`}>
                                        {pm.isActive ? "Actif" : "Inactif"}
                                    </button>
                                    <button onClick={() => handleDeletePm(pm.id)} disabled={deletingPmId === pm.id}
                                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition">
                                        {deletingPmId === pm.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Modal — Nouveau moyen de paiement */}
            {showPmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-gray-900 dark:text-white">Nouveau moyen de paiement</h2>
                            <button onClick={() => setShowPmModal(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Type</label>
                                <select value={pmForm.type} onChange={(e) => setPmForm((f) => ({ ...f, type: e.target.value as PartnerPaymentMethodType }))}
                                    className="input-field">
                                    {(Object.keys(PAYMENT_TYPE_LABELS) as PartnerPaymentMethodType[]).map((t) => (
                                        <option key={t} value={t}>{PAYMENT_TYPE_LABELS[t]}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Fournisseur *</label>
                                <input value={pmForm.provider} onChange={(e) => setPmForm((f) => ({ ...f, provider: e.target.value }))}
                                    className="input-field" placeholder={pmForm.type === "MOBILE_MONEY" ? "Ex. Orange Money" : pmForm.type === "BANK_TRANSFER" ? "Ex. Ecobank" : "Ex. PayPal"} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Libellé *</label>
                                <input value={pmForm.label} onChange={(e) => setPmForm((f) => ({ ...f, label: e.target.value }))}
                                    className="input-field" placeholder="Ex. Compte principal" />
                            </div>

                            {pmForm.type === "MOBILE_MONEY" && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Numéro Mobile Money *</label>
                                    <input value={pmForm.phoneNumber} onChange={(e) => setPmForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                                        className="input-field" placeholder="+229…" />
                                </div>
                            )}
                            {pmForm.type === "BANK_TRANSFER" && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Banque</label>
                                        <input value={pmForm.bankName} onChange={(e) => setPmForm((f) => ({ ...f, bankName: e.target.value }))}
                                            className="input-field" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Numéro de compte / IBAN *</label>
                                        <input value={pmForm.accountNumber} onChange={(e) => setPmForm((f) => ({ ...f, accountNumber: e.target.value }))}
                                            className="input-field" />
                                    </div>
                                </>
                            )}
                            {pmForm.type === "OTHER" && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Détail *</label>
                                    <input value={pmForm.value} onChange={(e) => setPmForm((f) => ({ ...f, value: e.target.value }))}
                                        className="input-field" />
                                </div>
                            )}
                            <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2.5 py-2">
                                Ces informations sont chiffrées avant stockage et ne sont jamais réaffichées en clair.
                            </p>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setShowPmModal(false)}
                                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">
                                Annuler
                            </button>
                            <button onClick={handleCreatePm} disabled={savingPm}
                                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition">
                                {savingPm ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter"}
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
