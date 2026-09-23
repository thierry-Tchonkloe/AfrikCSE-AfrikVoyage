"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, CalendarCheck, Wallet, TrendingUp, Percent } from "lucide-react";
import { reportingService, OrgKpis, TrendItem } from "@/services/admin/reporting.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";

function KpiCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function MiniBarChart({ data }: { data: TrendItem[] }) {
    const max = Math.max(...data.map((d) => d.total), 1);
    return (
        <div className="flex items-end gap-1.5 h-24">
            {data.map((d) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400">{d.total}</span>
                    <div className="w-full rounded-t bg-blue-500" style={{ height: `${Math.max((d.total / max) * 100, 2)}%` }} />
                    <span className="text-xs text-gray-400">{d.month.slice(5)}</span>
                </div>
            ))}
        </div>
    );
}

export default function CompanyRapportPage() {
    const dateLocale = useDateLocale();
    const tr = useTranslations("company.afrikcseRapport");
    const [kpis, setKpis]       = useState<OrgKpis | null>(null);
    const [trend, setTrend]     = useState<TrendItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [k, t] = await Promise.all([
                    reportingService.orgKpis(),
                    reportingService.orgBookingsTrend(6),
                ]);
                setKpis(k); setTrend(t);
            } catch (err) {
                toast.error(getErrorMessage(err, tr("loadingError")));
            } finally { setLoading(false); }
        };
        load();
    }, []);

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-gray-400" /></div>;
    if (!kpis) return null;

    const completionRate = kpis.bookings.total > 0
        ? Math.round((kpis.bookings.completed / kpis.bookings.total) * 100)
        : 0;

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tr("reportAnalytics")}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{tr("keyIndicatorsOrganization")}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <KpiCard label={tr("activeEmployees")} value={kpis.employees.active} sub={tr("total", { total: kpis.employees.total })} icon={Users} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30" />
                <KpiCard label={tr("bookings")} value={kpis.bookings.total} sub={tr("completed", { completed: kpis.bookings.completed })} icon={CalendarCheck} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30" />
                <KpiCard label={tr("allocatedWallet")} value={`${Number(kpis.wallet.totalAllocated).toLocaleString(dateLocale)} XOF`} icon={Wallet} color="bg-green-100 text-green-600 dark:bg-green-900/30" />
                <KpiCard label={tr("cashbackCredited")} value={`${Number(kpis.cashback.totalCredited).toLocaleString(dateLocale)} XOF`} icon={Percent} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30" />
            </div>

            {trend.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />{tr("bookingsOver6Months")}
                    </h2>
                    <MiniBarChart data={trend} />
                </div>
            )}

            {kpis.bookings.total > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">{tr("completionRate")}</h2>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${completionRate}%` }} />
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{completionRate} %</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        {tr("bookingCompletedOut", { completed: kpis.bookings.completed, p2: kpis.bookings.completed !== 1 ? "s" : "", total: kpis.bookings.total })}
                    </p>
                </div>
            )}
        </div>
    );
}
