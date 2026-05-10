"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, FileText } from "lucide-react";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";

interface Expense {
    id: string;
    title: string;
    amount: number;
    status: string;
    destination: string | null;
    createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:  { label: "Pending",  color: "#f59e0b", bg: "#fffbeb" },
    APPROVED: { label: "Approved", color: "#10b981", bg: "#f0fdf4" },
    REJECTED: { label: "Rejected", color: "#ef4444", bg: "#fef2f2" },
};

const MOCK_EXPENSES: Expense[] = [
    { id: "1", title: "Déplacement client Paris", amount: 1245,
        status: "APPROVED", destination: "Paris → London", createdAt: "2024-12-15" },
    { id: "2", title: "Conférence Berlin",        amount: 890,
        status: "PENDING",  destination: "Berlin → Amsterdam", createdAt: "2024-12-12" },
    { id: "3", title: "Formation Dakar",           amount: 450,
        status: "PENDING",  destination: null, createdAt: "2024-12-10" },
];

export default function NotesDeFragsPage() {
    const router = useRouter();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        employeeService.getMyExpenses()
        .then((data) => setExpenses(data.length ? data : MOCK_EXPENSES))
        .catch(() => setExpenses(MOCK_EXPENSES))
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
            { label: "Remboursé",      value: `€${totalApproved.toLocaleString()}`, color: "#10b981", bg: "#f0fdf4" },
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
                ) : (
                expenses.map((exp) => {
                    const st = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.PENDING;
                    return (
                    <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{exp.title}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">{exp.destination ?? "—"}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                        {new Date(exp.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                        €{exp.amount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{ color: st.color, background: st.bg }}>
                            {st.label}
                        </span>
                        </td>
                        <td className="px-5 py-3">
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
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
        </div>
    );
}