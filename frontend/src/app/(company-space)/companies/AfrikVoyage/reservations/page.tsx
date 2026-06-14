"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Search, Eye, Check, X, ChevronLeft, ChevronRight, Plane, Clock,
    CheckCircle2, Euro, ExternalLink, Building2, CreditCard,
} from "lucide-react";
import { voyageService } from "@/services/companies/voyage.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

// ── Types ──────────────────────────────────────────────

type TravelStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "IN_PROGRESS" | "COMPLETED";
type PaymentStatusT = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

interface Traveler {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department: string | null;
    jobTitle: string | null;
}

interface Reservation {
    id: string;
    destination: string;
    purpose: string | null;
    departureDate: string;
    returnDate: string;
    estimatedCost: number | null;
    actualCost: number | null;
    department: string | null;
    status: TravelStatus;
    urgency: string;
    rejectionNote: string | null;
    partnerName: string | null;
    paymentStatus: PaymentStatusT;
    paymentLink: string | null;
    requestedBy: Traveler;
    createdAt: string;
}

interface TravelStats {
    total: number;
    pending: number;
    approved: number;
    totalCost: number;
    co2Emissions: number;
}

// ── Configs ────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING:     { label: "En attente", color: "#f59e0b" },
    APPROVED:    { label: "Approuvé",   color: "#3b82f6" },
    IN_PROGRESS: { label: "En cours",   color: "#8b5cf6" },
    COMPLETED:   { label: "Terminé",    color: "#10b981" },
    REJECTED:    { label: "Rejeté",     color: "#ef4444" },
    CANCELLED:   { label: "Annulé",     color: "#6b7280" },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING:  { label: "Non payé",  color: "#ef4444" },
    PAID:     { label: "Payé",      color: "#10b981" },
    FAILED:   { label: "Échoué",    color: "#ef4444" },
    REFUNDED: { label: "Remboursé", color: "#6b7280" },
};

const DEPARTMENTS = [
    "Direction", "Ressources Humaines", "Finance & Comptabilité",
    "Commercial", "Marketing", "Technologie", "Opérations", "Autre",
];

// ── Page ───────────────────────────────────────────────

