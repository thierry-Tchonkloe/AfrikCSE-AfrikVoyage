"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { cseService } from "@/services/companies/cse.service";
import { toast } from "sonner";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";

interface ApprovalStat {
    pending: number;
    approvedToday: number;
    totalAmount: number;
    avgResponseHours: number;
}

interface BenefitReq {
    id: string;
    amount: number;
    urgency: string;
    status: string;
    createdAt: string;
    employee: {
        user: { firstName: string; lastName: string; email: string; department: string | null };
    };
    category: { name: string; icon: string | null };
}

interface CategoryOption {
    id: string;
    name: string;
    isActive: boolean;
}

const URGENCY_COLOR: Record<string, string> = {
    HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981",
};

const TYPE_ICON: Record<string, string> = {
    "Business Travel": "✈️", "Wellness Benefit": "🎁", "Expense Report": "📋",
};

// Seuils réalistes en XOF pour une demande d'avantage CSE (même logique de
// recalibrage que les seuils de voyage — des tranches pensées en euros
// n'auraient de sens ni pour l'utilisateur ni pour le filtre côté serveur).
const AMOUNT_RANGES: { label: string; min?: number; max?: number }[] = [
    { label: "Tous les montants" },
    { label: `< 25 000 ${DEFAULT_CURRENCY}`, max: 25_000 },
    { label: `25 000 – 100 000 ${DEFAULT_CURRENCY}`, min: 25_000, max: 100_000 },
    { label: `> 100 000 ${DEFAULT_CURRENCY}`, min: 100_000 },
];

