"use client";

import { useEffect, useState } from "react";
import { PiggyBank, Wallet, TrendingUp, ShoppingBag, Plane } from "lucide-react";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";

interface MonthlySummary {
    month: string; // "2025-03"
    saved: number;
    orders: number;
    bookings: number;
}

interface SavingsData {
    totalSaved:      number;
    totalSubsidy:    number;
    totalDiscount:   number;
    cashbackEarned:  number;
    walletBalance:   number;
    totalOrders:     number;
    totalBookings:   number;
    monthlySummary:  MonthlySummary[];
}

function fmt(n: number) {
    return n.toLocaleString("fr-FR") + " XOF";
}

function Bar({ value, max }: { value: number; max: number }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
            <div
                className="h-2 rounded-full"
                style={{ width: `${pct}%`, background: "#0f766e" }}
            />
        </div>
    );
}

export default function EconomiesPage() {
    const [data, setData]     = useState<SavingsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await employeeService.getMySavings();
                setData(res);
            } catch {
                toast.error("Erreur chargement des économies");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const maxSaved = data?.monthlySummary?.length
        ? Math.max(...data.monthlySummary.map((m) => m.saved))
        : 1;

    const kpis = data
        ? [
            { label: "Total économisé",    value: fmt(data.totalSaved),     icon: PiggyBank, color: "#0f766e" },
            { label: "Subventions reçues", value: fmt(data.totalSubsidy),   icon: TrendingUp, color: "#8b5cf6" },
            { label: "Cashback gagné",     value: fmt(data.cashbackEarned), icon: Wallet, color: "#f59e0b" },
            { label: "Solde wallet",       value: fmt(data.walletBalance),  icon: Wallet, color: "#3b82f6" },
            { label: "Commandes",          value: String(data.totalOrders),  icon: ShoppingBag, color: "#10b981" },
            { label: "Réservations",       value: String(data.totalBookings), icon: Plane, color: "#ef4444" },
        ]
        : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Mes économies</h1>
                <p className="text-sm text-gray-500">Récapitulatif de vos avantages financiers</p>
            </div>

            {/* KPI tiles */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-24 animate-pulse bg-gray-100" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {kpis.map((k) => (
                        <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: `${k.color}18` }}>
                                <k.icon size={20} style={{ color: k.color }} />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900 leading-tight">{k.value}</p>
                                <p className="text-xs text-gray-500">{k.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Graphique mensuel */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-4">Économies mensuelles</h2>
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                        ))}
                    </div>
                ) : !data?.monthlySummary?.length ? (
                    <p className="text-sm text-gray-400 text-center py-8">Aucune donnée mensuelle disponible</p>
                ) : (
                    <div className="space-y-4">
                        {[...data.monthlySummary].reverse().map((m) => {
                            const [year, month] = m.month.split("-");
                            const label = new Date(Number(year), Number(month) - 1).toLocaleDateString("fr-FR", {
                                month: "long", year: "numeric",
                            });
                            return (
                                <div key={m.month}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 capitalize">{label}</span>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>{m.orders} cmd</span>
                                            <span>{m.bookings} rés.</span>
                                            <span className="font-semibold text-gray-900">{fmt(m.saved)}</span>
                                        </div>
                                    </div>
                                    <Bar value={m.saved} max={maxSaved} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Détail breakdown */}
            {data && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="font-semibold text-gray-900 mb-4">Détail des économies</h2>
                    <div className="space-y-3">
                        {[
                            { label: "Remises sur commandes", value: data.totalDiscount },
                            { label: "Subventions employeur",  value: data.totalSubsidy },
                            { label: "Cashback wallet",         value: data.cashbackEarned },
                        ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <span className="text-sm text-gray-600">{row.label}</span>
                                <span className="text-sm font-semibold text-gray-900">{fmt(row.value)}</span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-bold text-gray-900">Total</span>
                            <span className="text-sm font-bold" style={{ color: "#0f766e" }}>
                                {fmt(data.totalSaved)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
