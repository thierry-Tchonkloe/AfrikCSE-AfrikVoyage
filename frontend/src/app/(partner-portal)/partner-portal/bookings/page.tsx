"use client";

import { useEffect, useState, useCallback } from "react";
import { CalendarCheck, Loader2, Clock, CheckCircle2, XCircle, Flag } from "lucide-react";
import { partnerPortalService } from "@/services/partner/partner-portal.service";
import { Booking, BookingStatus } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; icon: React.ElementType }> = {
    PENDING:   { label: "En attente",    color: "text-amber-600 bg-amber-50",  icon: Clock },
    CONFIRMED: { label: "Confirmée",     color: "text-blue-600 bg-blue-50",    icon: CheckCircle2 },
    COMPLETED: { label: "Complétée",     color: "text-green-600 bg-green-50",  icon: CheckCircle2 },
    CANCELLED: { label: "Annulée",       color: "text-gray-500 bg-gray-50",    icon: XCircle },
    REJECTED:  { label: "Refusée",       color: "text-red-600 bg-red-50",      icon: XCircle },
    NO_SHOW:   { label: "Non présenté",  color: "text-orange-600 bg-orange-50",icon: Flag },
};

type Filter = "ALL" | BookingStatus;

const FILTERS: { id: Filter; label: string }[] = [
    { id: "ALL",       label: "Toutes" },
    { id: "PENDING",   label: "En attente" },
    { id: "CONFIRMED", label: "Confirmées" },
    { id: "COMPLETED", label: "Complétées" },
    { id: "CANCELLED", label: "Annulées" },
];

export default function PartnerBookingsPage() {
    const [filter, setFilter]     = useState<Filter>("ALL");
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [total, setTotal]       = useState(0);
    const [page, setPage]         = useState(1);
    const [loading, setLoading]   = useState(true);

    const load = useCallback(async (f: Filter, p: number) => {
        setLoading(true);
        try {
            const status = f === "ALL" ? undefined : f;
            const res = await partnerPortalService.getPartnerBookings(status, p, 20);
            if (p === 1) setBookings(res.bookings); else setBookings((prev) => [...prev, ...res.bookings]);
            setTotal(res.total);
            setPage(p);
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur de chargement"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(filter, 1); }, [filter, load]);

    const handleConfirm = async (id: string) => {
        const notes = prompt("Note interne (optionnel) :") ?? undefined;
        try {
            await partnerPortalService.confirmBooking(id, notes);
            toast.success("Réservation confirmée");
            load(filter, 1);
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Raison du refus :") ?? undefined;
        try {
            await partnerPortalService.rejectBooking(id, reason);
            toast.success("Réservation refusée");
            load(filter, 1);
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        }
    };

    const handleComplete = async (id: string) => {
        if (!confirm("Marquer cette réservation comme complétée ?")) return;
        try {
            await partnerPortalService.completeBooking(id);
            toast.success("Réservation complétée");
            load(filter, 1);
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Réservations</h1>
                <p className="text-sm text-gray-500 mt-0.5">{total} réservation{total !== 1 ? "s" : ""}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            filter === f.id
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading && bookings.length === 0 ? (
                <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : bookings.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucune réservation</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {bookings.map((b) => {
                        const sc = STATUS_CONFIG[b.status];
                        const Icon = sc.icon;
                        return (
                            <div key={b.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                                {b.offer?.title ?? "Réservation"}
                                            </p>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                                                <Icon className="h-3 w-3" />{sc.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {b.numberOfPersons} pers. ·{" "}
                                            {new Date(b.bookingDate).toLocaleDateString("fr-FR", {
                                                weekday: "long", day: "2-digit", month: "long",
                                                hour: "2-digit", minute: "2-digit",
                                            })}
                                        </p>
                                        {b.location && (
                                            <p className="text-xs text-gray-400 mt-0.5">{b.location.name} — {b.location.city}</p>
                                        )}
                                        {b.notes && (
                                            <p className="text-xs text-gray-500 mt-1 italic border-l-2 border-gray-200 pl-2">&ldquo;{b.notes}&rdquo;</p>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 shrink-0">
                                        {new Date(b.createdAt).toLocaleDateString("fr-FR")}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-3">
                                    {b.status === "PENDING" && (
                                        <>
                                            <button onClick={() => handleReject(b.id)}
                                                className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition">
                                                Refuser
                                            </button>
                                            <button onClick={() => handleConfirm(b.id)}
                                                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                                                Confirmer
                                            </button>
                                        </>
                                    )}
                                    {b.status === "CONFIRMED" && (
                                        <button onClick={() => handleComplete(b.id)}
                                            className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
                                            Marquer complétée
                                        </button>
                                    )}
                                    {b.rating && (
                                        <span className="text-xs text-amber-500 flex items-center gap-1 ml-auto">
                                            {Array.from({ length: b.rating.score }).map((_, i) => "★").join("")} {b.rating.score}/5
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && bookings.length < total && (
                <div className="text-center">
                    <button onClick={() => load(filter, page + 1)} className="text-sm text-blue-600 hover:underline">
                        Voir plus ({total - bookings.length} restantes)
                    </button>
                </div>
            )}
        </div>
    );
}