export default function ReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [stats, setStats]     = useState<TravelStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Filtres
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch]           = useState("");
    const [status, setStatus]           = useState("");
    const [department, setDepartment]   = useState("");
    const [startDate, setStartDate]     = useState("");
    const [endDate, setEndDate]         = useState("");

    // Pagination
    const [page, setPage]             = useState(1);
    const [total, setTotal]           = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Modals
    const [detailItem, setDetailItem] = useState<Reservation | null>(null);
    const [rejectItem, setRejectItem] = useState<Reservation | null>(null);
    const [processing, setProcessing] = useState(false);

    const LIMIT = 10;

    // Débounce de la recherche
    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Revient à la page 1 quand les filtres changent
    useEffect(() => { setPage(1); }, [search, status, department, startDate, endDate]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const [listRes, statsRes] = await Promise.all([
            voyageService.getTravels({
            page, limit: LIMIT,
            search: search || undefined,
            status: status || undefined,
            department: department || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            }),
            voyageService.getTravelStats(),
        ]);
        setReservations(listRes.data);
        setTotal(listRes.total);
        setTotalPages(listRes.totalPages);
        setStats(statsRes);
        } catch {
        toast.error("Erreur chargement des réservations");
        } finally {
        setLoading(false);
        }
    }, [page, search, status, department, startDate, endDate]);

    useEffect(() => { load(); }, [load]);

    // ── Actions ──────────────────────────────────────────

    const refreshDetail = (updated: Reservation) => {
        setDetailItem((prev) => (prev ? { ...prev, ...updated } : prev));
        setReservations((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
    };

    const handleApprove = async (item: Reservation) => {
        setProcessing(true);
        try {
        await voyageService.approveTravel(item.id);
        toast.success("Réservation approuvée");
        setDetailItem(null);
        load();
        } catch (err) {
        toast.error(getErrorMessage(err, "Erreur"));
        } finally {
        setProcessing(false);
        }
    };

    const openReject = (item: Reservation) => {
        setDetailItem(null);
        setRejectItem(item);
    };

    const handleReject = async (item: Reservation, note: string) => {
        setProcessing(true);
        try {
        await voyageService.rejectTravel(item.id, note);
        toast.success("Réservation rejetée");
        setRejectItem(null);
        load();
        } catch (err) {
        toast.error(getErrorMessage(err, "Erreur"));
        } finally {
        setProcessing(false);
        }
    };

    const handleStatusChange = async (item: Reservation, newStatus: TravelStatus) => {
        setProcessing(true);
        try {
        const updated = await voyageService.updateTravelStatus(item.id, newStatus);
        toast.success("Statut mis à jour");
        refreshDetail({ ...item, ...updated });
        load();
        } catch (err) {
        toast.error(getErrorMessage(err, "Erreur"));
        } finally {
        setProcessing(false);
        }
    };

    const handleAssignPartner = async (item: Reservation, partnerName: string) => {
        setProcessing(true);
        try {
        const updated = await voyageService.assignPartner(item.id, partnerName);
        toast.success("Partenaire assigné");
        refreshDetail({ ...item, ...updated });
        load();
        } catch (err) {
        toast.error(getErrorMessage(err, "Erreur"));
        } finally {
        setProcessing(false);
        }
    };

    const handleUpdatePayment = async (item: Reservation, payload: { paymentStatus?: string; paymentLink?: string }) => {
        setProcessing(true);
        try {
        const updated = await voyageService.updatePayment(item.id, payload);
        toast.success("Paiement mis à jour");
        refreshDetail({ ...item, ...updated });
        load();
        } catch (err) {
        toast.error(getErrorMessage(err, "Erreur"));
        } finally {
        setProcessing(false);
        }
    };

    return (
        <div className="space-y-5">
        {/* En-tête */}
        <div>
            <h1 className="text-xl font-bold text-gray-900">Réservations de voyage</h1>
            <p className="text-sm text-gray-500">
            {total} réservation{total > 1 ? "s" : ""}
            </p>
        </div>

        {/* Stats */}
        {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
                { label: "Total réservations", value: stats.total.toString(),
                icon: Plane, iconBg: "#eff6ff", iconColor: "#3b82f6" },
                { label: "En attente", value: stats.pending.toString(),
                icon: Clock, iconBg: "#fffbeb", iconColor: "#f59e0b" },
                { label: "Approuvées", value: stats.approved.toString(),
                icon: CheckCircle2, iconBg: "#f0fdf4", iconColor: "#10b981" },
                { label: "Coût total", value: `€${stats.totalCost.toLocaleString()}`,
                icon: Euro, iconBg: "#fef2f2", iconColor: "#ef4444" },
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

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
            <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher un voyageur..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none"
            />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700">
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_CONFIG).map(([key, c]) => (
                <option key={key} value={key}>{c.label}</option>
            ))}
            </select>
            <select value={department} onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700">
            <option value="">Tous les départements</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <div className="flex items-center gap-2">
            <div>
                <label className="block text-xs text-gray-500 mb-1">Départ après</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
            </div>
            <div>
                <label className="block text-xs text-gray-500 mb-1">Départ avant</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
            </div>
            </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                    {["Voyageur", "Destination", "Dates", "Coût estimé", "Statut", "Paiement", "Partenaire", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
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
                ) : reservations.length === 0 ? (
                    <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">
                        Aucune réservation trouvée
                    </td>
                    </tr>
                ) : (
                    reservations.map((r) => {
                    const sc = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.PENDING;
                    const pc = PAYMENT_CONFIG[r.paymentStatus] ?? PAYMENT_CONFIG.PENDING;
                    const initials = `${r.requestedBy.firstName[0]}${r.requestedBy.lastName[0]}`.toUpperCase();
                    return (
                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold shrink-0">
                                {initials}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                {r.requestedBy.firstName} {r.requestedBy.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                {r.department ?? r.requestedBy.department ?? "—"}
                                </p>
                            </div>
                            </div>
                        </td>
                        <td className="px-5 py-3">
                            <p className="text-sm text-gray-900">{r.destination}</p>
                            {r.purpose && <p className="text-xs text-gray-400 truncate max-w-[180px]">{r.purpose}</p>}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                            {new Date(r.departureDate).toLocaleDateString("fr-FR")}
                            {" → "}
                            {new Date(r.returnDate).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                            {r.estimatedCost != null ? `€${r.estimatedCost.toLocaleString()}` : "—"}
                        </td>
                        <td className="px-5 py-3">
                            <span className="flex items-center gap-1.5 text-xs font-medium"
                            style={{ color: sc.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.color }} />
                            {sc.label}
                            </span>
                        </td>
                        <td className="px-5 py-3">
                            <span className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{ color: pc.color, background: pc.color + "18" }}>
                            {pc.label}
                            </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-600">
                            {r.partnerName ?? "—"}
                        </td>
                        <td className="px-5 py-3">
                            <div className="flex items-center gap-1">
                            {r.status === "PENDING" && (
                                <>
                                <ActionBtn icon={<Check size={14} />} title="Approuver"
                                    onClick={() => handleApprove(r)} />
                                <ActionBtn icon={<X size={14} />} title="Rejeter" danger
                                    onClick={() => openReject(r)} />
                                </>
                            )}
                            <ActionBtn icon={<Eye size={14} />} title="Voir détail"
                                onClick={() => setDetailItem(r)} />
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

        {/* ── Modal Détail ── */}
        {detailItem && (
            <DetailModal
            item={detailItem}
            processing={processing}
            onClose={() => setDetailItem(null)}
            onApprove={handleApprove}
            onReject={openReject}
            onStatusChange={handleStatusChange}
            onAssignPartner={handleAssignPartner}
            onUpdatePayment={handleUpdatePayment}
            />
        )}

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

// ── Modal Détail ───────────────────────────────────────

function DetailModal({
    item, processing, onClose, onApprove, onReject, onStatusChange, onAssignPartner, onUpdatePayment,
}: {
    item: Reservation;
    processing: boolean;
    onClose: () => void;
    onApprove: (item: Reservation) => void;
    onReject: (item: Reservation) => void;
    onStatusChange: (item: Reservation, status: TravelStatus) => void;
    onAssignPartner: (item: Reservation, partnerName: string) => void;
    onUpdatePayment: (item: Reservation, payload: { paymentStatus?: string; paymentLink?: string }) => void;
}) {
    const [partnerName, setPartnerName] = useState(item.partnerName ?? "");
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatusT>(item.paymentStatus);
    const [paymentLink, setPaymentLink] = useState(item.paymentLink ?? "");

    const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
    const pc = PAYMENT_CONFIG[item.paymentStatus] ?? PAYMENT_CONFIG.PENDING;

    const partnerChanged = partnerName !== (item.partnerName ?? "");
    const paymentChanged = paymentStatus !== item.paymentStatus || paymentLink !== (item.paymentLink ?? "");

    return (
        <Modal title={`Réservation — ${item.destination}`} onClose={onClose}>
        <div className="space-y-4">
            {/* Voyageur + statut */}
            <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-semibold text-gray-900">
                {item.requestedBy.firstName} {item.requestedBy.lastName}
                </p>
                <p className="text-xs text-gray-500">{item.requestedBy.email}</p>
                {(item.department ?? item.requestedBy.department) && (
                <p className="text-xs text-gray-400">{item.department ?? item.requestedBy.department}</p>
                )}
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full shrink-0"
                style={{ color: sc.color, background: sc.color + "18" }}>
                {sc.label}
            </span>
            </div>

            {/* Détails voyage */}
            <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
                <p className="text-xs text-gray-500">Destination</p>
                <p className="font-medium text-gray-900">{item.destination}</p>
            </div>
            <div>
                <p className="text-xs text-gray-500">Urgence</p>
                <p className="font-medium text-gray-900">{item.urgency}</p>
            </div>
            <div>
                <p className="text-xs text-gray-500">Départ</p>
                <p className="font-medium text-gray-900">{new Date(item.departureDate).toLocaleDateString("fr-FR")}</p>
            </div>
            <div>
                <p className="text-xs text-gray-500">Retour</p>
                <p className="font-medium text-gray-900">{new Date(item.returnDate).toLocaleDateString("fr-FR")}</p>
            </div>
            <div>
                <p className="text-xs text-gray-500">Coût estimé</p>
                <p className="font-medium text-gray-900">
                {item.estimatedCost != null ? `€${item.estimatedCost.toLocaleString()}` : "—"}
                </p>
            </div>
            <div>
                <p className="text-xs text-gray-500">Coût réel</p>
                <p className="font-medium text-gray-900">
                {item.actualCost != null ? `€${item.actualCost.toLocaleString()}` : "—"}
                </p>
            </div>
            {item.purpose && (
                <div className="col-span-2">
                <p className="text-xs text-gray-500">Motif</p>
                <p className="text-gray-700">{item.purpose}</p>
                </div>
            )}
            {item.status === "REJECTED" && item.rejectionNote && (
                <div className="col-span-2">
                <p className="text-xs text-gray-500">Motif de rejet</p>
                <p className="text-red-600">{item.rejectionNote}</p>
                </div>
            )}
            </div>

            {/* Avancement du statut */}
            <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Avancement</p>
            <div className="flex flex-wrap gap-2">
                {item.status === "PENDING" && (
                <>
                    <button disabled={processing} onClick={() => onApprove(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-50"
                    style={{ background: "#10b981" }}>
                    <Check size={13} /> Approuver
                    </button>
                    <button disabled={processing} onClick={() => onReject(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-50"
                    style={{ background: "#ef4444" }}>
                    <X size={13} /> Rejeter
                    </button>
                </>
                )}
                {item.status === "APPROVED" && (
                <button disabled={processing} onClick={() => onStatusChange(item, "IN_PROGRESS")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-50"
                    style={{ background: "#8b5cf6" }}>
                    <Plane size={13} /> Démarrer le voyage
                </button>
                )}
                {item.status === "IN_PROGRESS" && (
                <button disabled={processing} onClick={() => onStatusChange(item, "COMPLETED")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-50"
                    style={{ background: "#10b981" }}>
                    <CheckCircle2 size={13} /> Marquer comme terminé
                </button>
                )}
                {(item.status === "PENDING" || item.status === "APPROVED" || item.status === "IN_PROGRESS") && (
                <button disabled={processing} onClick={() => onStatusChange(item, "CANCELLED")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 disabled:opacity-50">
                    Annuler la réservation
                </button>
                )}
                {(item.status === "COMPLETED" || item.status === "REJECTED" || item.status === "CANCELLED") && (
                <p className="text-xs text-gray-400">Statut final — aucune action disponible.</p>
                )}
            </div>
            </div>

            {/* Partenaire */}
            <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                <Building2 size={13} /> Partenaire assigné
            </p>
            <div className="flex gap-2">
                <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Nom de l'agence / partenaire"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                <button disabled={processing || !partnerChanged}
                onClick={() => onAssignPartner(item, partnerName)}
                className="px-3 py-2 rounded-lg text-white text-xs font-medium disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}>
                Enregistrer
                </button>
            </div>
            </div>

            {/* Paiement */}
            <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                <CreditCard size={13} /> Paiement
            </p>
            <div className="flex flex-wrap gap-2 items-center mb-2">
                <span className="text-xs font-medium px-2 py-1 rounded-full"
                style={{ color: pc.color, background: pc.color + "18" }}>
                {pc.label}
                </span>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatusT)}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none bg-white">
                <option value="PENDING">Non payé</option>
                <option value="PAID">Payé</option>
                </select>
            </div>
            <div className="flex gap-2">
                <input value={paymentLink} onChange={(e) => setPaymentLink(e.target.value)}
                placeholder="Lien de paiement (https://...)"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                {item.paymentLink && (
                <a href={item.paymentLink} target="_blank" rel="noopener noreferrer"
                    title="Ouvrir le lien de paiement"
                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                    <ExternalLink size={15} />
                </a>
                )}
            </div>
            <div className="flex justify-end mt-2">
                <button disabled={processing || !paymentChanged}
                onClick={() => onUpdatePayment(item, { paymentStatus, paymentLink: paymentLink || undefined })}
                className="px-3 py-2 rounded-lg text-white text-xs font-medium disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}>
                Enregistrer
                </button>
            </div>
            </div>
        </div>
        </Modal>
    );
}

// ── Modal Rejet ────────────────────────────────────────

function RejectModal({ item, processing, onClose, onConfirm }: {
    item: Reservation;
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
            <button disabled={processing || !note.trim()} onClick={() => onConfirm(note.trim())}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50"
            style={{ background: "#ef4444" }}>
            {processing && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Rejeter
            </button>
        </div>
        </Modal>
    );
}

// ── Composants utilitaires ────────────────────────────

function ActionBtn({ icon, title, onClick, danger = false }: {
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button title={title} onClick={onClick}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            style={{ color: danger ? "#ef4444" : "#6b7280" }}>
            {icon}
        </button>
    );
}

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
