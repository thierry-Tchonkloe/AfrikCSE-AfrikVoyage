"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Loader2, CheckCircle2, Clock, XCircle, Package, User, RefreshCw } from "lucide-react";
import { Order, Booking } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import api from "@/lib/api";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";

type Tab = "orders" | "bookings";

interface OrdersResult  { orders:   Order[];   total: number }
interface BookingsResult { bookings: Booking[]; total: number }

async function fetchOrders(search: string, page: number): Promise<OrdersResult> {
    // /orders (getMyOrders) ne renvoie que les commandes du compte appelant — il
    // faut la route admin dédiée pour voir les commandes de toute la plateforme.
    const { data } = await api.get("/orders/admin/all", {
        params: { search, page, limit: 30 },
        withCredentials: true,
    });
    return data;
}

async function fetchBookings(search: string, page: number): Promise<BookingsResult> {
    const { data } = await api.get("/bookings/admin/all", {
        params: { search, page, limit: 30 },
        withCredentials: true,
    });
    return data;
}

export default function ServiceClientPage() {
    const dateLocale = useDateLocale();
    const tr = useTranslations("admin.serviceClient");
    const [tab, setTab]           = useState<Tab>("orders");
    const [search, setSearch]     = useState("");
    const [orders, setOrders]     = useState<Order[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [total, setTotal]       = useState(0);
    const [page, setPage]         = useState(1);
    const [loading, setLoading]   = useState(true);

    const load = useCallback(async (t: Tab, s: string, p: number) => {
        setLoading(true);
        try {
            if (t === "orders") {
                const res = await fetchOrders(s, p);
                if (p === 1) setOrders(res.orders); else setOrders((prev) => [...prev, ...res.orders]);
                setTotal(res.total);
            } else {
                const res = await fetchBookings(s, p);
                if (p === 1) setBookings(res.bookings); else setBookings((prev) => [...prev, ...res.bookings]);
                setTotal(res.total);
            }
            setPage(p);
        } catch (err) {
            toast.error(getErrorMessage(err, tr("loadingError")));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(tab, search, 1); }, [tab, load]);

    useEffect(() => {
        const timer = setTimeout(() => load(tab, search, 1), 400);
        return () => clearTimeout(timer);
    }, [search, tab, load]);

    const handleRefund = async (orderId: string) => {
        if (!confirm(tr("triggerRefundOrder"))) return;
        try {
            await api.post(`/orders/${orderId}/refund`, {}, { withCredentials: true });
            toast.success(tr("refundTriggered"));
            load(tab, search, 1);
        } catch (err) {
            toast.error(getErrorMessage(err, tr("errorDuringRefund")));
        }
    };

    const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
        PENDING:   { label: tr("pending"),  color: "bg-amber-100 text-amber-700",  icon: Clock },
        CONFIRMED: { label: tr("confirmed"),   color: "bg-blue-100 text-blue-700",    icon: CheckCircle2 },
        COMPLETED: { label: tr("completed"),   color: "bg-green-100 text-green-700",  icon: CheckCircle2 },
        CANCELLED: { label: tr("cancelled"),     color: "bg-gray-100 text-gray-600",    icon: XCircle },
        REFUNDED:  { label: tr("refunded"),  color: "bg-purple-100 text-purple-700",icon: RefreshCw },
    };

    const BOOKING_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
        PENDING:   { label: tr("pending"),    color: "bg-amber-100 text-amber-700" },
        CONFIRMED: { label: tr("confirmed"),     color: "bg-blue-100 text-blue-700" },
        COMPLETED: { label: tr("completed"),     color: "bg-green-100 text-green-700" },
        CANCELLED: { label: tr("cancelled"),       color: "bg-gray-100 text-gray-600" },
        REJECTED:  { label: tr("declined"),       color: "bg-red-100 text-red-700" },
        NO_SHOW:   { label: tr("noShow"),  color: "bg-orange-100 text-orange-700" },
    };

    const TABS: { id: Tab; label: string }[] = [
        { id: "orders",   label: tr("orders") },
        { id: "bookings", label: tr("bookings") },
    ];

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tr("customerService")}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{tr("orderBookingTrackingResult", { total, p2: total !== 1 ? "s" : "" })}</p>
            </div>

            {/* Tabs + search */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                                tab === t.id
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={tr("searchEmailNameId")}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading && (tab === "orders" ? orders : bookings).length === 0 ? (
                    <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : tab === "orders" ? (
                    orders.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-sm">
                            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            {tr("noOrderFound")}
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">ID</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("user")}</th>
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("amount")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("payment")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("status")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("date")}</th>
                                    <th className="text-right px-5 py-3 font-medium text-gray-500">{tr("actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {orders.map((o) => {
                                    const sc = ORDER_STATUS_CONFIG[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-600", icon: Package };
                                    const StatusIcon = sc.icon;
                                    return (
                                        <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-5 py-3 font-mono text-xs text-gray-400">{o.id.slice(0, 8)}…</td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                        <User className="h-3 w-3 text-blue-600" />
                                                    </div>
                                                    <span className="text-gray-700 dark:text-gray-300">{o.userId.slice(0, 8)}…</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-right font-semibold tabular-nums">
                                                {parseFloat(o.finalAmount).toLocaleString(dateLocale)} {o.currencyCode}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : o.paymentStatus === "UNPAID" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                                                    {o.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${sc.color}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString(dateLocale)}</td>
                                            <td className="px-5 py-3 text-right">
                                                {o.status === "COMPLETED" && o.paymentStatus === "PAID" && (
                                                    o.paymentMethod === "WALLET" ? (
                                                        <button onClick={() => handleRefund(o.id)} className="text-xs text-red-600 hover:underline flex items-center gap-1 ml-auto">
                                                            <RefreshCw className="h-3 w-3" />{tr("refund")}
                                                        </button>
                                                    ) : (
                                                        <span title={tr("automaticRefundAvailableOnly")} className="text-xs text-gray-400 flex items-center gap-1 ml-auto cursor-default">
                                                            <RefreshCw className="h-3 w-3" />{tr("comingSoon")}
                                                        </span>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )
                ) : (
                    bookings.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-sm">{tr("noBookingFound")}</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">ID</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("user")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("partner")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("bookingDate")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("status")}</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-500">{tr("created")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {bookings.map((b) => {
                                    const sc = BOOKING_STATUS_CONFIG[b.status] ?? { label: b.status, color: "bg-gray-100 text-gray-600" };
                                    return (
                                        <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-5 py-3 font-mono text-xs text-gray-400">{b.id.slice(0, 8)}…</td>
                                            <td className="px-5 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">{b.userId.slice(0, 8)}…</td>
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{b.partner?.name ?? "—"}</td>
                                            <td className="px-5 py-3 text-gray-500 text-xs">{new Date(b.bookingDate).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>{sc.label}</span>
                                            </td>
                                            <td className="px-5 py-3 text-gray-400 text-xs">{new Date(b.createdAt).toLocaleDateString(dateLocale)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )
                )}
            </div>

            {!loading && (tab === "orders" ? orders.length < total : bookings.length < total) && (
                <div className="text-center">
                    <button
                        onClick={() => load(tab, search, page + 1)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        {tr("seeMore")}
                    </button>
                </div>
            )}
        </div>
    );
}