export default function AvantagesPage() {
    const [stats, setStats]       = useState<ApprovalStat | null>(null);
    const [requests, setRequests] = useState<BenefitReq[]>([]);
    const [total, setTotal]       = useState(0);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [loading, setLoading]   = useState(true);
    const [selected, setSelected] = useState<string[]>([]);
    const [page, setPage]         = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectNote, setRejectNote] = useState("");

    // Filtres
    const [categoryId, setCategoryId]   = useState("");
    const [amountRange, setAmountRange] = useState("0");
    const [urgency, setUrgency]         = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const range = AMOUNT_RANGES[Number(amountRange)] ?? AMOUNT_RANGES[0];
        const [statsRes, reqRes] = await Promise.all([
            cseService.getApprovalStats(),
            cseService.getRequests({
            status: "PENDING", page, limit: 10,
            categoryId: categoryId || undefined,
            urgency: urgency || undefined,
            minAmount: range.min,
            maxAmount: range.max,
            }),
        ]);
        setStats(statsRes);
        setRequests(reqRes.data);
        setTotal(reqRes.total);
        setTotalPages(reqRes.totalPages);
        } catch { toast.error("Erreur chargement"); }
        finally { setLoading(false); }
    }, [page, categoryId, amountRange, urgency]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [categoryId, amountRange, urgency]);

    useEffect(() => {
        cseService.getCategories()
        .then((data: CategoryOption[]) => setCategories(data.filter((c) => c.isActive)))
        .catch(() => toast.error("Erreur chargement des catégories"));
    }, []);

    const handleExport = () => {
        if (!requests.length) { toast.error("Aucune demande à exporter"); return; }
        const rows = ["Employé;Email;Catégorie;Montant;Urgence;Soumis le"];
        requests.forEach((r) => {
        rows.push([
            `${r.employee.user.firstName} ${r.employee.user.lastName}`,
            r.employee.user.email,
            r.category.name,
            r.amount.toString(),
            r.urgency,
            new Date(r.createdAt).toLocaleDateString("fr-FR"),
        ].join(";"));
        });
        const csv = "﻿" + rows.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "demandes-avantages.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleApprove = async (id: string) => {
        try {
        await cseService.approveRequest(id);
        toast.success("Demande approuvée");
        load();
        } catch { toast.error("Erreur"); }
    };

    const handleReject = async () => {
        if (!rejectId || !rejectNote.trim()) return;
        try {
        await cseService.rejectRequest(rejectId, rejectNote);
        toast.success("Demande rejetée");
        setRejectId(null);
        setRejectNote("");
        load();
        } catch { toast.error("Erreur"); }
    };

    const handleBulkApprove = async () => {
        if (!selected.length) return;
        try {
        await cseService.bulkApprove(selected);
        toast.success(`${selected.length} demandes approuvées`);
        setSelected([]);
        load();
        } catch { toast.error("Erreur"); }
    };

    const toggleSelect = (id: string) => {
        setSelected((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        setSelected(selected.length === requests.length ? [] : requests.map((r) => r.id));
    };

    return (
        <div className="space-y-5">
        <div>
            <h1 className="text-xl font-bold text-gray-900">Tableau de bord d&#39;approbation</h1>
            <p className="text-sm text-gray-500">Gérez les demandes et approbations en attente</p>
        </div>

        {/* Stats */}
        {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
                { label: "Approbations en attente", value: stats.pending, color: "#f59e0b", icon: "⏳" },
                { label: "Approuvé aujourd'hui",    value: stats.approvedToday, color: "#10b981", icon: "✅" },
                { label: "Montant total",            value: formatCurrency(stats.totalAmount), color: "#3b82f6", icon: "💰" },
                { label: "Temps de réponse moyen",  value: `${stats.avgResponseHours}h`, color: "#8b5cf6", icon: "⏱" },
            ].map((s) => (
                <div key={s.label}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                </div>
                </div>
            ))}
            </div>
        )}

        {/* Filtres + bulk */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-600">
            <option value="">Toutes les catégories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={amountRange} onChange={(e) => setAmountRange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-600">
            {AMOUNT_RANGES.map((r, i) => <option key={r.label} value={i}>{r.label}</option>)}
            </select>
            <select value={urgency} onChange={(e) => setUrgency(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-600">
            <option value="">Toutes urgences</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            </select>
            <div className="ml-auto flex gap-2">
            <button
                onClick={handleBulkApprove}
                disabled={!selected.length}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40"
                style={{ background: "#10b981" }}
            >
                <Check size={14} /> Bulk Approve {selected.length > 0 && `(${selected.length})`}
            </button>
            <button onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                <Download size={14} /> Export
            </button>
            </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Approbations en attente</h3>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 w-8">
                    <input type="checkbox"
                        checked={selected.length === requests.length && requests.length > 0}
                        onChange={toggleAll}
                        className="w-4 h-4"
                        style={{ accentColor: "#0f766e" }}
                    />
                    </th>
                    {["Employee", "Request Type", "Amount", "Urgency", "Submitted", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-3 py-3">{h}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {loading ? (
                    [...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b">
                        <td colSpan={7} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                    </tr>
                    ))
                ) : requests.length === 0 ? (
                    <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                        Aucune demande en attente
                    </td>
                    </tr>
                ) : (
                    requests.map((req) => (
                    <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3">
                        <input type="checkbox"
                            checked={selected.includes(req.id)}
                            onChange={() => toggleSelect(req.id)}
                            className="w-4 h-4"
                            style={{ accentColor: "#0f766e" }}
                        />
                        </td>
                        <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                            {req.employee.user.firstName[0]}{req.employee.user.lastName[0]}
                            </div>
                            <div>
                            <p className="text-sm font-medium text-gray-900">
                                {req.employee.user.firstName} {req.employee.user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{req.employee.user.email}</p>
                            </div>
                        </div>
                        </td>
                        <td className="px-3 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span>{TYPE_ICON[req.category.name] ?? "🎁"}</span>
                            {req.category.name}
                        </div>
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-gray-900">
                        {formatCurrency(req.amount)}
                        </td>
                        <td className="px-3 py-3">
                        <span className="text-xs font-medium"
                            style={{ color: URGENCY_COLOR[req.urgency] }}>
                            {req.urgency.charAt(0) + req.urgency.slice(1).toLowerCase()}
                        </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-3 py-3">
                        <div className="flex gap-2">
                            <button
                            onClick={() => handleApprove(req.id)}
                            className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
                            style={{ background: "#10b981" }}
                            >
                            Approve
                            </button>
                            <button
                            onClick={() => setRejectId(req.id)}
                            className="text-xs px-3 py-1.5 rounded-lg text-white font-medium bg-red-500"
                            >
                            Reject
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
                Affichage de {requests.length} sur {total} demande{total > 1 ? "s" : ""}
            </p>
            <div className="flex gap-1 items-center">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 text-gray-500">
                <ChevronLeft size={16} />
                </button>
                {[...Array(Math.min(totalPages, 3))].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                    className="w-7 h-7 rounded text-xs"
                    style={page === i + 1
                    ? { background: "#0f766e", color: "white" }
                    : { color: "#6b7280" }}>
                    {i + 1}
                </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 text-gray-500">
                <ChevronRight size={16} />
                </button>
            </div>
            </div>
        </div>

        {/* Modal rejet */}
        {rejectId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Rejeter la demande</h3>
                <button onClick={() => { setRejectId(null); setRejectNote(""); }}
                    className="text-gray-400"><X size={18} /></button>
                </div>
                <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
                placeholder="Raison du rejet..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-none"
                />
                <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => { setRejectId(null); setRejectNote(""); }}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                    Annuler
                </button>
                <button
                    onClick={handleReject}
                    disabled={rejectNote.trim().length < 5}
                    className="px-4 py-2 rounded-lg text-white text-sm bg-red-500 disabled:opacity-50">
                    Confirmer
                </button>
                </div>
            </div>
            </div>
        )}
        </div>
    );
}