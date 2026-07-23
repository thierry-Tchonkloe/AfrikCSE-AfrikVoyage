"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ShoppingBag, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { adminOrdersService, AdminOrderRow, AdminOrdersFilters } from "@/services/admin/orders.service";
import { OrderStatus, OrderPaymentStatus } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const STATUS_LABELS: Record<OrderStatus, string> = {
    PENDING:   "En attente",
    CONFIRMED: "Confirmée",
    COMPLETED: "Complétée",
    CANCELLED: "Annulée",
    REFUNDED:  "Remboursée",
};

const PAYMENT_LABELS: Record<OrderPaymentStatus, string> = {
    UNPAID:             "Non payée",
    PAID:               "Payée",
    REFUNDED:           "Remboursée",
    PARTIALLY_REFUNDED: "Part. remb.",
    FAILED:             "Échouée",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
    PENDING:   "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    CONFIRMED: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    COMPLETED: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-700",
    REFUNDED:  "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const PAYMENT_COLORS: Record<OrderPaymentStatus, string> = {
    UNPAID:             "bg-amber-50 text-amber-600",
    PAID:               "bg-green-50 text-green-700",
    REFUNDED:           "bg-purple-50 text-purple-700",
    PARTIALLY_REFUNDED: "bg-purple-50 text-purple-500",
    FAILED:             "bg-red-50 text-red-600",
};

const LIMIT = 50;

export default function AdminOrdersPage() {
    const [orders, setOrders]   = useState<AdminOrderRow[]>([]);
    const [total, setTotal]     = useState(0);
    const [page, setPage]       = useState(1);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<AdminOrdersFilters>({});
    const [showFilters, setShowFilters] = useState(false);

    const load = useCallback(async (f: AdminOrdersFilters, p: number) => {
        setLoading(true);
        try {
            const res = await adminOrdersService.list({ ...f, page: p, limit: LIMIT });
            setOrders(res.orders);
            setTotal(res.total);
            setPage(p);
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur de chargement"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(filters, 1); }, [filters, load]);

    const fmt = (v: string) =>
        new Intl.NumberFormat("fr-FR").format(parseFloat(v));

    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Commandes marketplace</h1>
                    <p className="text-xs text-gray-500 mt-0.5">{total} commande{total !== 1 ? "s" : ""} au total</p>
                </div>
                <button onClick={() => setShowFilters((v) => !v)}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <Filter size={15} />
                    Filtres
                </button>
            </div>

            {/* Filtres */}
            {showFilters && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Statut commande</label>
                        <select value={filters.status ?? ""} onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value as OrderStatus) || undefined }))}
                            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 outline-none">
                            <option value="">Tous</option>
                            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Statut paiement</label>
                        <select value={filters.paymentStatus ?? ""} onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: (e.target.value as OrderPaymentStatus) || undefined }))}
                            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 outline-none">
                            <option value="">Tous</option>
                            {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Du</label>
                        <input type="date" value={filters.from ?? ""}
                            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined }))}
                            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Au</label>
                        <input type="date" value={filters.to ?? ""}
                            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined }))}
                            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 outline-none" />
                    </div>
                    <div className="col-span-2 sm:col-span-4 flex justify-end">
                        <button onClick={() => setFilters({})}
                            className="text-xs text-blue-600 hover:underline">
                            Réinitialiser les filtres
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Aucune commande</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 uppercase tracking-wide">
                                <tr>
                                    <th className="px-5 py-3 text-left font-medium">Date</th>
                                    <th className="px-5 py-3 text-left font-medium">Employé</th>
                                    <th className="px-5 py-3 text-left font-medium">Organisation</th>
                                    <th className="px-5 py-3 text-left font-medium">Méthode</th>
                                    <th className="px-5 py-3 text-right font-medium tabular-nums">Montant</th>
                                    <th className="px-5 py-3 text-center font-medium">Paiement</th>
                                    <th className="px-5 py-3 text-center font-medium">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition">
                                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap tabular-nums">
                                            {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                                                day: "2-digit", month: "short", year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {order.user ? (
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {order.user.firstName} {order.user.lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{order.user.email}</p>
                                                </div>
                                            ) : <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">
                                            {order.organization?.name ?? <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs font-mono text-gray-500">
                                                {order.paymentMethod ?? "—"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-gray-900 dark:text-white whitespace-nowrap">
                                            {fmt(order.finalAmount)} <span className="text-xs font-normal text-gray-400">{order.currencyCode}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_COLORS[order.paymentStatus]}`}>
                                                {PAYMENT_LABELS[order.paymentStatus]}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                                                {STATUS_LABELS[order.status]}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <p>Page {page} / {totalPages} · {total} résultats</p>
                    <div className="flex gap-2">
                        <button onClick={() => load(filters, page - 1)} disabled={page <= 1}
                            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            <ChevronLeft size={14} /> Préc.
                        </button>
                        <button onClick={() => load(filters, page + 1)} disabled={page >= totalPages}
                            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            Suiv. <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
