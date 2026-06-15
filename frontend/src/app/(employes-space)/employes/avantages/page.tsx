"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, X, Loader2, History, Upload } from "lucide-react";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

interface BenefitCategory {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    annualBudget: number;
    perEmployeeLimit: number;
    usedAmount: number;
    remainingAmount: number;
    isActive: boolean;
}

interface BenefitRequest {
    id: string;
    categoryId: string;
    amount: number;
    description: string | null;
    receipts: string[];
    urgency: string;
    status: string;
    createdAt: string;
    category: { id: string; name: string; icon: string | null };
}

interface BenefitBalance {
    totalLimit: number;
    totalUsed: number;
    totalRemaining: number;
    byCategory: { id: string; name: string; limit: number; used: number; remaining: number }[];
}

const URGENCY_OPTIONS = [
    { value: "LOW",    label: "Faible",  color: "#10b981" },
    { value: "MEDIUM", label: "Normal",  color: "#f59e0b" },
    { value: "HIGH",   label: "Urgent",  color: "#ef4444" },
];

export default function AvantagesPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<BenefitCategory[]>([]);
    const [requests, setRequests]     = useState<BenefitRequest[]>([]);
    const [balance, setBalance]       = useState<BenefitBalance | null>(null);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState("");

    // Modal soumission
    const [submitModal, setSubmitModal]   = useState<BenefitCategory | null>(null);
    const [submitAmount, setSubmitAmount] = useState("");
    const [submitDesc, setSubmitDesc]     = useState("");
    const [submitUrgency, setSubmitUrgency] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
    const [submitting, setSubmitting]     = useState(false);

    // Upload justificatif
    const [receiptFile, setReceiptFile] = useState<{ name: string; size: string } | null>(null);
    const [receiptUrl, setReceiptUrl]   = useState<string | null>(null);
    const [uploadingReceipt, setUploadingReceipt] = useState(false);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [cats, reqs, bal] = await Promise.all([
                employeeService.getBenefitCategories(),
                employeeService.getMyBenefitRequests(),
                employeeService.getBenefitBalance(),
            ]);
            setCategories(cats);
            setRequests(reqs);
            setBalance(bal);
        } catch {
            toast.error("Erreur de chargement des avantages");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    const handleSubmit = async () => {
        if (!submitModal) return;
        const amount = parseFloat(submitAmount);
        if (!amount || amount <= 0) {
            toast.error("Montant invalide");
            return;
        }
        if (amount > submitModal.remainingAmount) {
            toast.error(`Montant supérieur au plafond restant (${submitModal.remainingAmount.toLocaleString()} XOF)`);
            return;
        }
        setSubmitting(true);
        try {
            await employeeService.submitBenefitRequest({
                categoryId: submitModal.id,
                amount,
                description: submitDesc || undefined,
                urgency: submitUrgency,
                receipts: receiptUrl ? [receiptUrl] : [],
            });
            toast.success("Demande soumise — en attente d'approbation");
            closeModal();
            loadAll();
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la soumission"));
        } finally {
            setSubmitting(false);
        }
    };

    const closeModal = () => {
        setSubmitModal(null);
        setSubmitAmount("");
        setSubmitDesc("");
        setSubmitUrgency("MEDIUM");
        setReceiptFile(null);
        setReceiptUrl(null);
    };

    const handleFile = async (file: File) => {
        setReceiptFile({ name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB` });
        setUploadingReceipt(true);
        try {
            const res = await employeeService.uploadReceipt(file);
            setReceiptUrl(res.url);
        } catch {
            toast.error("Erreur lors de l'envoi du justificatif");
            setReceiptFile(null);
        } finally {
            setUploadingReceipt(false);
        }
    };

    const filteredCategories = categories.filter(
        (c) => !search || c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5">
            {/* En-tête */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Mes avantages CSE</h1>
                    <p className="text-sm text-gray-500">Accédez à vos avantages et suivez vos demandes</p>
                </div>
                <div className="flex items-center gap-3">
                    {balance && (
                        <div
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium"
                            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                        >
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Budget disponible</p>
                                <p className="font-bold text-lg" style={{ color: "#0f766e" }}>
                                    {balance.totalRemaining.toLocaleString()} XOF
                                </p>
                            </div>
                            <div className="w-px h-8 bg-green-200" />
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Utilisé</p>
                                <p className="font-semibold text-gray-700">{balance.totalUsed.toLocaleString()} XOF</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => router.push("/employes/mes-demandes")}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        <History size={15} />
                        Mes demandes{requests.length ? ` (${requests.length})` : ""}
                    </button>
                </div>
            </div>

            {/* ── Catalogue ─────────────────────────────────────────────────────────── */}
            <>
                    <div className="relative max-w-sm">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher une catégorie..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                        />
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-52 bg-white rounded-xl border border-gray-200 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="text-center py-16 text-gray-500">
                            <p className="text-4xl mb-3">🎁</p>
                            <p className="font-medium">Aucune catégorie d&apos;avantages configurée</p>
                            <p className="text-xs mt-1">Contactez votre administrateur RH</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredCategories.map((cat) => {
                                const usagePercent = cat.perEmployeeLimit > 0
                                    ? Math.min(100, (cat.usedAmount / cat.perEmployeeLimit) * 100)
                                    : 0;
                                const isExhausted = cat.remainingAmount <= 0;
                                const icon = cat.icon ?? "🎁";

                                return (
                                    <div
                                        key={cat.id}
                                        className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                                        style={isExhausted ? { opacity: 0.7 } : {}}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                                                style={{ background: "#f0fdf4" }}
                                            >
                                                {icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 text-sm">{cat.name}</p>
                                                {cat.description && (
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{cat.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Barre de progression */}
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Utilisé</span>
                                                <span className="font-medium" style={{ color: isExhausted ? "#ef4444" : "#0f766e" }}>
                                                    {cat.usedAmount.toLocaleString()} / {cat.perEmployeeLimit.toLocaleString()} XOF
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${usagePercent}%`,
                                                        background: usagePercent >= 90 ? "#ef4444" : usagePercent >= 70 ? "#f59e0b" : "#0f766e",
                                                    }}
                                                />
                                            </div>
                                            <p className="text-xs text-right mt-1 font-medium" style={{ color: "#0f766e" }}>
                                                Reste : {cat.remainingAmount.toLocaleString()} XOF
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => !isExhausted && setSubmitModal(cat)}
                                            disabled={isExhausted}
                                            className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                                            style={isExhausted
                                                ? { background: "#f3f4f6", color: "#9ca3af" }
                                                : { background: "#0f766e", color: "white" }}
                                        >
                                            {isExhausted ? "Plafond atteint" : (
                                                <span className="flex items-center justify-center gap-1.5">
                                                    <Plus size={14} /> Faire une demande
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
            </>

            {/* ── Modal soumission demande ──────────────────────────────────────────── */}
            {submitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="font-bold text-gray-900">
                                    {submitModal.icon ?? "🎁"} {submitModal.name}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Plafond disponible : <strong>{submitModal.remainingAmount.toLocaleString()} XOF</strong>
                                </p>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Montant demandé (XOF) *
                                </label>
                                <input
                                    type="number"
                                    value={submitAmount}
                                    onChange={(e) => setSubmitAmount(e.target.value)}
                                    placeholder={`Max: ${submitModal.remainingAmount.toLocaleString()}`}
                                    max={submitModal.remainingAmount}
                                    min={1}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Description / Justification
                                </label>
                                <textarea
                                    value={submitDesc}
                                    onChange={(e) => setSubmitDesc(e.target.value)}
                                    placeholder="Décrivez brièvement votre demande..."
                                    rows={3}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none resize-none focus:border-teal-400"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">Priorité</label>
                                <div className="flex gap-2">
                                    {URGENCY_OPTIONS.map((u) => (
                                        <button
                                            key={u.value}
                                            type="button"
                                            onClick={() => setSubmitUrgency(u.value as "LOW" | "MEDIUM" | "HIGH")}
                                            className="flex-1 py-2 rounded-lg text-xs font-medium border-2 transition-all"
                                            style={submitUrgency === u.value
                                                ? { borderColor: u.color, color: u.color, background: u.color + "12" }
                                                : { borderColor: "#e5e7eb", color: "#6b7280" }}
                                        >
                                            {u.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Justificatif (optionnel)
                                </label>
                                {receiptFile ? (
                                    <div className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg">
                                        {uploadingReceipt
                                            ? <Loader2 size={16} className="animate-spin text-gray-400" />
                                            : <span className="text-red-500">📄</span>}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-900 truncate">{receiptFile.name}</p>
                                            <p className="text-xs text-gray-400">
                                                {uploadingReceipt ? "Envoi en cours..." : receiptFile.size}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setReceiptFile(null); setReceiptUrl(null); }}
                                            className="text-red-400 hover:text-red-600 text-lg leading-none"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById("benefit-receipt-input")?.click()}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-500 hover:border-teal-300 transition-colors"
                                    >
                                        <Upload size={14} /> Télécharger un justificatif (PDF, JPG, PNG)
                                    </button>
                                )}
                                <input
                                    id="benefit-receipt-input"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleFile(f);
                                        e.target.value = "";
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeModal}
                                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || uploadingReceipt}
                                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                                style={{ background: "#0f766e" }}
                            >
                                {submitting && <Loader2 size={14} className="animate-spin" />}
                                Soumettre
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
