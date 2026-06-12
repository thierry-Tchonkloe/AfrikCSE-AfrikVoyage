"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, CreditCard, Check, Loader2, X, Eye, EyeOff, AlertCircle } from "lucide-react";
import { billingService } from "@/services/companies/billing.service";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
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

// ── Constantes ────────────────────────────────────────────────────────────────

const PLANS = [
    {
        id: "STARTER",
        name: "Starter",
        priceXOF: 0,
        priceUSD: "$0",
        period: "mois",
        desc: "Jusqu'à 50 utilisateurs",
        features: ["50 utilisateurs max", "Gestion voyages basique", "Support standard", "Rapports mensuels"],
        cta: "Passer au Starter",
        highlight: false,
    },
    {
        id: "BUSINESS",
        name: "Business",
        priceXOF: 175_000,
        priceUSD: "$299",
        period: "mois",
        desc: "Pour les équipes en croissance",
        features: ["200 utilisateurs max", "AfrikCSE + AfrikVoyage complet", "Support prioritaire", "Analytics avancés", "Accès API"],
        cta: "Passer au Business",
        highlight: true,
    },
    {
        id: "ENTERPRISE",
        name: "Enterprise",
        priceXOF: 292_000,
        priceUSD: "$499",
        period: "mois",
        desc: "Pour les grandes organisations",
        features: ["Utilisateurs illimités", "Accès plateforme complet", "Support dédié 24/7", "Intégrations avancées", "SLA & gestionnaire de compte"],
        cta: "Passer à l'Enterprise",
        highlight: false,
    },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PAID:    { label: "Payé",      color: "#10b981" },
    PENDING: { label: "En attente", color: "#f59e0b" },
    FAILED:  { label: "Échoué",    color: "#ef4444" },
};

// ── Déclaration KkiaPay globale ───────────────────────────────────────────────
declare global {
    interface Window {
        openKkiapayWidget?: (opts: Record<string, unknown>) => void;
        addSuccessListener?: (cb: (response: { transactionId: string }) => void) => void;
        removeKkiapayListener?: (event: string, cb: unknown) => void;
    }
}

