"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, FileText, X } from "lucide-react";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";

interface Expense {
    id: string;
    title: string;
    description: string | null;
    amount: number;
    status: string;
    destination: string | null;
    category: string | null;
    paymentMethod: string | null;
    expenseDate: string | null;
    rejectionNote: string | null;
    receipts: string[];
    createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:   { label: "En attente", color: "#f59e0b", bg: "#fffbeb" },
    APPROVED:  { label: "Approuvé",   color: "#10b981", bg: "#f0fdf4" },
    REJECTED:  { label: "Rejeté",     color: "#ef4444", bg: "#fef2f2" },
    CANCELLED: { label: "Annulé",     color: "#6b7280", bg: "#f9fafb" },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    card: "Carte pro",
    personal: "Personnel",
    cash: "Espèces",
    transfer: "Virement",
};

export default function NotesDeFragsPage() {
    const router = useRouter();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading]   = useState(true);
    const [selected, setSelected] = useState<Expense | null>(null);

    useEffect(() => {
        employeeService.getMyExpenses()
        .then((data) => setExpenses(data))
        .catch(() => toast.error("Erreur lors du chargement des notes de frais"))
        .finally(() => setLoading(false));
    }, []);

    const totalPending  = expenses.filter((e) => e.status === "PENDING").length;
    const totalApproved = expenses.filter((e) => e.status === "APPROVED")
        .reduce((s, e) => s + e.amount, 0);

    return (
        <div className="space-y-5">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Notes de frais</h1>
            <p className="text-sm text-gray-500">Soumettez et suivez vos remboursements</p>
            </div>
            <button
            onClick={() => router.push("/employes/notes-de-frais/nouveau")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: "#0f766e" }}
            >
            <Plus size={15} /> Créer une note
            </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
            { label: "En attente",     value: totalPending,          color: "#f59e0b", bg: "#fffbeb" },
            { label: "Remboursé",      value: `${totalApproved.toLocaleString()} XOF`, color: "#10b981", bg: "#f0fdf4" },
            { label: "Total soumis",   value: expenses.length,       color: "#3b82f6", bg: "#eff6ff" },
            ].map((s) => (
            <div key={s.label}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: s.bg }}>
                <FileText size={18} style={{ color: s.color }} />
                </div>
                <div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
                </div>
            </div>
            ))}
        </div>

        {/* Liste */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
            <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                {["Titre", "Destination", "Date", "Montant", "Statut", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                ))}
                </tr>
            </thead>
            <tbody>
                {loading ? (
                [...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b">
                    <td colSpan={6} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                    </tr>
                ))
                ) : expenses.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                    Aucune note de frais pour le moment.
                    </td>
                </tr>
                ) : (
                expenses.map((exp) => {
                    const st = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.PENDING;
                    return (
                    <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{exp.title}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">{exp.destination ?? "—"}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                        {new Date(exp.expenseDate ?? exp.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                        {exp.amount.toLocaleString()} XOF
                        </td>
                        <td className="px-5 py-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{ color: st.color, background: st.bg }}>
                            {st.label}
                        </span>
                        </td>
                        <td className="px-5 py-3">
                        <button onClick={() => setSelected(exp)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                            <Eye size={15} />
                        </button>
                        </td>
                    </tr>
                    );
                })
                )}
            </tbody>
            </table>
        </div>

        {/* Modal détail */}
        {selected && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
                <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-bold text-gray-900">{selected.title}</h3>
                    <p className="text-xs text-gray-500">
                    {new Date(selected.expenseDate ?? selected.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                </button>
                </div>

                <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Statut</span>
                {(() => {
                    const st = STATUS_CONFIG[selected.status] ?? STATUS_CONFIG.PENDING;
                    return (
                    <span className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{ color: st.color, background: st.bg }}>
                        {st.label}
                    </span>
                    );
                })()}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-xs text-gray-400">Montant</p>
                    <p className="font-semibold text-gray-900">{selected.amount.toLocaleString()} XOF</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">Catégorie</p>
                    <p className="text-gray-900">{selected.category ?? "—"}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">Destination</p>
                    <p className="text-gray-900">{selected.destination ?? "—"}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">Mode de paiement</p>
                    <p className="text-gray-900">
                    {selected.paymentMethod
                        ? PAYMENT_METHOD_LABELS[selected.paymentMethod] ?? selected.paymentMethod
                        : "—"}
                    </p>
                </div>
                </div>

                {selected.description && (
                <div>
                    <p className="text-xs text-gray-400 mb-1">Description</p>
                    <p className="text-sm text-gray-700">{selected.description}</p>
                </div>
                )}

                {selected.status === "REJECTED" && selected.rejectionNote && (
                <div className="rounded-lg p-3 text-xs" style={{ background: "#fef2f2", color: "#ef4444" }}>
                    Motif du rejet : {selected.rejectionNote}
                </div>
                )}

                {selected.receipts.length > 0 && (
                <div>
                    <p className="text-xs text-gray-400 mb-1">Justificatifs</p>
                    <div className="space-y-1">
                    {selected.receipts.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                        className="block text-xs hover:underline" style={{ color: "#0f766e" }}>
                        {url}
                        </a>
                    ))}
                    </div>
                </div>
                )}
            </div>
            </div>
        )}
        </div>
    );
}