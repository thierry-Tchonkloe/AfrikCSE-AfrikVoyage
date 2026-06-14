"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Share2, Loader2, Upload, X } from "lucide-react";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

interface CatalogItem {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    category: string;
    subsidyPct: number;
    employeePrice: number;
    companyPrice: number;
    validUntil: string | null;
    maxPerFamily: number | null;
}

interface BenefitCategory {
    id: string;
    name: string;
    remainingAmount: number;
}

const CATEGORY_ICONS: Record<string, string> = {
    "Sports et bien-être": "🏋️",
    "Restauration": "🍽️",
    "Education": "🎓",
    "Culture": "🎭",
    "Santé": "💊",
};

const URGENCY_OPTIONS = [
    { value: "LOW",    label: "Faible",  color: "#10b981" },
    { value: "MEDIUM", label: "Normal",  color: "#f59e0b" },
    { value: "HIGH",   label: "Urgent",  color: "#ef4444" },
];

export default function AvantageDetailPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [item, setItem]       = useState<CatalogItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [categories, setCategories] = useState<BenefitCategory[]>([]);

    // Modal soumission
    const [showModal, setShowModal]       = useState(false);
    const [submitAmount, setSubmitAmount] = useState("");
    const [submitDesc, setSubmitDesc]     = useState("");
    const [submitUrgency, setSubmitUrgency] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
    const [submitting, setSubmitting]     = useState(false);
    const [receiptFile, setReceiptFile] = useState<{ name: string; size: string } | null>(null);
    const [receiptUrl, setReceiptUrl]   = useState<string | null>(null);
    const [uploadingReceipt, setUploadingReceipt] = useState(false);

    useEffect(() => {
        Promise.all([
            employeeService.getCatalogItem(id),
            employeeService.getBenefitCategories(),
        ])
            .then(([catalogItem, cats]) => {
                setItem(catalogItem);
                setCategories(cats);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    const matchingCategory = item
        ? categories.find((c) => c.name.toLowerCase() === item.category.toLowerCase())
        : undefined;

    const openModal = () => {
        if (!item) return;
        if (!matchingCategory) {
            toast.error("Aucune catégorie d'avantage CSE ne correspond. Contactez votre RH.");
            return;
        }
        if (matchingCategory.remainingAmount <= 0) {
            toast.error("Plafond de cette catégorie atteint pour cette année.");
            return;
        }
        setSubmitAmount(String(item.employeePrice));
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
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

    const handleSubmit = async () => {
        if (!matchingCategory) return;
        const amount = parseFloat(submitAmount);
        if (!amount || amount <= 0) {
            toast.error("Montant invalide");
            return;
        }
        if (amount > matchingCategory.remainingAmount) {
            toast.error(`Montant supérieur au plafond restant (${matchingCategory.remainingAmount.toLocaleString()} XOF)`);
            return;
        }
        setSubmitting(true);
        try {
            await employeeService.submitBenefitRequest({
                categoryId: matchingCategory.id,
                amount,
                description: submitDesc || `Utilisation de l'avantage : ${item?.title}`,
                urgency: submitUrgency,
                receipts: receiptUrl ? [receiptUrl] : [],
            });
            toast.success("Demande soumise — en attente d'approbation");
            closeModal();
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la soumission"));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-3xl space-y-5">
                <div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />
                <div className="h-80 bg-white rounded-xl border border-gray-200 animate-pulse" />
            </div>
        );
    }

    if (notFound || !item) {
        return (
            <div className="max-w-3xl text-center py-16 text-gray-500">
                <p className="text-4xl mb-3">🎁</p>
                <p className="font-medium">Avantage introuvable</p>
                <button onClick={() => router.push("/employes/avantages")}
                    className="mt-4 text-sm hover:underline" style={{ color: "#0f766e" }}>
                    Retour au catalogue
                </button>
            </div>
        );
    }

    const icon = CATEGORY_ICONS[item.category] ?? "🎁";
    const totalPrice = item.employeePrice + item.companyPrice;

    return (
        <div className="max-w-3xl space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
            <button onClick={() => router.push("/employes/avantages")}
            className="hover:underline">Avantages</button>
            <span>/</span>
            <span className="text-gray-900">{item.title}</span>
        </div>

        {/* Card principale */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: "#fff7ed" }}
                >
                {icon}
                </div>
                <div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "#fff7ed", color: "#f59e0b" }}>
                    {item.category}
                </span>
                <h1 className="text-lg font-bold text-gray-900 mt-1">{item.title}</h1>
                {item.validUntil && (
                    <p className="text-xs text-gray-500">
                        ✅ Valable jusqu&#39;au {new Date(item.validUntil).toLocaleDateString("fr-FR")}
                    </p>
                )}
                </div>
            </div>
            <button
                onClick={() => toast.info("Lien copié !")}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
                <Share2 size={13} /> Partager
            </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Gauche : image + description */}
            <div className="lg:col-span-2 space-y-4">
                {/* Image principale */}
                {item.imageUrl ? (
                <div className="relative w-full h-52 rounded-xl overflow-hidden">
                    <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                </div>
                ) : (
                <div
                className="h-52 rounded-xl flex items-center justify-center text-7xl"
                style={{ background: "#fff7ed" }}
                >
                {icon}
                </div>
                )}

                {/* Description */}
                {item.description && (
                <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description de l&#39;offre</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                    {item.description}
                </p>
                </div>
                )}
            </div>

            {/* Droite : prix + actions */}
            <div className="space-y-4">
                {/* Prix */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div>
                    <p className="text-3xl font-bold text-gray-900">{item.employeePrice.toLocaleString()} XOF</p>
                    {item.companyPrice > 0 && (
                    <>
                        <p className="text-xs text-gray-400 line-through">
                        Prix total {totalPrice.toLocaleString()} XOF
                        </p>
                        <p className="text-sm font-semibold" style={{ color: "#10b981" }}>
                        Économisez {item.companyPrice.toLocaleString()} XOF ({item.subsidyPct}%)
                        </p>
                    </>
                    )}
                </div>
                <div className="space-y-1.5 text-sm border-t border-gray-100 pt-3">
                    {[
                    { label: "Subvention CSE",   value: `${item.companyPrice.toLocaleString()} XOF`, color: "#0f766e" },
                    { label: "Votre participation", value: `${item.employeePrice.toLocaleString()} XOF`, color: "#111", bold: true },
                    ].map((row) => (
                    <div key={row.label} className="flex justify-between">
                        <span className="text-gray-500 text-xs">{row.label}</span>
                        <span
                        className={`text-xs ${row.bold ? "font-bold" : "font-medium"}`}
                        style={{ color: row.color }}
                        >
                        {row.value}
                        </span>
                    </div>
                    ))}
                </div>

                <button
                    onClick={openModal}
                    className="w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2"
                    style={{ background: "#0f766e" }}
                >
                    🎁 Utiliser l&#39;avantage
                </button>
                </div>

                {/* Éligibilité */}
                {item.maxPerFamily != null && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                    <h4 className="font-semibold text-sm text-gray-900">Conditions d&#39;éligibilité</h4>
                    <div className="flex items-start gap-2">
                        <span className="text-base shrink-0">👨‍👩‍👧</span>
                        <div>
                            <p className="text-xs font-semibold text-gray-900">Limite famille</p>
                            <p className="text-xs text-gray-500">Maximum {item.maxPerFamily} bénéficiaire{item.maxPerFamily > 1 ? "s" : ""} par famille</p>
                        </div>
                    </div>
                </div>
                )}
            </div>
            </div>
        </div>

        {/* ── Modal demande ──────────────────────────────────────────────────── */}
        {showModal && matchingCategory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h3 className="font-bold text-gray-900">{icon} {item.title}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Plafond disponible : <strong>{matchingCategory.remainingAmount.toLocaleString()} XOF</strong>
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
                                placeholder={`Max: ${matchingCategory.remainingAmount.toLocaleString()}`}
                                max={matchingCategory.remainingAmount}
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
                                placeholder={`Utilisation de l'avantage : ${item.title}`}
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
                                    onClick={() => document.getElementById("benefit-detail-receipt-input")?.click()}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-500 hover:border-teal-300 transition-colors"
                                >
                                    <Upload size={14} /> Télécharger un justificatif (PDF, JPG, PNG)
                                </button>
                            )}
                            <input
                                id="benefit-detail-receipt-input"
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
