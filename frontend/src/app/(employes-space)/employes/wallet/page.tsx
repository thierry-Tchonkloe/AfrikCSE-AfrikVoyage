"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCw, Loader2 } from "lucide-react";
import { walletService } from "@/services/employes/wallet.service";
import { WalletEntry, WalletEntryType } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const ENTRY_LABELS: Record<WalletEntryType, string> = {
    ALLOCATION:        "Allocation",
    DEBIT:             "Débit",
    SUBSIDY_CREDIT:    "Subvention créditée",
    CASHBACK_CREDIT:   "Cashback crédité",
    CASHBACK_REVERSAL: "Cashback annulé",
    REFUND:            "Remboursement",
    EXPIRY:            "Expiration",
    REWARD_CREDIT:     "Récompense créditée",
};

function entryIcon(type: WalletEntryType) {
    const positive = ["ALLOCATION", "SUBSIDY_CREDIT", "CASHBACK_CREDIT", "REFUND", "REWARD_CREDIT"];
    return positive.includes(type)
        ? <ArrowDownCircle className="h-4 w-4 text-green-500" />
        : <ArrowUpCircle className="h-4 w-4 text-red-500" />;
}

function formatAmount(raw: string, type: WalletEntryType): string {
    const n = parseFloat(raw);
    const positive = ["ALLOCATION", "SUBSIDY_CREDIT", "CASHBACK_CREDIT", "REFUND", "REWARD_CREDIT"];
    const sign = positive.includes(type) ? "+" : "";
    return `${sign}${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} XOF`;
}

export default function WalletEmployePage() {
    const [balance, setBalance]   = useState<string | null>(null);
    const [entries, setEntries]   = useState<WalletEntry[]>([]);
    const [total, setTotal]       = useState(0);
    const [page, setPage]         = useState(1);
    const [loading, setLoading]   = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const loadWallet = useCallback(async () => {
        setLoading(true);
        try {
            const [walletData, history] = await Promise.all([
                walletService.getMyWallet(),
                walletService.getEntries(1, 20),
            ]);
            setBalance(walletData.balance);
            setEntries(history.entries);
            setTotal(history.total);
            setPage(1);
        } catch (err) {
            toast.error(getErrorMessage(err, "Une erreur est survenue"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadWallet(); }, [loadWallet]);

    const loadMore = async () => {
        setLoadingMore(true);
        try {
            const next = await walletService.getEntries(page + 1, 20);
            setEntries((prev) => [...prev, ...next.entries]);
            setPage((p) => p + 1);
        } catch (err) {
            toast.error(getErrorMessage(err, "Une erreur est survenue"));
        } finally {
            setLoadingMore(false);
        }
    };

    const balanceNum = balance !== null ? parseFloat(balance) : null;

    return (
        <div className="p-6 space-y-6 max-w-2xl mx-auto">
            {/* Solde */}
            <div className="rounded-2xl bg-linear-to-br from-(--color-accent,#2563eb) to-blue-700 text-white p-6 flex items-center justify-between shadow-lg">
                <div>
                    <p className="text-sm opacity-80 mb-1">Solde disponible</p>
                    {loading ? (
                        <div className="h-9 w-32 bg-white/20 rounded-lg animate-pulse" />
                    ) : (
                        <p className="text-3xl font-bold tracking-tight">
                            {balanceNum !== null
                                ? balanceNum.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                : "—"} <span className="text-lg font-medium opacity-80">XOF</span>
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                        <Wallet className="h-7 w-7" />
                    </div>
                    <button
                        onClick={loadWallet}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
                        title="Actualiser"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Historique */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="font-semibold text-gray-800 dark:text-gray-100">Historique des mouvements</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{total} transaction{total !== 1 ? "s" : ""}</p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Aucun mouvement pour le moment</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                        {entries.map((e) => (
                            <li key={e.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                <div className="shrink-0">{entryIcon(e.type)}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                                        {e.description ?? ENTRY_LABELS[e.type]}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(e.createdAt).toLocaleDateString("fr-FR", {
                                            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                                        })}
                                        {e.expiresAt && (
                                            <span className="ml-2 text-amber-500">
                                                · expire le {new Date(e.expiresAt).toLocaleDateString("fr-FR")}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <p className={`text-sm font-semibold tabular-nums shrink-0 ${
                                    parseFloat(e.amount) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                }`}>
                                    {formatAmount(e.amount, e.type)}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}

                {!loading && entries.length < total && (
                    <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 text-center">
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 flex items-center gap-1.5 mx-auto"
                        >
                            {loadingMore && <Loader2 className="h-3 w-3 animate-spin" />}
                            Voir plus ({total - entries.length} restants)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
