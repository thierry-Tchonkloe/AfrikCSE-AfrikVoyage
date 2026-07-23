"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCw, Loader2, Gift, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { walletService, CashbackTransaction } from "@/services/employes/wallet.service";
import { WalletEntry, WalletEntryType } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

// ── Wallet helpers ────────────────────────────────────────────────────────────

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

const POSITIVE_TYPES: WalletEntryType[] = ["ALLOCATION", "SUBSIDY_CREDIT", "CASHBACK_CREDIT", "REFUND", "REWARD_CREDIT"];

function entryIcon(type: WalletEntryType) {
    return POSITIVE_TYPES.includes(type)
        ? <ArrowDownCircle className="h-4 w-4 text-green-500" />
        : <ArrowUpCircle   className="h-4 w-4 text-red-500" />;
}

function formatAmount(raw: string, type: WalletEntryType): string {
    const n    = parseFloat(raw);
    const sign = POSITIVE_TYPES.includes(type) ? "+" : "";
    return `${sign}${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} XOF`;
}

// ── Cashback helpers ──────────────────────────────────────────────────────────

const CASHBACK_STATUS: Record<CashbackTransaction["status"], { label: string; color: string; icon: React.ElementType }> = {
    CREDITED:        { label: "Crédité",       color: "text-green-600 bg-green-50 dark:bg-green-900/30",   icon: CheckCircle2 },
    CALCULATED:      { label: "Calculé",        color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",     icon: CheckCircle2 },
    PENDING_REVIEW:  { label: "En vérification",color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30", icon: Clock        },
    REJECTED:        { label: "Rejeté",         color: "text-red-600 bg-red-50 dark:bg-red-900/30",       icon: AlertTriangle},
};

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "wallet" | "cashback";

export default function WalletEmployePage() {
    const [tab, setTab]           = useState<Tab>("wallet");
    const [balance, setBalance]   = useState<string | null>(null);
    const [entries, setEntries]   = useState<WalletEntry[]>([]);
    const [entryTotal, setEntryTotal] = useState(0);
    const [entryPage, setEntryPage]   = useState(1);
    const [cbTxns, setCbTxns]         = useState<CashbackTransaction[]>([]);
    const [cbTotal, setCbTotal]       = useState(0);
    const [cbPage, setCbPage]         = useState(1);
    const [loading, setLoading]       = useState(true);
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
            setEntryTotal(history.total);
            setEntryPage(1);
        } catch (err) {
            toast.error(getErrorMessage(err, "Une erreur est survenue"));
        } finally {
            setLoading(false);
        }
    }, []);

    const loadCashback = useCallback(async () => {
        setLoading(true);
        try {
            const res = await walletService.getMyCashback(1, 20);
            setCbTxns(res.transactions);
            setCbTotal(res.total);
            setCbPage(1);
        } catch (err) {
            toast.error(getErrorMessage(err, "Une erreur est survenue"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tab === "wallet")   loadWallet();
        if (tab === "cashback") loadCashback();
    }, [tab, loadWallet, loadCashback]);

    const loadMoreEntries = async () => {
        setLoadingMore(true);
        try {
            const next = await walletService.getEntries(entryPage + 1, 20);
            setEntries((prev) => [...prev, ...next.entries]);
            setEntryPage((p) => p + 1);
        } catch (err) { toast.error(getErrorMessage(err, "")); }
        finally { setLoadingMore(false); }
    };

    const loadMoreCb = async () => {
        setLoadingMore(true);
        try {
            const next = await walletService.getMyCashback(cbPage + 1, 20);
            setCbTxns((prev) => [...prev, ...next.transactions]);
            setCbPage((p) => p + 1);
        } catch (err) { toast.error(getErrorMessage(err, "")); }
        finally { setLoadingMore(false); }
    };

    const balanceNum = balance !== null ? parseFloat(balance) : null;

    const totalCredited = cbTxns
        .filter((t) => t.status === "CREDITED")
        .reduce((s, t) => s + parseFloat(t.creditedAmount), 0);

    return (
        <div className="p-6 space-y-6 max-w-2xl mx-auto">
            {/* Solde */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between shadow-lg">
                <div>
                    <p className="text-sm opacity-80 mb-1">Solde disponible</p>
                    {loading && tab === "wallet" ? (
                        <div className="h-9 w-32 bg-white/20 rounded-lg animate-pulse" />
                    ) : (
                        <p className="text-3xl font-bold tracking-tight">
                            {balanceNum !== null
                                ? balanceNum.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                : "—"}
                            <span className="text-lg font-medium opacity-80 ml-1">XOF</span>
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl"><Wallet className="h-7 w-7" /></div>
                    <button onClick={loadWallet} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition" title="Actualiser">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Onglets */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                {([
                    { id: "wallet",   label: "Mouvements",    icon: Wallet },
                    { id: "cashback", label: "Cashback",      icon: Gift   },
                ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setTab(id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition ${
                            tab === id
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}>
                        <Icon className="h-4 w-4" /> {label}
                    </button>
                ))}
            </div>

            {/* ── Onglet Mouvements ─────────────────────────────────────────────── */}
            {tab === "wallet" && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Historique des mouvements</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{entryTotal} transaction{entryTotal !== 1 ? "s" : ""}</p>
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
                                                day: "2-digit", month: "short", year: "numeric",
                                                hour: "2-digit", minute: "2-digit",
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

                    {!loading && entries.length < entryTotal && (
                        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 text-center">
                            <button onClick={loadMoreEntries} disabled={loadingMore}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 flex items-center gap-1.5 mx-auto">
                                {loadingMore && <Loader2 className="h-3 w-3 animate-spin" />}
                                Voir plus ({entryTotal - entries.length} restants)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Onglet Cashback ───────────────────────────────────────────────── */}
            {tab === "cashback" && (
                <div className="space-y-4">
                    {/* Récap cashback crédité */}
                    {!loading && cbTxns.length > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                                <Gift className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Total cashback crédité</p>
                                <p className="text-xl font-bold text-green-700 dark:text-green-300">
                                    {totalCredited.toLocaleString("fr-FR")} XOF
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Historique cashback</h2>
                            <p className="text-xs text-gray-500 mt-0.5">{cbTotal} transaction{cbTotal !== 1 ? "s" : ""}</p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-16">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ) : cbTxns.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <Gift className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Aucun cashback pour le moment</p>
                                <p className="text-xs mt-1 text-gray-400">Vos cashbacks apparaîtront ici après chaque commande éligible.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                {cbTxns.map((t) => {
                                    const cfg = CASHBACK_STATUS[t.status];
                                    const Icon = cfg.icon;
                                    return (
                                        <li key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                                        Cashback {t.rule?.type === "PERCENTAGE"
                                                            ? `${parseFloat(t.rule.rate) * 100}%`
                                                            : "fixe"}
                                                    </p>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${cfg.color}`}>
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(t.createdAt).toLocaleDateString("fr-FR", {
                                                        day: "2-digit", month: "short", year: "numeric",
                                                        hour: "2-digit", minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                            <p className="text-sm font-bold text-green-600 dark:text-green-400 tabular-nums shrink-0">
                                                +{parseFloat(t.creditedAmount).toLocaleString("fr-FR")} {t.currencyCode}
                                            </p>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {!loading && cbTxns.length < cbTotal && (
                            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 text-center">
                                <button onClick={loadMoreCb} disabled={loadingMore}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 flex items-center gap-1.5 mx-auto">
                                    {loadingMore && <Loader2 className="h-3 w-3 animate-spin" />}
                                    Voir plus ({cbTotal - cbTxns.length} restants)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
