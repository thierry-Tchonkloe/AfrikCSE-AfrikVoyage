"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, CreditCard, Check, Loader2, X, Eye, EyeOff } from "lucide-react";
import { billingService } from "@/services/companies/billing.service";
import { toast } from "sonner";

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    description: string | null;
    createdAt: string;
}

interface Subscription {
    plan: string;
    status: string;
    currentPeriodEnd: string;
    invoices: Invoice[];
}

const PLANS = [
    {
        id: "STARTER",
        name: "Starter",
        price: "$0",
        period: "month",
        desc: "For small teams getting started",
        features: [
        "Up to 50 users",
        "Basic travel management",
        "Standard support",
        "Monthly reports",
        ],
        cta: "Downgrade to Starter",
        highlight: false,
    },
    {
        id: "BUSINESS",
        name: "Professional",
        price: "$299",
        period: "month",
        desc: "For growing businesses",
        features: [
        "Up to 200 users",
        "Advanced travel & CSE tools",
        "Priority support",
        "Custom analytics",
        "API access",
        ],
        cta: "Downgrade to Professional",
        highlight: true,
    },
    {
        id: "ENTERPRISE",
        name: "Enterprise",
        price: "$499",
        period: "month",
        desc: "For large organisations",
        features: [
        "Unlimited users",
        "Full platform access",
        "24/7 dedicated support",
        "Advanced integrations",
        "SLA & account manager",
        ],
        cta: "Current Plan",
        highlight: false,
        current: true,
    },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PAID:    { label: "Paid",    color: "#10b981" },
    PENDING: { label: "Pending", color: "#f59e0b" },
    FAILED:  { label: "Failed",  color: "#ef4444" },
};

