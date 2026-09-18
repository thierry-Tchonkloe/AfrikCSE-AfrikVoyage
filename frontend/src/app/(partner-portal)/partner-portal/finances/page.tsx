"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, Banknote, PiggyBank, Wallet, ArrowDownToLine, Loader2, ShieldAlert, type LucideIcon } from "lucide-react";
import { partnerPortalService, FinanceEntry } from "@/services/partner/partner-portal.service";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/currency";

export default function PartnerFinancesPage() {
    const { user } = usePartnerAuth();
    const isAdmin = user?.role === "PARTNER_ADMIN";

    const [loading, setLoading]       = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [grossRevenue, setGrossRevenue]         = useState(0);
    const [totalCommissions, setTotalCommissions] = useState(0);
    const [netBalance, setNetBalance]             = useState(0);
    const [currencyCode, setCurrencyCode]         = useState("XOF");
    const [entries, setEntries]     = useState<FinanceEntry[]>([]);
    const [page, setPage]           = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const load = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const data = await partnerPortalService.getFinances(p, 20);
            setGrossRevenue(data.grossRevenue);
            setTotalCommissions(data.totalCommissions);
            setNetBalance(data.netBalance);
            setCurrencyCode(data.currencyCode);
            setEntries(data.history.entries);
            setPage(data.history.page);
            setTotalPages(data.history.totalPages);
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur de chargement des finances"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(1); }, [load]);

    const handleRequestPayout = async () => {
        setRequesting(true);
        try {
            const payout = await partnerPortalService.requestPayout();
            toast.success(`Demande de reversement envoyée — ${formatCurrency(payout.netAmount, currencyCode)}`);
            load(1);
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la demande de reversement"));
        } finally {
            setRequesting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Finances</h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Vos gains, les commissions prélevées par la plateforme et votre solde disponible
                    </p>
                </div>
                {isAdmin && (
                    <button onClick={handleRequestPayout} disabled={requesting || loading || netBalance <= 0}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition">
                        {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine size={15} />}
                        Demander un reversement
                    </button>
                )}
            </div>

            {/* KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard icon={TrendingUp} color="blue"  label="Gains bruts"
                    value={loading ? "—" : formatCurrency(grossRevenue, currencyCode)} />
                <KpiCard icon={Banknote}   color="amber" label="Commissions plateforme"
                    value={loading ? "—" : formatCurrency(totalCommissions, currencyCode)} />
                <KpiCard icon={PiggyBank}  color="green" label="Solde disponible à verser"
                    value={loading ? "—" : formatCurrency(netBalance, currencyCode)}
                    testId="net-balance" rawValue={netBalance} />
            </div>

            {!isAdmin && (
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
                    <ShieldAlert size={15} className="shrink-0" />
                    Seul l&apos;administrateur partenaire peut demander un reversement.
                </div>
            )}

            {/* Historique */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="font-semibold text-sm text-gray-900 dark:text-white">Historique des commissions</h2>
                </div>
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        Aucune transaction pour le moment
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-700">
                                        <th className="px-5 py-2.5 font-medium">Réservation</th>
                                        <th className="px-5 py-2.5 font-medium">Date</th>
                                        <th className="px-5 py-2.5 font-medium text-right">Montant brut</th>
                                        <th className="px-5 py-2.5 font-medium text-right">Commission</th>
                                        <th className="px-5 py-2.5 font-medium text-right">Net</th>
                                        <th className="px-5 py-2.5 font-medium">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {entries.map((e) => (
                                        <tr key={e.id}>
                                            <td className="px-5 py-3 font-mono text-xs text-gray-500">{e.bookingId.slice(0, 10)}…</td>
                                            <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                                                {new Date(e.date).toLocaleDateString("fr-FR")}
                                            </td>
                                            <td className="px-5 py-3 text-right text-gray-900 dark:text-white">
                                                {formatCurrency(e.grossAmount, e.currencyCode)}
                                            </td>
                                            <td className="px-5 py-3 text-right text-red-600">
                                                -{formatCurrency(e.commissionAmount, e.currencyCode)}
                                            </td>
                                            <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(e.netAmount, e.currencyCode)}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span data-testid="payout-status" className={`text-xs px-2 py-0.5 rounded-full ${
                                                    e.payoutStatus === "CLAIMED"
                                                        ? "bg-gray-100 dark:bg-gray-700 text-gray-500"
                                                        : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                                }`}>
                                                    {e.payoutStatus === "CLAIMED" ? "Réclamée" : "Disponible"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100 dark:border-gray-700">
                                <button onClick={() => load(page - 1)} disabled={page <= 1}
                                    className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40">
                                    Précédent
                                </button>
                                <span className="text-xs text-gray-500">Page {page} / {totalPages}</span>
                                <button onClick={() => load(page + 1)} disabled={page >= totalPages}
                                    className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40">
                                    Suivant
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function KpiCard({ icon: Icon, color, label, value, testId, rawValue }: {
    icon: LucideIcon; color: "blue" | "amber" | "green"; label: string; value: string;
    testId?: string; rawValue?: number;
}) {
    const colors: Record<string, string> = {
        blue:  "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
        amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
        green: "bg-green-100 dark:bg-green-900/30 text-green-600",
    };
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-lg font-bold text-gray-900 dark:text-white truncate" data-testid={testId} data-value={rawValue ?? ""}>{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    );
}
