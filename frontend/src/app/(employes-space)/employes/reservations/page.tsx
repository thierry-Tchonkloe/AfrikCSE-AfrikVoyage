"use client";

import { useEffect, useState, useCallback } from "react";
import { CalendarCheck, Clock, CheckCircle2, XCircle, Star, X, Loader2 } from "lucide-react";
import { bookingService } from "@/services/employes/booking.service";
import { Booking, BookingStatus } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; icon: React.ElementType }> = {
    PENDING:   { label: "En attente",  color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",  icon: Clock },
    CONFIRMED: { label: "Confirmée",   color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",    icon: CheckCircle2 },
    COMPLETED: { label: "Terminée",    color: "text-green-600 bg-green-50 dark:bg-green-900/20", icon: CheckCircle2 },
    CANCELLED: { label: "Annulée",     color: "text-gray-500 bg-gray-50 dark:bg-gray-800",       icon: XCircle },
    REJECTED:  { label: "Refusée",     color: "text-red-600 bg-red-50 dark:bg-red-900/20",       icon: XCircle },
    NO_SHOW:   { label: "Non présenté",color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20", icon: XCircle },
};

export default function ReservationsPage() {
    const [bookings, setBookings]   = useState<Booking[]>([]);
    const [total, setTotal]         = useState(0);
    const [page, setPage]           = useState(1);
    const [loading, setLoading]     = useState(true);
    const [ratingModal, setRatingModal] = useState<Booking | null>(null);
    const [ratingScore, setRatingScore] = useState(5);
    const [ratingComment, setRatingComment] = useState("");
    const [saving, setSaving]       = useState(false);

    const load = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const result = await bookingService.getMyBookings(p, 20);
            if (p === 1) {
                setBookings(result.bookings);
            } else {
                setBookings((prev) => [...prev, ...result.bookings]);
            }
            setTotal(result.total);
            setPage(p);
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors du chargement"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(1); }, [load]);

    const handleCancel = async (id: string) => {
        if (!confirm("Annuler cette réservation ?")) return;
        try {
            await bookingService.cancel(id, "Annulé par l'utilisateur");
            toast.success("Réservation annulée");
            load(1);
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de l'annulation"));
        }
    };

    const handleRate = async () => {
        if (!ratingModal) return;
        setSaving(true);
        try {
            await bookingService.rate(ratingModal.id, ratingScore, ratingComment || undefined);
            toast.success("Note envoyée");
            setRatingModal(null);
            load(1);
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la notation"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes réservations</h1>
                <p className="text-sm text-gray-500 mt-0.5">{total} réservation{total !== 1 ? "s" : ""}</p>
            </div>

            {loading && bookings.length === 0 ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
            ) : bookings.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucune réservation pour le moment</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {bookings.map((b) => {
                        const sc = STATUS_CONFIG[b.status];
                        const Icon = sc.icon;
                        return (
                            <div key={b.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-4">
                                {b.offer?.imageUrl ? (
                                    <img src={b.offer.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                        <CalendarCheck className="h-7 w-7 text-gray-300" />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                                                {b.offer?.title ?? b.partner?.name ?? "Réservation"}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {b.partner?.name} · {b.numberOfPersons} pers. ·{" "}
                                                {new Date(b.bookingDate).toLocaleDateString("fr-FR", {
                                                    weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                                                })}
                                            </p>
                                            {b.location && (
                                                <p className="text-xs text-gray-400 mt-0.5">{b.location.name} — {b.location.city}</p>
                                            )}
                                            {b.partnerNotes && (
                                                <p className="text-xs text-blue-600 mt-1 italic">&ldquo;{b.partnerNotes}&rdquo;</p>
                                            )}
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${sc.color}`}>
                                            <Icon className="h-3 w-3" />
                                            {sc.label}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 mt-3">
                                        {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                                            <button
                                                onClick={() => handleCancel(b.id)}
                                                className="text-xs text-red-600 hover:text-red-700 border border-red-200 dark:border-red-800 px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                            >
                                                Annuler
                                            </button>
                                        )}
                                        {b.status === "COMPLETED" && !b.rating && (
                                            <button
                                                onClick={() => { setRatingModal(b); setRatingScore(5); setRatingComment(""); }}
                                                className="text-xs text-amber-600 hover:text-amber-700 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition flex items-center gap-1"
                                            >
                                                <Star className="h-3 w-3" />
                                                Noter
                                            </button>
                                        )}
                                        {b.rating && (
                                            <div className="flex items-center gap-1 text-amber-500 text-xs">
                                                {Array.from({ length: b.rating.score }).map((_, i) => (
                                                    <Star key={i} className="h-3 w-3 fill-current" />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && bookings.length < total && (
                <div className="text-center">
                    <button
                        onClick={() => load(page + 1)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Voir plus ({total - bookings.length} restantes)
                    </button>
                </div>
            )}

            {/* Rating modal */}
            {ratingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Notez votre expérience</h2>
                            <button onClick={() => setRatingModal(null)}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>
                        <p className="text-sm text-gray-500">{ratingModal.offer?.title ?? ratingModal.partner?.name}</p>

                        <div className="flex gap-2 justify-center">
                            {[1,2,3,4,5].map((s) => (
                                <button key={s} onClick={() => setRatingScore(s)}>
                                    <Star className={`h-8 w-8 transition ${s <= ratingScore ? "text-amber-400 fill-current" : "text-gray-300"}`} />
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                            rows={3}
                            placeholder="Commentaire optionnel..."
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setRatingModal(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                Annuler
                            </button>
                            <button onClick={handleRate} disabled={saving} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-5 py-2 text-sm font-medium rounded-lg transition">
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                Envoyer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