export default function BillingPage() {
    const [sub, setSub]         = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState<"XOF" | "USD">("XOF");
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
        const plan = PLANS.find((p) => p.id === payModal);
        if (!plan) return;

        setPaying(true);
        try {
            if (payMethod === "kkiapay") {
                const kkiapayKey = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY;

                if (!kkiapayKey) {
                    toast.error("Clé publique KkiaPay non configurée (NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY)");
                    return;
                }

                if (!window.openKkiapayWidget) {
                    toast.error("Widget KkiaPay non chargé — vérifiez votre connexion");
                    return;
                }

                // Lance le widget KkiaPay
                window.openKkiapayWidget({
                    amount: plan.priceXOF,
                    api_key: kkiapayKey,
                    sandbox: process.env.NODE_ENV !== "production",
                    name: "AfrikCSE / AfrikVoyage",
                    data: JSON.stringify({ plan: payModal }),
                });

                // Écouter le succès du widget
                window.addSuccessListener?.(async (response) => {
                    try {
                        await billingService.confirmKkiapay(payModal, response.transactionId, currency);
                        toast.success("Paiement KkiaPay confirmé — abonnement activé !");
                        setPayModal(null);
                        load();
                    } catch (err: any) {
                        toast.error(err?.response?.data?.message ?? "Erreur confirmation KkiaPay");
                    }
                });

            } else if (payMethod === "fedapay") {
                const result = await billingService.initiateFedapay(payModal, currency);

                if (!result.checkoutUrl) {
                    // Plan gratuit
                    toast.success(result.message ?? "Plan activé");
                    setPayModal(null);
                    load();
                    return;
                }

                // Rediriger vers FedaPay
                toast.info("Redirection vers FedaPay...");
                setTimeout(() => {
                    window.location.href = result.checkoutUrl!;
                }, 800);

            } else {
                // Carte
                if (!cardNumber || !expiry || !cvv) {
                    toast.error("Veuillez remplir tous les champs carte");
                    return;
                }
                await billingService.payWithCard(payModal, {
                    cardNumber: cardNumber.replace(/\s/g, ""),
                    expiry,
                    cvv,
                });
                toast.success("Paiement par carte effectué — abonnement activé !");
                setPayModal(null);
                setCardNumber(""); setExpiry(""); setCvv("");
                load();
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Erreur lors du paiement");
        } finally {
            setPaying(false);
        }
    };

    // Lire statut FedaPay depuis l'URL (retour après paiement)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get("status");
        if (status === "success") {
            toast.success("Paiement FedaPay reçu — votre abonnement sera activé sous peu");
            load();
        } else if (status === "cancelled") {
            toast.info("Paiement FedaPay annulé");
        }
        // Nettoyer les params de l'URL
        if (status) window.history.replaceState({}, "", window.location.pathname);
    }, [load]);

    const formatCard = (v: string) =>
        v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

    const currentPlan = PLANS.find((p) => p.id === sub?.plan) ?? PLANS[0];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Facturation et abonnement</h1>
                <p className="text-sm text-gray-500">
                    Gérez votre abonnement, modes de paiement et historique de facturation
                </p>
            </div>

            {/* ── Plan actuel ─────────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">
                                    Plan actuel : <span style={{ color: "#0f766e" }}>{currentPlan.name}</span>
                                </h3>
                                {sub && (
                                    <span
                                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                                        style={{ background: "#f0fdf4", color: "#0f766e" }}
                                    >
                                        {sub.status === "ACTIVE" ? "Actif" : sub.status}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">Votre abonnement actuel</p>
                        </div>
                        <button
                            onClick={() => setPayModal("BUSINESS")}
                            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                        >
                            Changer de plan
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {[
                            {
                                label: "Coût mensuel",
                                value: currency === "XOF"
                                    ? `${currentPlan.priceXOF.toLocaleString()} XOF`
                                    : currentPlan.priceUSD,
                            },
                            { label: "Utilisateurs", value: currentPlan.id === "ENTERPRISE" ? "Illimité" : currentPlan.id === "BUSINESS" ? "200 max" : "50 max" },
                            {
                                label: "Prochain renouvellement",
                                value: sub?.currentPeriodEnd
                                    ? new Date(sub.currentPeriodEnd).toLocaleDateString("fr-FR")
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
                    <h3 className="font-semibold text-gray-900 mb-4">Méthodes de paiement</h3>
                    <div className="space-y-3">
                        {[
                            { icon: "🌍", label: "KkiaPay", sub: "MTN, Moov, Wave, carte", badge: "Recommandé" },
                            { icon: "🔵", label: "FedaPay",  sub: "Mobile Money + carte", badge: null },
                            { icon: "💳", label: "Carte prépayée", sub: "Visa, Mastercard",  badge: null },
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
                        + Initier un paiement
                    </button>
                </div>
            </div>

            {/* ── Plans disponibles ────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-gray-900">Plans disponibles</h3>
                    <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
                        {(["XOF", "USD"] as const).map((c) => (
                            <button
                                key={c}
                                onClick={() => setCurrency(c)}
                                className="px-3 py-1.5 rounded-md font-medium transition-colors"
                                style={currency === c
                                    ? { background: "white", color: "#0f766e", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                                    : { color: "#6b7280" }}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {PLANS.map((plan) => {
                        const isCurrent = sub?.plan === plan.id;
                        const displayPrice = currency === "XOF"
                            ? plan.priceXOF === 0 ? "Gratuit" : `${plan.priceXOF.toLocaleString()} XOF`
                            : plan.priceUSD;

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
                                        ⭐ Le plus populaire
                                    </span>
                                )}
                                {isCurrent && (
                                    <span className="text-xs font-bold text-center mb-2" style={{ color: "#0f766e" }}>
                                        ✓ Plan actuel
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
                                    {isCurrent ? "Plan actuel" : plan.cta}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Historique paiements ──────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Historique des paiements</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                {["N° Facture", "Date", "Description", "Méthode", "Montant", "Statut", "Action"].map((h) => (
                                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i} className="border-b">
                                        <td colSpan={7} className="px-5 py-4">
                                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : (sub?.invoices ?? []).length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">
                                        Aucune facture pour le moment
                                    </td>
                                </tr>
                            ) : (
                                (sub?.invoices ?? []).map((inv) => {
                                    const st = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.PENDING;
                                    return (
                                        <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="px-5 py-3 text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                                            <td className="px-5 py-3 text-xs text-gray-500">
                                                {new Date(inv.createdAt).toLocaleDateString("fr-FR")}
                                            </td>
                                            <td className="px-5 py-3 text-xs text-gray-600">{inv.description}</td>
                                            <td className="px-5 py-3 text-xs text-gray-500 uppercase">
                                                {inv.paymentMethod ?? "—"}
                                            </td>
                                            <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                                                {currency === "XOF"
                                                    ? `${(inv.amount * 585).toLocaleString()} XOF`
                                                    : `$${inv.amount}`}
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
                                <h3 className="font-bold text-gray-900">Choisir un mode de paiement</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Plan : <strong>{PLANS.find((p) => p.id === payModal)?.name}</strong> —{" "}
                                    {currency === "XOF"
                                        ? `${PLANS.find((p) => p.id === payModal)?.priceXOF.toLocaleString()} XOF`
                                        : PLANS.find((p) => p.id === payModal)?.priceUSD}/mois
                                </p>
                            </div>
                            <button onClick={() => setPayModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Sélection devise */}
                        <div className="flex gap-2 mb-4">
                            {(["XOF", "USD"] as const).map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCurrency(c)}
                                    className="flex-1 py-1.5 text-xs font-medium rounded-lg border-2 transition-all"
                                    style={currency === c
                                        ? { borderColor: "#0f766e", color: "#0f766e", background: "#f0fdf4" }
                                        : { borderColor: "#e5e7eb", color: "#6b7280" }}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        {/* Méthodes */}
                        <div className="grid grid-cols-3 gap-2 mb-5">
                            {[
                                { id: "kkiapay" as const,  label: "KkiaPay",  icon: "🌍", sub: "Mobile Money" },
                                { id: "fedapay" as const,  label: "FedaPay",  icon: "🔵", sub: "MM + Carte" },
                                { id: "card" as const,     label: "Carte",    icon: "💳", sub: "Visa/Mastercard" },
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
                                <p className="font-medium text-gray-900 text-center">Payer via KkiaPay</p>
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                    MTN Mobile Money, Moov Money, Wave, carte Visa/Mastercard
                                </p>
                                {!process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY && (
                                    <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                        <span>
                                            <strong>NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY</strong> non configurée.
                                            Ajoutez-la dans votre fichier <code>.env.local</code>.
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Infos FedaPay */}
                        {payMethod === "fedapay" && (
                            <div className="mb-5 p-4 rounded-xl text-sm" style={{ background: "#eff6ff" }}>
                                <p className="text-2xl text-center mb-2">🔵</p>
                                <p className="font-medium text-gray-900 text-center">Payer via FedaPay</p>
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                    Vous serez redirigé vers la page de paiement FedaPay sécurisée
                                </p>
                            </div>
                        )}

                        {/* Formulaire carte */}
                        {payMethod === "card" && (
                            <div className="space-y-3 mb-5">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Numéro de carte</label>
                                    <input
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(formatCard(e.target.value))}
                                        placeholder="1234 5678 9012 3456"
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono outline-none focus:border-teal-400"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Date d&apos;expiration</label>
                                        <input
                                            value={expiry}
                                            onChange={(e) => {
                                                const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                                                setExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                                            }}
                                            placeholder="MM/AA"
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
                                    <span>Paiement carte en mode simulation — configurez Stripe en production</span>
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
                            {payMethod === "kkiapay" ? "Ouvrir le widget KkiaPay"
                                : payMethod === "fedapay" ? "Continuer vers FedaPay"
                                : "Payer maintenant"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
