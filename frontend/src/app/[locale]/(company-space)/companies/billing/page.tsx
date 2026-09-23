"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Download, Check, Loader2, X, Eye, EyeOff, AlertCircle } from "lucide-react";
import { billingService } from "@/services/companies/billing.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/currency";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";

type Translator = ReturnType<typeof useTranslations<"company.billing">>;

// ── Types ─────────────────────────────────────────────────────────────────────

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    status: string;
    description: string | null;
    paymentMethod: string | null;
    createdAt: string;
}

interface Subscription {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    invoices: Invoice[];
}

interface Plan {
    id: string;
    priceXOF: number;
    name: string;
    period: string;
    desc: string;
    features: string[];
    cta: string;
    highlight: boolean;
}

// ── Constantes ────────────────────────────────────────────────────────────────
// Contenu marketing (non-monétaire) par plan — le prix réel est chargé depuis
// GET /billing/plans/resolved (PlanConfig.pricePerEmployee dynamique, XOF).
// Pas de tarif USD affiché : aucune conversion de change fiable n'existe côté
// backend, afficher un second prix statique serait juste une autre confusion.

const getPlanMeta = (t: Translator): Record<string, Omit<Plan, "id" | "priceXOF">> => ({
    STARTER: {
        name: t("starter"),
        period: "mois",
        desc: t("up50Users"),
        features: [t("text50UsersMax"), t("basicTravelManagement"), t("standardSupport"), t("monthlyReports")],
        cta: t("switchStarter"),
        highlight: false,
    },
    BUSINESS: {
        name: t("business"),
        period: "mois",
        desc: t("growingTeams"),
        features: [t("text200UsersMax"), t("fullAfrikcseAfrikvoyage"), t("prioritySupport"), t("advancedAnalytics"), t("apiAccess")],
        cta: t("switchBusiness"),
        highlight: true,
    },
    ENTERPRISE: {
        name: t("enterprise"),
        period: "mois",
        desc: t("largeOrganizations"),
        features: [t("unlimitedUsers"), t("fullPlatformAccess"), t("text247DedicatedSupport"), t("advancedIntegrations"), t("slaAccountManager")],
        cta: t("switchEnterprise"),
        highlight: false,
    },
});

const getStatusConfig = (t: Translator): Record<string, { label: string; color: string }> => ({
    PAID:    { label: t("paid"),      color: "#10b981" },
    PENDING: { label: t("pending"), color: "#f59e0b" },
    FAILED:  { label: t("failed"),    color: "#ef4444" },
});

// ── Déclaration KkiaPay globale ───────────────────────────────────────────────
declare global {
    interface Window {
        openKkiapayWidget?: (opts: Record<string, unknown>) => void;
        addSuccessListener?: (cb: (response: { transactionId: string }) => void) => void;
        removeKkiapayListener?: (event: string, cb: unknown) => void;
    }
}

