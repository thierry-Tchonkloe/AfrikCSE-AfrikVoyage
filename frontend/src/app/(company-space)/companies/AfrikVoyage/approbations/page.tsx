"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, ChevronLeft, ChevronRight, Clock, CheckCircle2, Euro, Timer, Download } from "lucide-react";
import { voyageService } from "@/services/companies/voyage.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

// ── Types ──────────────────────────────────────────────

interface ApprovalStats {
    pending: number;
    approvedToday: number;
    totalAmount: number;
    avgResponseHours: number;
}

interface Traveler {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department: string | null;
    jobTitle: string | null;
}

interface PendingTravel {
    id: string;
    destination: string;
    purpose: string | null;
    departureDate: string;
    returnDate: string;
    estimatedCost: number | null;
    department: string | null;
    urgency: string;
    createdAt: string;
    requestedBy: Traveler;
}

// ── Configs ────────────────────────────────────────────

const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
    HIGH:   { label: "Élevée",  color: "#ef4444" },
    MEDIUM: { label: "Moyenne", color: "#f59e0b" },
    LOW:    { label: "Faible",  color: "#10b981" },
};

const DEPARTMENTS = [
    "Direction", "Ressources Humaines", "Finance & Comptabilité",
    "Commercial", "Marketing", "Technologie", "Opérations", "Autre",
];

const AMOUNT_RANGES: { label: string; min?: number; max?: number }[] = [
    { label: "Tous les montants" },
    { label: "< 1 000 €", max: 1000 },
    { label: "1 000 € – 5 000 €", min: 1000, max: 5000 },
    { label: "> 5 000 €", min: 5000 },
];

// ── Page ───────────────────────────────────────────────

