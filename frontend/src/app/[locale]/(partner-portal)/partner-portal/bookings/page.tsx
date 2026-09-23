"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { CalendarCheck, Loader2, Clock, CheckCircle2, XCircle, Flag } from "lucide-react";
import { partnerPortalService } from "@/services/partner/partner-portal.service";
import { Booking, BookingStatus } from "@/types";
import { useBookingLabel } from "@/hooks/useBookingLabel";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";

type Translator = ReturnType<typeof useTranslations<"partner.bookings">>;

// NO_SHOW retiré : ce statut existe dans l'enum Prisma mais n'est jamais
// positionné par aucun flux backend — son badge ne pouvait donc jamais
// s'afficher qu'à tort. `Partial<...>` + repli générique ci-dessous plutôt
// que de mentir avec une entrée pour un état qui n'arrive jamais en pratique.
const getStatusConfig = (t: Translator): Partial<Record<BookingStatus, { label: string; color: string; icon: React.ElementType }>> => ({
    PENDING:   { label: t("pending"),    color: "text-amber-600 bg-amber-50",  icon: Clock },
    CONFIRMED: { label: t("confirmed"),     color: "text-blue-600 bg-blue-50",    icon: CheckCircle2 },
    COMPLETED: { label: t("completed"),     color: "text-green-600 bg-green-50",  icon: CheckCircle2 },
    CANCELLED: { label: t("cancelled"),       color: "text-gray-500 bg-gray-50",    icon: XCircle },
    REJECTED:  { label: t("declined"),       color: "text-red-600 bg-red-50",      icon: XCircle },
});
const getFallbackStatusConfig = (t: Translator) => ({ label: t("unknownStatus"), color: "text-gray-500 bg-gray-50", icon: Flag });

type Filter = "ALL" | BookingStatus;

const getFilters = (t: Translator): { id: Filter; label: string }[] => ([
    { id: "ALL",       label: t("all") },
    { id: "PENDING",   label: t("pending") },
    { id: "CONFIRMED", label: t("confirmed2") },
    { id: "COMPLETED", label: t("completed2") },
    { id: "CANCELLED", label: t("cancelled2") },
]);

export default function PartnerBookingsPage() {
    const getBookingLabel = useBookingLabel();
    const dateLocale = useDateLocale();
    const t = useTranslations("partner.bookings");
    const STATUS_CONFIG = useMemo(() => getStatusConfig(t), [t]);
    const FALLBACK_STATUS_CONFIG = useMemo(() => getFallbackStatusConfig(t), [t]);
    const FILTERS = useMemo(() => getFilters(t), [t]);
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
            toast.error(getErrorMessage(err, t("loadingError")));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(filter, 1); }, [filter, load]);

    const handleConfirm = async (id: string) => {
        const notes = prompt(t("internalNoteOptional")) ?? undefined;
        try {
            await partnerPortalService.confirmBooking(id, notes);
            toast.success(t("bookingConfirmed"));
            load(filter, 1);
        } catch (err) {
            toast.error(getErrorMessage(err, t("error")));
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt(t("reasonRejection")) ?? undefined;
        try {
            await partnerPortalService.rejectBooking(id, reason);
            toast.success(t("bookingDeclined"));
            load(filter, 1);
        } catch (err) {
            toast.error(getErrorMessage(err, t("error")));
        }
    };

    const handleComplete = async (id: string) => {
        if (!confirm(t("markBookingAsCompleted"))) return;
        try {
            await partnerPortalService.completeBooking(id);
            toast.success(t("bookingCompleted"));
            load(filter, 1);
        } catch (err) {
            toast.error(getErrorMessage(err, t("error")));
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("bookings")}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{t("booking", { total, p2: total !== 1 ? "s" : "" })}</p>
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
                    <p className="text-sm">{t("noBookings")}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {bookings.map((b) => {
                        const sc = STATUS_CONFIG[b.status] ?? FALLBACK_STATUS_CONFIG;
                        const Icon = sc.icon;
                        return (
                            <div key={b.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                                {getBookingLabel(b)}
                                            </p>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                                                <Icon className="h-3 w-3" />{sc.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {t("pers", { numberOfPersons: b.numberOfPersons, p2: new Date(b.bookingDate).toLocaleDateString(dateLocale, {
                                                weekday: "long", day: "2-digit", month: "long",
                                                hour: "2-digit", minute: "2-digit",
                                            }) })}
                                        </p>
                                        {b.location && (
                                            <p className="text-xs text-gray-400 mt-0.5">{b.location.name} — {b.location.city}</p>
                                        )}
                                        {b.notes && (
                                            <p className="text-xs text-gray-500 mt-1 italic border-l-2 border-gray-200 pl-2">&ldquo;{b.notes}&rdquo;</p>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 shrink-0">
                                        {new Date(b.createdAt).toLocaleDateString(dateLocale)}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-3">
                                    {b.status === "PENDING" && (
                                        <>
                                            <button onClick={() => handleReject(b.id)}
                                                className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition">
                                                {t("decline")}
                                            </button>
                                            <button onClick={() => handleConfirm(b.id)}
                                                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                                                {t("confirm")}
                                            </button>
                                        </>
                                    )}
                                    {b.status === "CONFIRMED" && (
                                        <button onClick={() => handleComplete(b.id)}
                                            className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
                                            {t("markAsCompleted")}
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
                        {t("seeMoreRemaining", { p1: total - bookings.length })}
                    </button>
                </div>
            )}
        </div>
    );
}
