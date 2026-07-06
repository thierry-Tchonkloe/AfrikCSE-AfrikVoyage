"use client";

import { useEffect, useState } from "react";
import { Loader2, Building2, Users, CalendarCheck, ShoppingCart, Handshake, Bell, TrendingUp, Award } from "lucide-react";
import { reportingService, PlatformKpis, TrendItem, TopPartner, CommissionSummary } from "@/services/admin/reporting.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

function KpiCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString("fr-FR")}</p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function SimpleBarChart({ data, valueKey, label }: { data: TrendItem[]; valueKey: "total" | "count" | "revenue"; label: string }) {
    const max = Math.max(...data.map((d) => (d[valueKey] ?? 0) as number), 1);
    return (
        <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <div className="flex items-end gap-1.5 h-28">
                {data.map((d) => {
                    const val = (d[valueKey] ?? 0) as number;
                    const pct = (val / max) * 100;
                    return (
                        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs text-gray-400">{val}</span>
                            <div className="w-full rounded-t" style={{ height: `${Math.max(pct, 2)}%`, background: "var(--color-primary, #2563eb)" }} />
                            <span className="text-xs text-gray-400 whitespace-nowrap">{d.month.slice(5)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function SAReportingPage() {
    const [kpis, setKpis]         = useState<PlatformKpis | null>(null);
    const [bookingTrend, setBT]   = useState<TrendItem[]>([]);
    const [orderTrend, setOT]     = useState<TrendItem[]>([]);
    const [topPartners, setTP]    = useState<TopPartner[]>([]);
    const [commission, setComm]   = useState<CommissionSummary | null>(null);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [k, bt, ot, tp, c] = await Promise.all([
                    reportingService.platformKpis(),
                    reportingService.bookingsTrend(6),
                    reportingService.ordersTrend(6),
                    reportingService.topPartners(),
                    reportingService.commissionSummary(),
                ]);
                setKpis(k); setBT(bt); setOT(ot); setTP(tp); setComm(c);
            } catch (err) {
                toast.error(getErrorMessage(err, "Erreur de chargement"));
            } finally { setLoading(false); }
        };
        load();
    }, []);

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-gray-400" /></div>;
    if (!kpis) return null;

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reporting & Analytics</h1>
                <p className="text-sm text-gray-500 mt-0.5">Vue plateforme globale</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <KpiCard label="Organisations actives" value={kpis.organizations.active} sub={`${kpis.organizations.total} total`} icon={Building2} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30" />
                <KpiCard label="Utilisateurs actifs" value={kpis.users.active} sub={`${kpis.users.total} total`} icon={Users} color="bg-green-100 text-green-600 dark:bg-green-900/30" />
                <KpiCard label="Réservations" value={kpis.bookings.total} sub={`${kpis.bookings.completed} complétées`} icon={CalendarCheck} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30" />
                <KpiCard label="Revenus confirmés" value={`${Number(kpis.orders.totalRevenue).toLocaleString("fr-FR")} XOF`} sub={`${kpis.orders.total} commandes`} icon={ShoppingCart} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" />
                <KpiCard label="Partenaires actifs" value={kpis.partners.active} sub={`${kpis.partners.total} total`} icon={Handshake} color="bg-orange-100 text-orange-600 dark:bg-orange-900/30" />
                <KpiCard label="Notifications envoyées" value={kpis.notifications.sent} icon={Bell} color="bg-pink-100 text-pink-600 dark:bg-pink-900/30" />
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />Tendance réservations (6 mois)
                    </h2>
                    {bookingTrend.length > 0 ? <SimpleBarChart data={bookingTrend} valueKey="total" label="Réservations / mois" /> : <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>}
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-green-500" />Tendance commandes (6 mois)
                    </h2>
                    {orderTrend.length > 0 ? <SimpleBarChart data={orderTrend} valueKey="count" label="Commandes / mois" /> : <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>}
                </div>
            </div>

            {/* Commissions */}
            {commission && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-4">Résumé commissions</h2>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Net en attente</p>
                            <p className="text-xl font-bold text-amber-600">{Number(commission.pendingNet).toLocaleString("fr-FR")} XOF</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Net confirmé</p>
                            <p className="text-xl font-bold text-green-600">{Number(commission.confirmedNet).toLocaleString("fr-FR")} XOF</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Total prélevé</p>
                            <p className="text-xl font-bold text-blue-600">{Number(commission.totalCommissions).toLocaleString("fr-FR")} XOF</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Partners */}
            {topPartners.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-500" />
                        <h2 className="font-semibold text-sm text-gray-900 dark:text-white">Top partenaires</h2>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">#</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Partenaire</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Catégorie</th>
                                <th className="text-right px-5 py-3 font-medium text-gray-500">Réservations</th>
                                <th className="text-right px-5 py-3 font-medium text-gray-500">Entrées commission</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {topPartners.map((p, i) => (
                                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-5 py-3 text-gray-400 font-medium">#{i + 1}</td>
                                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                                    <td className="px-5 py-3 text-gray-500">{p.category ?? "—"}</td>
                                    <td className="px-5 py-3 text-right font-semibold">{p._count.bookings}</td>
                                    <td className="px-5 py-3 text-right text-gray-500">{p._count.commissionEntries}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
