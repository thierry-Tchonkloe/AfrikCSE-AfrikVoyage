"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet, Users, Send, X, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { walletAdminService, AllocatePayload } from "@/services/companies/wallet-admin.service";
import { WalletWithBalance } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const EMPTY_FORM: AllocatePayload = {
    userIds:     [],
    amount:      0,
    period:      "",
    description: "",
    expiresAt:   "",
};

export default function AdminWalletPage() {
    const [wallets, setWallets]       = useState<WalletWithBalance[]>([]);
    const [loading, setLoading]       = useState(true);
    const [showModal, setShowModal]   = useState(false);
    const [form, setForm]             = useState<AllocatePayload>(EMPTY_FORM);
    const [selectAll, setSelectAll]   = useState(false);
    const [saving, setSaving]         = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await walletAdminService.getOrgWallets();
            setWallets(data);
        } catch (err) {
            toast.error(getErrorMessage(err, "Une erreur est survenue"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const toggleUser = (id: string) => {
        setForm((prev) => ({
            ...prev,
            userIds: prev.userIds.includes(id)
                ? prev.userIds.filter((u) => u !== id)
                : [...prev.userIds, id],
        }));
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setForm((prev) => ({ ...prev, userIds: [] }));
        } else {
            setForm((prev) => ({ ...prev, userIds: wallets.map((w) => w.userId) }));
        }
        setSelectAll(!selectAll);
    };

    const handleAllocate = async () => {
        if (!form.amount || form.amount <= 0) { toast.error("Montant invalide"); return; }
        if (!form.period) { toast.error("Période requise (ex: 2026-07)"); return; }
        if (form.userIds.length === 0) { toast.error("Sélectionnez au moins un employé"); return; }

        setSaving(true);
        try {
            const result = await walletAdminService.allocate({
                ...form,
                expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
            });
            toast.success(`Allocation réussie : ${result.succeeded}/${result.total} wallets crédités`);
            setShowModal(false);
            setForm(EMPTY_FORM);
            setSelectAll(false);
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, "Une erreur est survenue"));
        } finally {
            setSaving(false);
        }
    };

    const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance), 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wallets employés</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {wallets.length} wallet{wallets.length !== 1 ? "s" : ""} · Total distribué :{" "}
                        <span className="font-semibold text-blue-600">
                            {totalBalance.toLocaleString("fr-FR")} XOF
                        </span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={load}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                        <RefreshCw className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                        <Send className="h-4 w-4" />
                        Allouer du budget
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : wallets.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Aucun wallet pour le moment</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Employé</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Email</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Département</th>
                                <th className="text-right px-5 py-3 font-medium text-gray-500">Solde (XOF)</th>
                                <th className="text-right px-5 py-3 font-medium text-gray-500">Mouvements</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {wallets.map((w) => (
                                <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">
                                        {w.user ? `${w.user.firstName} ${w.user.lastName}` : "—"}
                                    </td>
                                    <td className="px-5 py-3 text-gray-500">{w.user?.email ?? "—"}</td>
                                    <td className="px-5 py-3 text-gray-500">{w.user?.department ?? "—"}</td>
                                    <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                                        {parseFloat(w.balance).toLocaleString("fr-FR", { minimumFractionDigits: 0 })}
                                    </td>
                                    <td className="px-5 py-3 text-right text-gray-400">
                                        {w._count?.entries ?? 0}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal allocation */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Wallet className="h-5 w-5 text-blue-600" />
                                </div>
                                <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Allouer du budget</h2>
                            </div>
                            <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setSelectAll(false); }}>
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Montant (XOF) *</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.amount || ""}
                                    onChange={(e) => setForm((p) => ({ ...p, amount: parseFloat(e.target.value) }))}
                                    placeholder="ex: 25000"
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Période *</label>
                                <input
                                    type="text"
                                    value={form.period}
                                    onChange={(e) => setForm((p) => ({ ...p, period: e.target.value }))}
                                    placeholder="ex: 2026-07"
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Description (optionnel)</label>
                            <input
                                type="text"
                                value={form.description ?? ""}
                                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                placeholder="ex: Budget CSE Juillet 2026"
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Date d&apos;expiration (optionnel)</label>
                            <input
                                type="date"
                                value={form.expiresAt ?? ""}
                                onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Sélection employés */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium text-gray-500">Employés *</label>
                                <button
                                    onClick={handleSelectAll}
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    {selectAll ? "Désélectionner tout" : "Sélectionner tout"}
                                    {selectAll && <CheckCircle2 className="h-3 w-3" />}
                                </button>
                            </div>
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                                {wallets.map((w) => (
                                    <label key={w.userId} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <input
                                            type="checkbox"
                                            checked={form.userIds.includes(w.userId)}
                                            onChange={() => toggleUser(w.userId)}
                                            className="accent-blue-600"
                                        />
                                        <span className="text-sm text-gray-800 dark:text-gray-200">
                                            {w.user ? `${w.user.firstName} ${w.user.lastName}` : w.userId}
                                        </span>
                                        <span className="ml-auto text-xs text-gray-400 tabular-nums">
                                            {parseFloat(w.balance).toLocaleString("fr-FR")} XOF
                                        </span>
                                    </label>
                                ))}
                            </div>
                            {form.userIds.length > 0 && (
                                <p className="text-xs text-blue-600 mt-1">{form.userIds.length} employé{form.userIds.length !== 1 ? "s" : ""} sélectionné{form.userIds.length !== 1 ? "s" : ""}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-1">
                            <button
                                onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setSelectAll(false); }}
                                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAllocate}
                                disabled={saving}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 text-sm font-medium rounded-lg transition"
                            >
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                Allouer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
