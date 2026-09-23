"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { Upload, X, ChevronLeft, Loader2, Camera } from "lucide-react";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useOptionLabel } from "@/hooks/useOptionLabel";
import { useDateLocale } from "@/hooks/useDateLocale";

type Translator = ReturnType<typeof useTranslations<"employee.notesDeFraisNouveau">>;

interface Travel {
    id: string;
    destination: string;
    departureDate: string;
}

const CATEGORIES = [
    "Transport", "Hébergement", "Restauration", "Fournitures",
    "Communication", "Formation", "Représentation", "Autre",
];

const getPaymentMethods = (tr: Translator) => ([
    { id: "card",     label: tr("companyCard") },
    { id: "personal", label: tr("personal") },
    { id: "cash",     label: tr("cash") },
    { id: "transfer", label: tr("bankTransfer") },
]);

export default function NouvelleNotePage() {
    const dateLocale = useDateLocale();
    const tr = useTranslations("employee.notesDeFraisNouveau");
    const optionLabel = useOptionLabel();
    const PAYMENT_METHODS = useMemo(() => getPaymentMethods(tr), [tr]);
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
        .catch(() => toast.error(tr("errorLoadingTrips")));
    }, []);

    const upd = (k: keyof typeof form, v: string) =>
        setForm((prev) => ({ ...prev, [k]: v }));

    const handleSubmit = async () => {
        if (!form.title || !form.amount) {
        toast.error(tr("titleAmountRequired"));
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
        toast.success(tr("submittedApproval"));
        router.push("/employes/notes-de-frais");
        } catch { toast.error(tr("errorWhileSubmitting")); }
        finally { setSaving(false); }
    };

    const handleFile = async (file: File) => {
        setUploadedFile({ name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB` });
        setUploading(true);
        try {
        const res = await employeeService.uploadReceipt(file);
        setReceiptUrl(res.url);

        // Scan OCR best-effort : ne bloque jamais la soumission si l'extraction
        // échoue, ne pré-remplit que les champs encore vides (ne jamais écraser
        // une saisie déjà faite par l'employé).
        try {
            const { extractedData } = await employeeService.scanReceipt(res.url);
            setForm((prev) => ({
            ...prev,
            amount: prev.amount || (extractedData.amount != null ? String(extractedData.amount) : prev.amount),
            date:   prev.date   || extractedData.date || prev.date,
            }));
            if (extractedData.amount != null) {
            toast.success(tr("amountAutomaticallyDetected"));
            }
        } catch {
            // Scan OCR indisponible : l'employé complète le formulaire manuellement.
        }
        } catch {
        toast.error(tr("errorWhileUploadingReceipt"));
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
            <ChevronLeft size={14} /> {tr("expenseReports")}
            </button>
            <span>/</span>
            <span className="text-gray-900">{tr("newExpenseReport")}</span>
        </div>

        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-xl font-bold text-gray-900">{tr("createExpenseReport")}</h1>
            <p className="text-sm text-gray-500">
                {tr("submitBusinessExpenses")}
            </p>
            </div>
            <button onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <X size={16} /> {tr("cancel")}
            </button>
        </div>

        {/* Informations générales */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">
            {tr("generalInformation")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                {tr("reportTitle")}
                </label>
                <input value={form.title}
                onChange={(e) => upd("title", e.target.value)}
                placeholder={tr("eGClientTrip")}
                className={inp} />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                {tr("expenseDate")}
                </label>
                <input type="date" value={form.date}
                onChange={(e) => upd("date", e.target.value)}
                className={inp} />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                {tr("linkTripOptional")}
                </label>
                <select value={form.travelId}
                onChange={(e) => upd("travelId", e.target.value)}
                className={inp}>
                <option value="">{tr("selectTrip")}</option>
                {travels.map((t) => (
                    <option key={t.id} value={t.id}>
                    {t.destination} ({new Date(t.departureDate).toLocaleDateString(dateLocale, { day: "numeric", month: "short" })})
                    </option>
                ))}
                </select>
            </div>
            </div>
        </div>

        {/* Détails dépense */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">
            {tr("expenseDetails")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                {tr("expenseCategory")}
                </label>
                <select value={form.category}
                onChange={(e) => upd("category", e.target.value)}
                className={inp}>
                <option value="">{tr("selectCategory")}</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{optionLabel(c)}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{tr("amount")}</label>
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
                {tr("paymentMethod")}
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
                {tr("descriptionNotes")}
                </label>
                <textarea value={form.description}
                onChange={(e) => upd("description", e.target.value)}
                rows={3}
                placeholder={tr("addDetailsAboutExpense")}
                className={inp + " resize-none"} />
            </div>
            </div>
        </div>

        {/* Justificatif */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div>
            <h3 className="font-semibold text-gray-900">{tr("receipt")}</h3>
            <p className="text-xs text-gray-500">
                {tr("scanUploadReceiptPdf")}
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
            <p className="text-sm text-gray-600">{tr("clickUploadDragFile")}</p>
            <p className="text-xs text-gray-400 mt-1">{tr("acceptedFormatsPdfJpg")}</p>
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
                {tr("browse")}
                </button>
                <button type="button"
                onClick={(e) => { e.stopPropagation(); document.getElementById("scan-input")?.click(); }}
                className="flex items-center gap-1.5 text-xs px-4 py-1.5 border border-gray-200 rounded-lg text-gray-600">
                <Camera size={14} /> {tr("scanReceipt")}
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
                    {uploading ? tr("sending") : uploadedFile.size}
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
                {tr("submitApproval")}
            </button>
        </div>

        {/* Conseils */}
        <div
            className="rounded-xl p-4 text-xs space-y-1"
            style={{ background: "#f0fdf4", borderLeft: "3px solid #0f766e" }}
        >
            <p className="font-semibold text-gray-700">{tr("tipsQuickApproval")}</p>
            {[
            tr("makeSureReceiptLegible"),
            tr("checkAmountMatchesReceipt"),
            tr("linkExpenseRelevantTrip"),
            tr("expenseReportsProcessed"),
            ].map((tip) => (
            <p key={tip} className="text-gray-500">• {tip}</p>
            ))}
        </div>
        </div>
    );
}

const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400 bg-white text-gray-900";