export default function ApprobationsPage() {
    const [stats, setStats]       = useState<ApprovalStats | null>(null);
    const [requests, setRequests] = useState<PendingTravel[]>([]);
    const [loading, setLoading]   = useState(true);
    const [selected, setSelected] = useState<string[]>([]);
    const [processing, setProcessing] = useState(false);

    // Filtres
    const [department, setDepartment]   = useState("");
    const [amountRange, setAmountRange] = useState("0");
    const [urgency, setUrgency]         = useState("");

    // Pagination
    const [page, setPage]             = useState(1);
    const [total, setTotal]           = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Modal
    const [rejectItem, setRejectItem] = useState<PendingTravel | null>(null);

    const LIMIT = 10;

    // Revient à la page 1 quand les filtres changent
    useEffect(() => { setPage(1); }, [department, amountRange, urgency]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const range = AMOUNT_RANGES[Number(amountRange)] ?? AMOUNT_RANGES[0];
        const [statsRes, reqRes] = await Promise.all([
            voyageService.getApprovalStats(),
            voyageService.getTravels({
            status: "PENDING", page, limit: LIMIT,
            department: department || undefined,
            urgency: urgency || undefined,
            minAmount: range.min,
            maxAmount: range.max,
            }),
        ]);
        setStats(statsRes);
        setRequests(reqRes.data);
        setTotal(reqRes.total);
        setTotalPages(reqRes.totalPages);
        } catch {
        toast.error("Erreur chargement");
        } finally {
        setLoading(false);
        }
    }, [page, department, amountRange, urgency]);

    useEffect(() => { load(); }, [load]);

    // ── Actions ──────────────────────────────────────────

    const toggleSelect = (id: string) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const toggleAll = () => {
        setSelected(selected.length === requests.length ? [] : requests.map((r) => r.id));
    };

    const handleApprove = async (id: string) => {
        setProcessing(true);
        try {
        await voyageService.approveTravel(id);
        toast.success("Demande approuvée");
        setSelected((prev) => prev.filter((i) => i !== id));
        load();
        } catch (err) {
        toast.error(getErrorMessage(err, "Erreur"));
        } finally {
        setProcessing(false);
        }
    };

    const handleBulkApprove = async () => {
        if (!selected.length) return;
        setProcessing(true);
        try {
        await voyageService.bulkApproveTravels(selected);
        toast.success(`${selected.length} demande${selected.length > 1 ? "s" : ""} approuvée${selected.length > 1 ? "s" : ""}`);
        setSelected([]);
        load();
        } catch (err) {
        toast.error(getErrorMessage(err, "Erreur"));
        } finally {
        setProcessing(false);
        }
    };

    const handleReject = async (item: PendingTravel, note: string) => {
        setProcessing(true);
        try {
        await voyageService.rejectTravel(item.id, note);
        toast.success("Demande rejetée");
        setSelected((prev) => prev.filter((i) => i !== item.id));
        setRejectItem(null);
        load();
        } catch (err) {
        toast.error(getErrorMessage(err, "Erreur"));
        } finally {
        setProcessing(false);
        }
    };

    const handleExport = () => {
        if (!requests.length) {
        toast.error("Aucune demande à exporter");
        return;
        }
        const rows: string[] = [];
        rows.push("Voyageur;Email;Département;Destination;Montant estimé;Urgence;Soumis le");
        requests.forEach((r) => {
        rows.push([
            `${r.requestedBy.firstName} ${r.requestedBy.lastName}`,
            r.requestedBy.email,
            r.department ?? r.requestedBy.department ?? "—",
            r.destination,
            r.estimatedCost != null ? r.estimatedCost.toString() : "",
            URGENCY_CONFIG[r.urgency]?.label ?? r.urgency,
            new Date(r.createdAt).toLocaleDateString("fr-FR"),
        ].join(";"));
        });
        const csv = "﻿" + rows.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "approbations-voyages.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-5">
        {/* En-tête */}
        <div>
            <h1 className="text-xl font-bold text-gray-900">Tableau de bord d&#39;approbation</h1>
            <p className="text-sm text-gray-500">
            {total} demande{total > 1 ? "s" : ""} de voyage en attente d&#39;approbation
            </p>
        </div>

        {/* Stats */}
        {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
                { label: "Approbations en attente", value: stats.pending.toString(),
                icon: Clock, iconBg: "#fffbeb", iconColor: "#f59e0b" },
                { label: "Approuvé aujourd'hui", value: stats.approvedToday.toString(),
                icon: CheckCircle2, iconBg: "#f0fdf4", iconColor: "#10b981" },
                { label: "Montant total approuvé", value: `€${stats.totalAmount.toLocaleString()}`,
                icon: Euro, iconBg: "#eff6ff", iconColor: "#3b82f6" },
                { label: "Temps de réponse moyen", value: `${stats.avgResponseHours}h`,
                icon: Timer, iconBg: "#f5f3ff", iconColor: "#8b5cf6" },
            ].map((s) => (
                <div key={s.label}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: s.iconBg }}>
                    <s.icon size={20} style={{ color: s.iconColor }} />
                </div>
                <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
                </div>
                </div>
            ))}
            </div>
        )}

        {/* Filtres + bulk */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
            <select value={department} onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700">
            <option value="">Tous les départements</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={amountRange} onChange={(e) => setAmountRange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700">
            {AMOUNT_RANGES.map((r, i) => <option key={r.label} value={i}>{r.label}</option>)}
            </select>
            <select value={urgency} onChange={(e) => setUrgency(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700">
            <option value="">Toutes les urgences</option>
            {Object.entries(URGENCY_CONFIG).map(([key, c]) => <option key={key} value={key}>{c.label}</option>)}
            </select>
            <div className="ml-auto flex gap-2">
            <button
                onClick={handleBulkApprove}
                disabled={!selected.length || processing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40"
                style={{ background: "#10b981" }}
            >
                <Check size={14} /> Approuver la sélection {selected.length > 0 && `(${selected.length})`}
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
            <h3 className="font-semibold text-gray-900">Demandes en attente</h3>
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
                        style={{ accentColor: "var(--color-primary)" }}
                    />
                    </th>
                    {["Voyageur", "Destination", "Département", "Montant estimé", "Urgence", "Soumis le", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-3 py-3">{h}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {loading ? (
                    [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-b">
                        <td colSpan={8} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                    </tr>
                    ))
                ) : requests.length === 0 ? (
                    <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">
                        Aucune demande en attente
                    </td>
                    </tr>
                ) : (
                    requests.map((r) => {
                    const uc = URGENCY_CONFIG[r.urgency] ?? URGENCY_CONFIG.LOW;
                    const initials = `${r.requestedBy.firstName[0]}${r.requestedBy.lastName[0]}`.toUpperCase();
                    return (
                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3">
                            <input type="checkbox"
                            checked={selected.includes(r.id)}
                            onChange={() => toggleSelect(r.id)}
                            className="w-4 h-4"
                            style={{ accentColor: "var(--color-primary)" }}
                            />
                        </td>
                        <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold shrink-0">
                                {initials}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                {r.requestedBy.firstName} {r.requestedBy.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{r.requestedBy.email}</p>
                            </div>
                            </div>
                        </td>
                        <td className="px-3 py-3">
                            <p className="text-sm text-gray-900">{r.destination}</p>
                            {r.purpose && <p className="text-xs text-gray-400 truncate max-w-[180px]">{r.purpose}</p>}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">
                            {r.department ?? r.requestedBy.department ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-gray-900">
                            {r.estimatedCost != null ? `€${r.estimatedCost.toLocaleString()}` : "—"}
                        </td>
                        <td className="px-3 py-3">
                            <span className="text-xs font-medium" style={{ color: uc.color }}>
                            {uc.label}
                            </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-500">
                            {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-3 py-3">
                            <div className="flex gap-2">
                            <button onClick={() => handleApprove(r.id)} disabled={processing}
                                className="text-xs px-3 py-1.5 rounded-lg text-white font-medium disabled:opacity-50"
                                style={{ background: "#10b981" }}>
                                Approuver
                            </button>
                            <button onClick={() => setRejectItem(r)} disabled={processing}
                                className="text-xs px-3 py-1.5 rounded-lg text-white font-medium bg-red-500 disabled:opacity-50">
                                Rejeter
                            </button>
                            </div>
                        </td>
                        </tr>
                    );
                    })
                )}
                </tbody>
            </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Page {page} sur {totalPages}</p>
                <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50">
                    <ChevronLeft size={15} />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50">
                    <ChevronRight size={15} />
                </button>
                </div>
            </div>
            )}
        </div>

        {/* ── Modal Rejet ── */}
        {rejectItem && (
            <RejectModal
            item={rejectItem}
            processing={processing}
            onClose={() => setRejectItem(null)}
            onConfirm={(note) => handleReject(rejectItem, note)}
            />
        )}
        </div>
    );
}

// ── Modal Rejet ────────────────────────────────────────

function RejectModal({ item, processing, onClose, onConfirm }: {
    item: PendingTravel;
    processing: boolean;
    onClose: () => void;
    onConfirm: (note: string) => void;
}) {
    const [note, setNote] = useState("");

    return (
        <Modal title={`Rejeter — ${item.destination}`} onClose={onClose}>
        <p className="text-sm text-gray-500 mb-3">
            Indiquez le motif du rejet pour {item.requestedBy.firstName} {item.requestedBy.lastName}.
        </p>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder="Motif du rejet..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-none" />
        <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
            Annuler
            </button>
            <button disabled={processing || note.trim().length < 5} onClick={() => onConfirm(note.trim())}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50"
            style={{ background: "#ef4444" }}>
            {processing && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Rejeter
            </button>
        </div>
        </Modal>
    );
}

// ── Composant utilitaire ───────────────────────────────

function Modal({ title, children, onClose }: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">{title}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            {children}
        </div>
        </div>
    );
}
