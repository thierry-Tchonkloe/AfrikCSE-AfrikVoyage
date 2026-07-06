"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { partnerPortalService } from "@/services/partner/partner-portal.service";
import { Booking } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

export default function PartnerDashboardPage() {
    const { user } = useAuth();
    const [pending, setPending]     = useState<Booking[]>([]);
    const [confirmed, setConfirmed] = useState<Booking[]>([]);
    const [loading, setLoading]     = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            setLoading(true);
            try {
                const [p, c] = await Promise.all([
                    partnerPortalService.getPartnerBookings("PENDING", 1, 5),
                    partnerPortalService.getPartnerBookings("CONFIRMED", 1, 5),
                ]);
                setPending(p.bookings);
                setConfirmed(c.bookings);
            } catch (err) {
                toast.error(getErrorMessage(err, "Erreur de chargement"));
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    const handleConfirm = async (id: string) => {
        try {
            await partnerPortalService.confirmBooking(id);
            toast.success("Réservation confirmée");
            setPending((prev) => prev.filter((b) => b.id !== id));
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Raison du refus (optionnel) :") ?? undefined;
        try {
            await partnerPortalService.rejectBooking(id, reason);
            toast.success("Réservation refusée");
            setPending((prev) => prev.filter((b) => b.id !== id));
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bonjour, {user?.firstName} 👋</h1>
                <p className="text-sm text-gray-500 mt-0.5">{user?.partnerName ?? user?.organization?.name}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? "—" : pending.length}</p>
                            <p className="text-xs text-gray-500">En attente</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? "—" : confirmed.length}</p>
                            <p className="text-xs text-gray-500">Confirmées</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending bookings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <h2 className="font-semibold text-sm text-gray-900 dark:text-white">Réservations en attente</h2>
                </div>
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
                ) : pending.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        Aucune réservation en attente
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {pending.map((b) => (
                            <div key={b.id} className="px-5 py-4 flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                                        {b.offer?.title ?? "Réservation"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {b.numberOfPersons} pers. ·{" "}
                                        {new Date(b.bookingDate).toLocaleDateString("fr-FR", {
                                            weekday: "short", day: "2-digit", month: "short",
                                            hour: "2-digit", minute: "2-digit",
                                        })}
                                    </p>
                                    {b.notes && <p className="text-xs text-gray-400 mt-1 italic">&ldquo;{b.notes}&rdquo;</p>}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => handleReject(b.id)}
                                        className="px-3 py-1.5 text-xs border border-red-200 dark:border-red-800 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                                        Refuser
                                    </button>
                                    <button onClick={() => handleConfirm(b.id)}
                                        className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                                        Confirmer
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
