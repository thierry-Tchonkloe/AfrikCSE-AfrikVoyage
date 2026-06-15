"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, ChevronLeft, Loader2, Camera } from "lucide-react";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";

interface Travel {
    id: string;
    destination: string;
    departureDate: string;
}

const CATEGORIES = [
    "Transport", "Hébergement", "Restauration", "Fournitures",
    "Communication", "Formation", "Représentation", "Autre",
];

const PAYMENT_METHODS = [
    { id: "card",     label: "Carte pro" },
    { id: "personal", label: "Personnel" },
    { id: "cash",     label: "Espèces" },
    { id: "transfer", label: "Virement" },
];

export default function NouvelleNotePage() {
    const router = useRouter();
    const [saving, setSaving]   = useState(false);
    const [uploadedFile, setUploadedFile] = useState<{name: string; size: string} | null>(null);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [travels, setTravels] = useState<Travel[]>([]);

    const [form, setForm] = useState({
        title:         "",
        date:          "",
        travelId:      "",
        category:      "",
        amount:        "",
        paymentMethod: "card",
        description:   "",
    });

    useEffect(() => {
        employeeService.getMyTravels()
        .then((data) => setTravels(data))
        .catch(() => toast.error("Erreur lors du chargement des voyages"));
    }, []);

    const upd = (k: keyof typeof form, v: string) =>
        setForm((prev) => ({ ...prev, [k]: v }));

    const handleSubmit = async () => {
        if (!form.title || !form.amount) {
        toast.error("Titre et montant requis");
        return;
        }
        setSaving(true);
        try {
        await employeeService.createExpense({
            title:         form.title,
            amount:        parseFloat(form.amount),
            description:   form.description || undefined,
            category:      form.category || undefined,
            paymentMethod: form.paymentMethod,
            expenseDate:   form.date || undefined,
            travelId:      form.travelId || undefined,
            receipts:      receiptUrl ? [receiptUrl] : [],
        });
        toast.success("Soumis pour validation");
        router.push("/employes/notes-de-frais");
        } catch { toast.error("Erreur lors de la soumission"); }
        finally { setSaving(false); }
    };

    const handleFile = async (file: File) => {
        setUploadedFile({ name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB` });
        setUploading(true);
        try {
        const res = await employeeService.uploadReceipt(file);
        setReceiptUrl(res.url);
        } catch {
        toast.error("Erreur lors de l'envoi du justificatif");
        setUploadedFile(null);
        } finally {
        setUploading(false);
        }
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    return (
        <div className="space-y-5 px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
            <button onClick={() => router.back()}
            className="hover:underline flex items-center gap-1">
            <ChevronLeft size={14} /> Notes de frais
            </button>
            <span>/</span>
            <span className="text-gray-900">Nouvelle note de frais</span>
        </div>

        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Créer une note de frais</h1>
            <p className="text-sm text-gray-500">
                Soumettez vos dépenses professionnelles pour remboursement
            </p>
            </div>
            <button onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <X size={16} /> Annuler
            </button>
        </div>

        {/* Informations générales */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">
            Informations générales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                Titre de la note *
                </label>
                <input value={form.title}
                onChange={(e) => upd("title", e.target.value)}
                placeholder="Ex: Déplacement client Paris"
                className={inp} />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                Date de la dépense *
                </label>
                <input type="date" value={form.date}
                onChange={(e) => upd("date", e.target.value)}
                className={inp} />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                Rattacher à un voyage (optionnel)
                </label>
                <select value={form.travelId}
                onChange={(e) => upd("travelId", e.target.value)}
                className={inp}>
                <option value="">Sélectionner un voyage...</option>
                {travels.map((t) => (
                    <option key={t.id} value={t.id}>
                    {t.destination} ({new Date(t.departureDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })})
                    </option>
                ))}
                </select>
            </div>
            </div>
        </div>

        {/* Détails dépense */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">
            Détails de la dépense
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                Catégorie de dépense *
                </label>
                <select value={form.category}
                onChange={(e) => upd("category", e.target.value)}
                className={inp}>
                <option value="">Sélectionner une catégorie...</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Montant *</label>
                <div className="relative">
                <input type="number" value={form.amount}
                    onChange={(e) => upd("amount", e.target.value)}
                    placeholder="0.00"
                    className={inp + " pr-12"} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    XOF
                </span>
                </div>
            </div>
            <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                Mode de paiement *
                </label>
                <div className="flex gap-2 flex-wrap">
                {PAYMENT_METHODS.map((m) => (
                    <button key={m.id}
                    onClick={() => upd("paymentMethod", m.id)}
                    className="px-4 py-2 rounded-lg text-xs font-medium border transition-colors"
                    style={form.paymentMethod === m.id
                        ? { background: "#0f766e", color: "white", borderColor: "#0f766e" }
                        : { borderColor: "#e5e7eb", color: "#6b7280" }}
                    >
                    {m.label}
                    </button>
                ))}
                </div>
            </div>
            <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                Description / Notes
                </label>
                <textarea value={form.description}
                onChange={(e) => upd("description", e.target.value)}
                rows={3}
                placeholder="Ajoutez des détails sur cette dépense..."
                className={inp + " resize-none"} />
            </div>
            </div>
        </div>

        {/* Justificatif */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div>
            <h3 className="font-semibold text-gray-900">Justificatif</h3>
            <p className="text-xs text-gray-500">
                Scannez ou téléchargez votre reçu (PDF, JPG, PNG – max 5 Mo)
            </p>
            </div>

            {/* Zone de drop */}
            <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-teal-300 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => document.getElementById("file-input")?.click()}
            >
            <Upload size={28} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Cliquez pour télécharger ou glissez votre fichier</p>
            <p className="text-xs text-gray-400 mt-1">Formats acceptés : PDF, JPG, PNG (max 5 Mo)</p>
            <input id="file-input" type="file" className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
                }}
            />
            <input id="scan-input" type="file" className="hidden"
                accept="image/*" capture="environment"
                onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
                }}
            />
            <div className="flex gap-2 justify-center mt-3">
                <button type="button"
                onClick={(e) => { e.stopPropagation(); document.getElementById("file-input")?.click(); }}
                className="text-xs px-4 py-1.5 border border-gray-200 rounded-lg text-gray-600">
                Parcourir
                </button>
                <button type="button"
                onClick={(e) => { e.stopPropagation(); document.getElementById("scan-input")?.click(); }}
                className="flex items-center gap-1.5 text-xs px-4 py-1.5 border border-gray-200 rounded-lg text-gray-600">
                <Camera size={14} /> Scanner le reçu
                </button>
            </div>
            </div>

            {/* Fichier uploadé */}
            {uploadedFile && (
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
                {uploading
                ? <Loader2 size={20} className="animate-spin text-gray-400" />
                : <span className="text-red-500 text-xl">📄</span>}
                <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{uploadedFile.name}</p>
                <p className="text-xs text-gray-400">
                    {uploading ? "Envoi en cours..." : uploadedFile.size}
                </p>
                </div>
                <button onClick={() => { setUploadedFile(null); setReceiptUrl(null); }}
                className="text-red-400 hover:text-red-600 text-xl leading-none">
                ×
                </button>
            </div>
            )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end">
            <button
                onClick={handleSubmit}
                disabled={saving || uploading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-70"
                style={{ background: "#0f766e" }}
            >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Soumettre pour validation
            </button>
        </div>

        {/* Conseils */}
        <div
            className="rounded-xl p-4 text-xs space-y-1"
            style={{ background: "#f0fdf4", borderLeft: "3px solid #0f766e" }}
        >
            <p className="font-semibold text-gray-700">💡 Conseils pour une validation rapide</p>
            {[
            "Assurez-vous que le justificatif est lisible et complet",
            "Vérifiez que le montant correspond au reçu",
            "Rattachez la dépense au voyage concerné si applicable",
            "Les notes de frais sont traitées sous 48-72h ouvrées",
            ].map((tip) => (
            <p key={tip} className="text-gray-500">• {tip}</p>
            ))}
        </div>
        </div>
    );
}

const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400 bg-white text-gray-900";