export default function BillingPage() {
    const dateLocale = useDateLocale();
    const t = useTranslations("company.billing");
    const PLAN_META = useMemo(() => getPlanMeta(t), [t]);
    const STATUS_CONFIG = useMemo(() => getStatusConfig(t), [t]);
    const [sub, setSub]         = useState<Subscription | null>(null);
    const [plans, setPlans]     = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [payModal, setPayModal] = useState<string | null>(null);
    const [payMethod, setPayMethod] = useState<"card" | "kkiapay" | "fedapay">("kkiapay");
    const [paying, setPaying]   = useState(false);

    // Champs carte
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry]         = useState("");
    const [cvv, setCvv]               = useState("");
    const [showCvv, setShowCvv]       = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await billingService.getSubscription();
            setSub(data);
        } catch {
            // Pas encore d'abonnement — normal pour les nouvelles orgs
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        billingService.getResolvedPlans()
            .then((resolved) => setPlans(resolved.map((r) => ({ id: r.plan, priceXOF: r.priceXOF, ...PLAN_META[r.plan] }))))
            .catch(() => toast.error(t("errorLoadingPricing")));
    }, []);

    // Charger le script KkiaPay dynamiquement si nécessaire
    useEffect(() => {
        const kkiapayPublicKey = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY;
        if (!kkiapayPublicKey) return;

        const existing = document.getElementById("kkiapay-script");
        if (existing) return;

        const script = document.createElement("script");
        script.id = "kkiapay-script";
        script.src = "https://cdn.kkiapay.me/k.js";
        script.async = true;
        document.head.appendChild(script);
    }, []);

    const handlePay = async () => {
        if (!payModal) return;
        const plan = plans.find((p) => p.id === payModal);
        if (!plan) return;

        setPaying(true);
        try {
            if (payMethod === "kkiapay") {
                const kkiapayKey = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY;

                if (!kkiapayKey) {
                    toast.error(t("kkiapayPublicKeyNot"));
                    return;
                }

                if (!window.openKkiapayWidget) {
                    toast.error(t("kkiapayWidgetNotLoaded"));
                    return;
                }

                // Lance le widget KkiaPay avec le prix XOF réel résolu pour cette org
                window.openKkiapayWidget({
                    amount: plan.priceXOF,
                    key: kkiapayKey,
                    sandbox: process.env.NODE_ENV !== "production",
                    name: t("afrikcseAfrikvoyage"),
                    data: JSON.stringify({ plan: payModal }),
                });

                // Écouter le succès du widget
                window.addSuccessListener?.(async (response) => {
                    try {
                        await billingService.confirmKkiapay(payModal, response.transactionId);
                        toast.success(t("kkiapayPaymentConfirmed"));
                        setPayModal(null);
                        load();
                    } catch (err) {
                        toast.error(getErrorMessage(err, t("kkiapayConfirmationError")));
                    }
                });

            } else if (payMethod === "fedapay") {
                const result = await billingService.initiateFedapay(payModal);

                if (!result.checkoutUrl) {
                    // Plan gratuit
                    toast.success(result.message ?? t("planActivated"));
                    setPayModal(null);
                    load();
                    return;
                }

                // Rediriger vers FedaPay
                toast.info(t("redirectingFedapay"));
                setTimeout(() => {
                    window.location.href = result.checkoutUrl!;
                }, 800);

            } else {
                // Carte
                if (!cardNumber || !expiry || !cvv) {
                    toast.error(t("pleaseFillAllCard"));
                    return;
                }
                await billingService.payWithCard(payModal, {
                    cardNumber: cardNumber.replace(/\s/g, ""),
                    expiry,
                    cvv,
                });
                toast.success(t("cardPaymentCompleted"));
                setPayModal(null);
                setCardNumber(""); setExpiry(""); setCvv("");
                load();
            }
        } catch (err) {
            toast.error(getErrorMessage(err, t("errorDuringPayment")));
        } finally {
            setPaying(false);
        }
    };

    // Lire statut FedaPay depuis l'URL (retour après paiement)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get("status");
        if (status === "success") {
            toast.success(t("fedapayPaymentReceived"));
            load();
        } else if (status === "cancelled") {
            toast.info(t("fedapayPaymentCancelled"));
        }
        // Nettoyer les params de l'URL
        if (status) window.history.replaceState({}, "", window.location.pathname);
    }, [load]);

    const formatCard = (v: string) =>
        v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

    const currentPlan = plans.find((p) => p.id === sub?.plan) ?? plans[0];

    if (loading || !currentPlan) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">{t("billingSubscription")}</h1>
                <p className="text-sm text-gray-500">
                    {t("manageSubscriptionPayment")}
                </p>
            </div>

            {/* ── Plan actuel ─────────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">
                                    {t("currentPlan")} <span style={{ color: "#0f766e" }}>{currentPlan.name}</span>
                                </h3>
                                {sub && (
                                    <span
                                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                                        style={{ background: "#f0fdf4", color: "#0f766e" }}
                                    >
                                        {sub.status === "ACTIVE" ? t("active") : sub.status}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{t("currentSubscription")}</p>
                        </div>
                        <button
                            onClick={() => setPayModal("BUSINESS")}
                            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                        >
                            {t("changePlan")}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: t("monthlyCost"), value: formatCurrency(currentPlan.priceXOF, undefined, dateLocale) },
                            { label: t("users"), value: currentPlan.id === "ENTERPRISE" ? t("unlimited") : currentPlan.id === "BUSINESS" ? t("text200Max") : t("text50Max") },
                            {
                                label: t("nextRenewal"),
                                value: sub?.currentPeriodEnd
                                    ? new Date(sub.currentPeriodEnd).toLocaleDateString(dateLocale)
                                    : "—",
                            },
                        ].map((s) => (
                            <div key={s.label} className="border border-gray-100 rounded-xl p-3">
                                <p className="text-xs text-gray-500">{s.label}</p>
                                <p className="text-base font-bold text-gray-900 mt-1">{s.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 space-y-1">
                        {currentPlan.features.map((f) => (
                            <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
                                <Check size={13} style={{ color: "#0f766e" }} /> {f}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modes de paiement acceptés */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">{t("paymentMethods")}</h3>
                    <div className="space-y-3">
                        {[
                            { icon: "🌍", label: t("kkiapay"), sub: t("mtnMoovWaveCard"), badge: t("recommended") },
                            { icon: "🔵", label: t("fedapay"),  sub: t("mobileMoneyCard"), badge: null },
                            { icon: "💳", label: t("prepaidCard"), sub: t("visaMastercard"),  badge: null },
                        ].map((m) => (
                            <div key={m.label} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                                <span className="text-2xl">{m.icon}</span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-medium text-gray-900">{m.label}</p>
                                        {m.badge && (
                                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                                style={{ background: "#f0fdf4", color: "#0f766e" }}>
                                                {m.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">{m.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => setPayModal(sub?.plan ?? "BUSINESS")}
                        className="w-full mt-4 py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-teal-300 hover:text-teal-600 transition-colors"
                    >
                        {t("initiatePayment")}
                    </button>
                </div>
            </div>

            {/* ── Plans disponibles ────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-5">{t("availablePlans")}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {plans.map((plan) => {
                        const isCurrent = sub?.plan === plan.id;
                        const displayPrice = plan.priceXOF === 0 ? t("free") : formatCurrency(plan.priceXOF, undefined, dateLocale);

                        return (
                            <div
                                key={plan.id}
                                className="rounded-xl border p-5 flex flex-col"
                                style={isCurrent
                                    ? { borderColor: "#0f766e", borderWidth: 2 }
                                    : plan.highlight
                                    ? { borderColor: "#0f766e", borderWidth: 1.5 }
                                    : { borderColor: "#e5e7eb" }}
                            >
                                {plan.highlight && (
                                    <span className="text-xs font-bold text-center mb-2" style={{ color: "#0f766e" }}>
                                        {t("mostPopular")}
                                    </span>
                                )}
                                {isCurrent && (
                                    <span className="text-xs font-bold text-center mb-2" style={{ color: "#0f766e" }}>
                                        {t("currentPlan2")}
                                    </span>
                                )}
                                <h4 className="font-bold text-gray-900">{plan.name}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{plan.desc}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-3">
                                    {displayPrice}
                                    {plan.priceXOF > 0 && (
                                        <span className="text-sm font-normal text-gray-500">/{plan.period}</span>
                                    )}
                                </p>
                                <ul className="mt-4 space-y-2 flex-1">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                                            <Check size={13} style={{ color: "#0f766e" }} /> {f}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => !isCurrent && setPayModal(plan.id)}
                                    disabled={isCurrent}
                                    className="w-full mt-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:cursor-default"
                                    style={isCurrent
                                        ? { background: "#f0fdf4", color: "#0f766e", border: "1px solid #0f766e" }
                                        : plan.highlight
                                        ? { background: "#0f766e", color: "white" }
                                        : { background: "white", color: "#374151", border: "1px solid #e5e7eb" }}
                                >
                                    {isCurrent ? t("currentPlan3") : plan.cta}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Historique paiements ──────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">{t("paymentHistory")}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                {[t("invoiceNo"), t("date"), t("description"), t("method"), t("amount"), t("status"), t("action")].map((h) => (
                                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(sub?.invoices ?? []).length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">
                                        {t("noInvoicesMoment")}
                                    </td>
                                </tr>
                            ) : (
                                (sub?.invoices ?? []).map((inv) => {
                                    const st = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.PENDING;
                                    return (
                                        <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="px-5 py-3 text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                                            <td className="px-5 py-3 text-xs text-gray-500">
                                                {new Date(inv.createdAt).toLocaleDateString(dateLocale)}
                                            </td>
                                            <td className="px-5 py-3 text-xs text-gray-600">{inv.description}</td>
                                            <td className="px-5 py-3 text-xs text-gray-500 uppercase">
                                                {inv.paymentMethod ?? "—"}
                                            </td>
                                            <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                                                {formatCurrency(inv.amount, inv.currency, dateLocale)}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className="text-xs font-medium px-2 py-1 rounded-full"
                                                    style={{ color: st.color, background: st.color + "18" }}
                                                >
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                                                    <Download size={13} /> PDF
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Modal Paiement ────────────────────────────────────────────────────────── */}
            {payModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="font-bold text-gray-900">{t("choosePaymentMethod")}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {t("plan")} <strong>{plans.find((p) => p.id === payModal)?.name}</strong> —{" "}
                                    {formatCurrency(plans.find((p) => p.id === payModal)?.priceXOF ?? 0, undefined, dateLocale)}{t("month")}
                                </p>
                            </div>
                            <button onClick={() => setPayModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Méthodes */}
                        <div className="grid grid-cols-3 gap-2 mb-5">
                            {[
                                { id: "kkiapay" as const,  label: t("kkiapay"),  icon: "🌍", sub: t("mobileMoney") },
                                { id: "fedapay" as const,  label: t("fedapay"),  icon: "🔵", sub: t("mmCard") },
                                { id: "card" as const,     label: t("card"),    icon: "💳", sub: t("visaMastercard2") },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setPayMethod(m.id)}
                                    className="flex flex-col items-center gap-1 p-3 border-2 rounded-xl text-xs font-medium transition-all"
                                    style={payMethod === m.id
                                        ? { borderColor: "#0f766e", background: "#f0fdf4", color: "#0f766e" }
                                        : { borderColor: "#e5e7eb", color: "#6b7280" }}
                                >
                                    <span className="text-xl">{m.icon}</span>
                                    <span>{m.label}</span>
                                    <span className="font-normal opacity-70">{m.sub}</span>
                                </button>
                            ))}
                        </div>

                        {/* Infos KkiaPay */}
                        {payMethod === "kkiapay" && (
                            <div className="mb-5 p-4 rounded-xl text-sm" style={{ background: "#f0fdf4" }}>
                                <p className="text-2xl text-center mb-2">🌍</p>
                                <p className="font-medium text-gray-900 text-center">{t("payViaKkiapay")}</p>
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                    {t("mtnMobileMoneyMoov")}
                                </p>
                                {!process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY && (
                                    <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                        <span>
                                            {t.rich("nextPublicKkiapayPublic", { strong1: (chunks) => <strong>{chunks}</strong>, code1: (chunks) => <code>{chunks}</code> })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Infos FedaPay */}
                        {payMethod === "fedapay" && (
                            <div className="mb-5 p-4 rounded-xl text-sm" style={{ background: "#eff6ff" }}>
                                <p className="text-2xl text-center mb-2">🔵</p>
                                <p className="font-medium text-gray-900 text-center">{t("payViaFedapay")}</p>
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                    {t("willRedirectedSecureFedapay")}
                                </p>
                            </div>
                        )}

                        {/* Formulaire carte */}
                        {payMethod === "card" && (
                            <div className="space-y-3 mb-5">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">{t("cardNumber")}</label>
                                    <input
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(formatCard(e.target.value))}
                                        placeholder="1234 5678 9012 3456"
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono outline-none focus:border-teal-400"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">{t("expiryDate")}</label>
                                        <input
                                            value={expiry}
                                            onChange={(e) => {
                                                const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                                                setExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                                            }}
                                            placeholder={t("mmYy")}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono outline-none focus:border-teal-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">CVV</label>
                                        <div className="relative">
                                            <input
                                                value={cvv}
                                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                                type={showCvv ? "text" : "password"}
                                                placeholder="•••"
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono outline-none pr-9 focus:border-teal-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCvv(!showCvv)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            >
                                                {showCvv ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
                                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                    <span>{t("cardPaymentSimulationMode")}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handlePay}
                            disabled={paying}
                            className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70 transition-opacity hover:opacity-90"
                            style={{ background: "#0f766e" }}
                        >
                            {paying && <Loader2 size={15} className="animate-spin" />}
                            {payMethod === "kkiapay" ? t("openKkiapayWidget")
                                : payMethod === "fedapay" ? t("continueFedapay")
                                : t("payNow")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
