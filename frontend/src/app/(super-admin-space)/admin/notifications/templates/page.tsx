"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Check, Bell } from "lucide-react";
import { notificationsAdminService, TemplateInput } from "@/services/admin/notifications-admin.service";
import { NotificationTemplate, NotificationType, NotificationChannel } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const ALL_EVENTS: NotificationType[] = [
    "BOOKING_CONFIRMED", "BOOKING_CANCELLED", "BOOKING_COMPLETED", "BOOKING_REJECTED",
    "WALLET_CREDITED", "CASHBACK_CREDITED", "ORDER_CONFIRMED", "ORDER_CANCELLED",
    "APPROVAL_REQUEST", "REQUEST_APPROVED", "REQUEST_REJECTED",
    "TRIP_REMINDER", "NEW_EVENT", "SYSTEM_UPDATE", "NEW_PARTNER_OFFER",
];

const EVENT_LABELS: Partial<Record<NotificationType, string>> = {
    BOOKING_CONFIRMED: "Réservation confirmée",
    BOOKING_CANCELLED: "Réservation annulée",
    BOOKING_COMPLETED: "Réservation complétée",
    BOOKING_REJECTED:  "Réservation refusée",
    WALLET_CREDITED:   "Wallet crédité",
    CASHBACK_CREDITED: "Cashback crédité",
    ORDER_CONFIRMED:   "Commande confirmée",
    ORDER_CANCELLED:   "Commande annulée",
    APPROVAL_REQUEST:  "Demande approbation",
    REQUEST_APPROVED:  "Demande approuvée",
    REQUEST_REJECTED:  "Demande refusée",
    TRIP_REMINDER:     "Rappel voyage",
    NEW_EVENT:         "Nouvel événement",
    SYSTEM_UPDATE:     "Mise à jour système",
    NEW_PARTNER_OFFER: "Nouvelle offre partenaire",
};

const CHANNELS: { id: NotificationChannel; label: string }[] = [
    { id: "IN_APP", label: "In-app" },
    { id: "EMAIL",  label: "Email" },
    { id: "SMS",    label: "SMS" },
];

const EMPTY: TemplateInput = { channels: ["IN_APP"], emailSubject: null, emailBody: null, smsBody: null, inAppTitle: null, inAppBody: null, isActive: true };