export default function BillingPage() {
    const [sub, setSub]       = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
    const [payModal, setPayModal] = useState<string | null>(null); // plan cible
    const [payMethod, setPayMethod] = useState<"card" | "kkiapay" | "fedapay">("card");
    const [paying, setPaying]   = useState(false);

    // Formulaire carte
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry]         = useState("");
    const [cvv, setCvv]               = useState("");
    const [showCvv, setShowCvv]       = useState(false);

    const load = useCallback(async () => {
        try {
        const data = await billingService.getSubscription();
        setSub(data);
        } catch {
        // Pas encore de subscription — affiche les plans
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handlePay = async () => {
        if (!payModal) return;
        setPaying(true);
        try {
        if (payMethod === "kkiapay") {
            // Lance le widget KkiaPay
            toast.info("Redirection vers KkiaPay...");
            // En production : window.KkiaPay.buy({ amount: 29900, key: process.env.KKIAPAY_PUBLIC_KEY })
            await new Promise((r) => setTimeout(r, 1500));
            toast.success("Paiement KkiaPay simulé avec succès");

        } else if (payMethod === "fedapay") {
            const res = await billingService.payWithFedapay(payModal);
            // En production : window.location.href = res.checkoutUrl
            toast.info(`Redirection FedaPay : ${res.checkoutUrl}`);

        } else {
            // Carte
            if (!cardNumber || !expiry || !cvv) {
            toast.error("Veuillez remplir tous les champs de carte");
            return;
            }
            await new Promise((r) => setTimeout(r, 1500));
            toast.success("Paiement par carte simulé avec succès");
        }

        setPayModal(null);
        load();
        } catch { toast.error("Erreur paiement"); }
        finally { setPaying(false); }
    };

    const formatCard = (v: string) =>
        v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-xl font-bold text-gray-900">Facturation et abonnement</h1>
            <p className="text-sm text-gray-500">
            Gérez votre abonnement, vos modes de paiement et votre historique de facturation
            </p>
        </div>

        {/* Plan actuel + mode de paiement */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Plan actuel */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-4">
                <div>
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">Plan d&#39;entreprise</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "#f0fdf4", color: "#0f766e" }}>
                    Actif
                    </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Votre abonnement actuel</p>
                </div>
                <button
                onClick={() => setPayModal("BUSINESS")}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                Change Plan
                </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
                {[
                { label: "Monthly Cost",    value: "$499/month" },
                { label: "Utilisateurs inclus", value: "Illimité" },
                { label: "Next Billing",    value: sub?.currentPeriodEnd
                    ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                        })
                    : "Jan 20, 2026" },
                ].map((s) => (
                <div key={s.label}
                    className="border border-gray-100 rounded-xl p-3">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{s.value}</p>
                </div>
                ))}
            </div>
            <div className="mt-4 space-y-1">
                {PLANS.find((p) => p.id === "ENTERPRISE")?.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <Check size={13} style={{ color: "#0f766e" }} /> {f}
                </div>
                ))}
            </div>
            </div>

            {/* Mode de paiement enregistré */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Mode de paiement</h3>
                <button className="text-xs text-teal-600 hover:underline">Edit</button>
            </div>
            {/* Visuel carte */}
            <div
                className="rounded-xl p-4 text-white mb-4"
                style={{ background: "linear-gradient(135deg, #1e3a5f, #0f766e)" }}
            >
                <div className="flex justify-between items-start mb-6">
                <CreditCard size={24} />
                <span className="text-sm font-bold">VISA</span>
                </div>
                <p className="text-sm font-mono tracking-widest">•••• •••• •••• 4532</p>
                <div className="flex justify-between mt-3 text-xs opacity-80">
                <div>
                    <p className="text-xs opacity-60">Card Holder</p>
                    <p>ACME Corporation</p>
                </div>
                <div>
                    <p className="text-xs opacity-60">Expires</p>
                    <p>12/27</p>
                </div>
                </div>
            </div>
            <button
                onClick={() => setPayModal("ENTERPRISE")}
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-teal-300 hover:text-teal-600 transition-colors"
            >
                + Add Payment Method
            </button>
            </div>
        </div>

        {/* Plans disponibles */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900">Plans disponibles</h3>
            <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
                {(["monthly", "annual"] as const).map((b) => (
                <button key={b}
                    onClick={() => setBilling(b)}
                    className="px-3 py-1.5 rounded-md font-medium transition-colors"
                    style={billing === b
                    ? { background: "white", color: "#0f766e", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                    : { color: "#6b7280" }}
                >
                    {b === "monthly" ? "Monthly" : "Annual"}
                    {b === "annual" && (
                    <span className="ml-1 text-green-600 font-bold">Save 20%</span>
                    )}
                </button>
                ))}
            </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
                <div key={plan.id}
                className="rounded-xl border p-5 flex flex-col"
                style={plan.highlight
                    ? { borderColor: "#0f766e", borderWidth: 2 }
                    : { borderColor: "#e5e7eb" }}>
                {plan.highlight && (
                    <span className="text-xs font-bold text-center mb-2"
                    style={{ color: "#0f766e" }}>
                    ⭐ Most Popular
                    </span>
                )}
                <h4 className="font-bold text-gray-900">{plan.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{plan.desc}</p>
                <p className="text-3xl font-bold text-gray-900 mt-3">
                    {billing === "annual"
                    ? `$${Math.round(parseInt(plan.price.replace("$", "")) * 0.8)}`
                    : plan.price}
                    <span className="text-sm font-normal text-gray-500">/{plan.period}</span>
                </p>
                <ul className="mt-4 space-y-2 flex-1">
                    {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                        <Check size={13} style={{ color: "#0f766e" }} /> {f}
                    </li>
                    ))}
                </ul>
                <button
                    onClick={() => !plan.current && setPayModal(plan.id)}
                    disabled={plan.current}
                    className="w-full mt-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:cursor-default"
                    style={plan.current
                    ? { background: "#f0fdf4", color: "#0f766e", border: "1px solid #0f766e" }
                    : plan.highlight
                    ? { background: "#0f766e", color: "white" }
                    : { background: "white", color: "#374151", border: "1px solid #e5e7eb" }}
                >
                    {plan.current ? "Current Plan" : plan.cta}
                </button>
                </div>
            ))}
            </div>
        </div>

        {/* Historique paiements */}
        <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Historique des paiements</h3>
            <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
                Last 12 months ▾
            </button>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                    {["Invoice ID", "Date", "Description", "Amount", "Status", "Action"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {loading ? (
                    [...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b">
                        <td colSpan={6} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                    </tr>
                    ))
                ) : (sub?.invoices ?? []).length === 0 ? (
                    // Mock data si pas encore de vraies factures
                    [
                    { invoiceNumber: "#INV-2025-12", createdAt: "2025-12-20", description: "Enterprise Plan – December", amount: 499, status: "PAID" },
                    { invoiceNumber: "#INV-2025-11", createdAt: "2025-11-20", description: "Enterprise Plan – November", amount: 499, status: "PAID" },
                    { invoiceNumber: "#INV-2025-10", createdAt: "2025-10-20", description: "Enterprise Plan – October",  amount: 499, status: "PAID" },
                    { invoiceNumber: "#INV-2025-09", createdAt: "2025-09-20", description: "Professional Plan – September", amount: 299, status: "PAID" },
                    ].map((inv) => {
                    const st = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.PAID;
                    return (
                        <tr key={inv.invoiceNumber} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                            {new Date(inv.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                            })}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-600">{inv.description}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                            ${inv.amount}
                        </td>
                        <td className="px-5 py-3">
                            <span className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{ color: st.color, background: st.color + "18" }}>
                            {st.label}
                            </span>
                        </td>
                        <td className="px-5 py-3">
                            <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                            <Download size={13} /> Download
                            </button>
                        </td>
                        </tr>
                    );
                    })
                ) : (
                    (sub?.invoices ?? []).map((inv) => {
                    const st = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.PAID;
                    return (
                        <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                            {new Date(inv.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-600">{inv.description}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">${inv.amount}</td>
                        <td className="px-5 py-3">
                            <span className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{ color: st.color, background: st.color + "18" }}>
                            {st.label}
                            </span>
                        </td>
                        <td className="px-5 py-3">
                            <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                            <Download size={13} /> Download
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

        {/* ── Modal Paiement ── */}
        {payModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex justify-between items-center mb-5">
                <div>
                    <h3 className="font-bold text-gray-900">Choisir un mode de paiement</h3>
                    <p className="text-xs text-gray-500">Plan : {payModal}</p>
                </div>
                <button onClick={() => setPayModal(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
                </div>

                {/* Sélection méthode */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                    { id: "card" as const,     label: "Carte",    icon: "💳" },
                    { id: "kkiapay" as const,  label: "KkiaPay",  icon: "🌍" },
                    { id: "fedapay" as const,  label: "FedaPay",  icon: "🔵" },
                ].map((m) => (
                    <button key={m.id}
                    onClick={() => setPayMethod(m.id)}
                    className="flex flex-col items-center gap-1 p-3 border-2 rounded-xl text-xs font-medium transition-all"
                    style={payMethod === m.id
                        ? { borderColor: "#0f766e", background: "#f0fdf4", color: "#0f766e" }
                        : { borderColor: "#e5e7eb", color: "#6b7280" }}
                    >
                    <span className="text-xl">{m.icon}</span>
                    {m.label}
                    </button>
                ))}
                </div>

                {/* Formulaire carte */}
                {payMethod === "card" && (
                <div className="space-y-3 mb-5">
                    <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Numéro de carte
                    </label>
                    <input
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCard(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono outline-none"
                    />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                        Date d&#39;expiration
                        </label>
                        <input
                        value={expiry}
                        onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                        }}
                        placeholder="MM/YY"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono outline-none"
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
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono outline-none pr-9"
                        />
                        <button type="button"
                            onClick={() => setShowCvv(!showCvv)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {showCvv
                            ? <EyeOff size={14} />
                            : <Eye size={14} />}
                        </button>
                        </div>
                    </div>
                    </div>
                </div>
                )}

                {/* KkiaPay info */}
                {payMethod === "kkiapay" && (
                <div className="mb-5 p-4 rounded-xl text-sm text-center"
                    style={{ background: "#f0fdf4" }}>
                    <p className="text-2xl mb-2">🌍</p>
                    <p className="font-medium text-gray-900">Payer via KkiaPay</p>
                    <p className="text-xs text-gray-500 mt-1">
                    Vous serez redirigé vers le widget KkiaPay pour compléter votre paiement
                    par Mobile Money (MTN, Moov, Wave, etc.)
                    </p>
                </div>
                )}

                {/* FedaPay info */}
                {payMethod === "fedapay" && (
                <div className="mb-5 p-4 rounded-xl text-sm text-center"
                    style={{ background: "#eff6ff" }}>
                    <p className="text-2xl mb-2">🔵</p>
                    <p className="font-medium text-gray-900">Payer via FedaPay</p>
                    <p className="text-xs text-gray-500 mt-1">
                    Vous serez redirigé vers FedaPay pour payer par carte ou Mobile Money
                    </p>
                </div>
                )}

                <button
                onClick={handlePay}
                disabled={paying}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                style={{ background: "#0f766e" }}
                >
                {paying && <Loader2 size={15} className="animate-spin" />}
                {payMethod === "kkiapay" ? "Lancer KkiaPay"
                    : payMethod === "fedapay" ? "Continuer vers FedaPay"
                    : "Payer maintenant"}
                </button>
            </div>
            </div>
        )}
        </div>
    );
}