export default function NotificationTemplatesPage() {
    const [templates, setTemplates]   = useState<NotificationTemplate[]>([]);
    const [loading, setLoading]       = useState(true);
    const [showModal, setShowModal]   = useState(false);
    const [editing, setEditing]       = useState<NotificationType | null>(null);
    const [form, setForm]             = useState<TemplateInput>(EMPTY);
    const [saving, setSaving]         = useState(false);
    const [deleting, setDeleting]     = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try { setTemplates(await notificationsAdminService.listTemplates()); }
        catch (err) { toast.error(getErrorMessage(err, "Erreur de chargement")); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = (event: NotificationType) => {
        setEditing(event);
        setForm(EMPTY);
        setShowModal(true);
    };

    const openEdit = (t: NotificationTemplate) => {
        setEditing(t.event);
        setForm({
            channels:     t.channels,
            emailSubject: t.emailSubject,
            emailBody:    t.emailBody,
            smsBody:      t.smsBody,
            inAppTitle:   t.inAppTitle,
            inAppBody:    t.inAppBody,
            isActive:     t.isActive,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            await notificationsAdminService.upsertTemplate(editing, form);
            toast.success("Template enregistré");
            setShowModal(false);
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        } finally { setSaving(false); }
    };

    const handleDelete = async (event: NotificationType) => {
        if (!confirm("Supprimer ce template ?")) return;
        setDeleting(event);
        try {
            await notificationsAdminService.deleteTemplate(event);
            toast.success("Template supprimé");
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        } finally { setDeleting(null); }
    };

    const toggleChannel = (ch: NotificationChannel) => {
        setForm((p) => ({
            ...p,
            channels: p.channels?.includes(ch)
                ? p.channels.filter((c) => c !== ch)
                : [...(p.channels ?? []), ch],
        }));
    };

    const templateMap = new Map(templates.map((t) => [t.event, t]));

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Templates de notifications</h1>
                <p className="text-sm text-gray-500 mt-0.5">Configurez les messages envoyés par canal pour chaque événement</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Événement</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Canaux</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Sujet email</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Statut</th>
                                <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {ALL_EVENTS.map((event) => {
                                const t = templateMap.get(event);
                                return (
                                    <tr key={event} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <Bell className="h-4 w-4 text-gray-400 shrink-0" />
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {EVENT_LABELS[event] ?? event}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 ml-6">{event}</p>
                                        </td>
                                        <td className="px-5 py-3">
                                            {t ? (
                                                <div className="flex gap-1">
                                                    {(t.channels as NotificationChannel[]).map((ch) => (
                                                        <span key={ch} className="px-1.5 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">{ch}</span>
                                                    ))}
                                                </div>
                                            ) : <span className="text-gray-400 text-xs">—</span>}
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 max-w-xs truncate">
                                            {t?.emailSubject ?? <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-5 py-3">
                                            {t ? (
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                    {t.isActive ? "Actif" : "Inactif"}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-600">Non configuré</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                {t ? (
                                                    <>
                                                        <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-blue-600 transition">
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(t.event)} disabled={deleting === t.event} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 disabled:opacity-50 transition">
                                                            {deleting === t.event ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => openCreate(event)} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                                        <Plus className="h-3.5 w-3.5" />Configurer
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-lg text-gray-900 dark:text-white">{EVENT_LABELS[editing] ?? editing}</h2>
                                <p className="text-xs text-gray-400">{editing}</p>
                            </div>
                            <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>

                        {/* Channels */}
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-2 block">Canaux d'envoi</label>
                            <div className="flex gap-2">
                                {CHANNELS.map(({ id, label }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => toggleChannel(id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                                            form.channels?.includes(id)
                                                ? "bg-blue-600 border-blue-600 text-white"
                                                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                                        }`}
                                    >
                                        {form.channels?.includes(id) && <Check className="h-3 w-3 inline mr-1" />}{label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* In-app */}
                        {form.channels?.includes("IN_APP") && (
                            <div className="space-y-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                                <p className="text-xs font-semibold text-gray-500">In-app</p>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Titre <span className="text-gray-400">(variables: {"{{bookingId}}, {{amount}}, ..."})</span></label>
                                    <input type="text" value={form.inAppTitle ?? ""} onChange={(e) => setForm((p) => ({ ...p, inAppTitle: e.target.value || null }))}
                                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Corps</label>
                                    <textarea rows={2} value={form.inAppBody ?? ""} onChange={(e) => setForm((p) => ({ ...p, inAppBody: e.target.value || null }))}
                                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        {form.channels?.includes("EMAIL") && (
                            <div className="space-y-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                                <p className="text-xs font-semibold text-blue-600">Email</p>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Sujet</label>
                                    <input type="text" value={form.emailSubject ?? ""} onChange={(e) => setForm((p) => ({ ...p, emailSubject: e.target.value || null }))}
                                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Corps HTML</label>
                                    <textarea rows={4} value={form.emailBody ?? ""} onChange={(e) => setForm((p) => ({ ...p, emailBody: e.target.value || null }))}
                                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                                </div>
                            </div>
                        )}

                        {/* SMS */}
                        {form.channels?.includes("SMS") && (
                            <div className="space-y-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                                <p className="text-xs font-semibold text-green-600">SMS <span className="font-normal text-gray-400">(max 160 caractères)</span></p>
                                <textarea rows={2} value={form.smsBody ?? ""} onChange={(e) => setForm((p) => ({ ...p, smsBody: e.target.value || null }))}
                                    maxLength={160}
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                                <p className="text-xs text-gray-400 text-right">{(form.smsBody ?? "").length}/160</p>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="isActive" checked={form.isActive ?? true} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="rounded" />
                            <label htmlFor="isActive" className="text-sm text-gray-600 dark:text-gray-300">Template actif</label>
                        </div>

                        <div className="flex justify-end gap-3 pt-1">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Annuler</button>
                            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 text-sm font-medium rounded-lg transition">
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
