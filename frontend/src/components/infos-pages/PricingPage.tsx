"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useAnimation, useInView } from "framer-motion";
import { plansService, PublicPlan } from "@/services/admin/plans.service";

// Types
interface PlanDetails {
    name: string;
    label: string;
    price: string;
    maxUsers?: number;
    features: string[];
    hasVoyage: boolean;
    hasCSE: boolean;
    popular?: boolean;
    icon: string;
    color: string;
}

interface FAQItem {
    question: string;
    answer: string;
}

// Données des plans enrichies
const PLANS_DATA: PlanDetails[] = [
    {
        name: "ESSENTIAL",
        label: "Essential",
        price: "49€",
        maxUsers: 50,
        features: [
            "Réservation centralisée (vols, hôtels, trains)",
            "Gestion des notes de frais basique",
            "Support email 5j/7",
            "Dashboard analytics"
        ],
        hasVoyage: true,
        hasCSE: false,
        icon: "🚀",
        color: "indigo"
    },
    {
        name: "PROFESSIONAL",
        label: "Professional",
        price: "99€",
        maxUsers: 250,
        features: [
            "Toutes les fonctionnalités Essential",
            "IA prédictive (moteur Sam)",
            "Budgets carbone & suivi RSE",
            "Workflows de validation avancés",
            "Intégrations API basiques"
        ],
        hasVoyage: true,
        hasCSE: true,
        popular: true,
        icon: "🏢",
        color: "emerald"
    },
    {
        name: "ENTERPRISE",
        label: "Enterprise",
        price: "Sur mesure",
        features: [
            "Toutes les fonctionnalités Professional",
            "Support dédié 24/7",
            "Intégrations ERP (SAP, Oracle, Odoo)",
            "SLA 99.9%",
            "Compliance SOC 2 & RGPD",
            "Account manager dédié"
        ],
        hasVoyage: true,
        hasCSE: true,
        icon: "🏛️",
        color: "purple"
    }
];

// FAQ
const FAQ_ITEMS: FAQItem[] = [
    {
        question: "Comment l'IA réduit-elle réellement mes coûts ?",
        answer: "Notre IA prédictive analyse vos historiques de voyages pour recommander les meilleurs tarifs et itinéraires. Elle bloque automatiquement les réservations hors politique budgétaire, réduisant les dépassements jusqu'à 34%."
    },
    {
        question: "Est-ce compatible avec mon logiciel comptable ?",
        answer: "Oui, notre API permet une intégration native avec les principaux ERP (SAP, Oracle, Odoo, Sage) et logiciels comptables. Les flux sont automatiques et sécurisés."
    },
    {
        question: "Quid du bien-être des voyageurs ?",
        answer: "Le bien-être voyageur est devenu un KPI central de notre plateforme. Nous suivons la satisfaction en temps réel, proposons des itinéraires optimisés, et une assistance 24/7 pour gérer les imprévus."
    },
    {
        question: "Quels sont les délais de mise en place ?",
        answer: "L'activation est possible en moins de 48h pour les fonctionnalités de base. L'intégration complète avec vos politiques voyage et ERP prend généralement 1 à 2 semaines."
    },
    {
        question: "Proposez-vous un essai gratuit ?",
        answer: "Oui, nous proposons un essai gratuit de 14 jours sans carte bancaire. Notre équipe vous accompagne pendant toute la période pour maximiser votre retour sur investissement."
    }
];

// Partenaires
const PARTNERS = [
    { name: "Orange", logo: "OR", color: "orange" },
    { name: "TotalEnergies", logo: "TT", color: "blue" },
    { name: "Ecobank", logo: "EC", color: "green" },
    { name: "Air France", logo: "AF", color: "blue" },
    { name: "Booking.com", logo: "BK", color: "blue" },
    { name: "SNCF", logo: "SN", color: "red" }
];

// Certifications
const CERTIFICATIONS = [
    { name: "SOC 2 Type II", icon: "🔒", description: "Sécurité des données" },
    { name: "ISO 27001", icon: "✓", description: "Management de la sécurité" },
    { name: "RGPD", icon: "🇪🇺", description: "Conformité européenne" },
    { name: "EcoVadis", icon: "🌱", description: "Performance RSE" }
];

// ─── COMPOSANTS ──────────────────────────────────────────────────────────────

// Calculateur de ROI
function ROICalculator() {
    const [annualBudget, setAnnualBudget] = useState(100000);
    const [employees, setEmployees] = useState(100);
    const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
    const [savingsPercentage, setSavingsPercentage] = useState(30);
    const [timeSavedHours, setTimeSavedHours] = useState(0);

    useEffect(() => {
        // Calcul dynamique des économies
        const avgHourlyRate = 35;
        const minutesPerExpense = 15;
        const expensesPerEmployeePerMonth = 3;
        const totalMinutes = employees * expensesPerEmployeePerMonth * minutesPerExpense;
        setTimeSavedHours(Math.floor(totalMinutes / 60));
    }, [employees]);

    const annualSavings = Math.floor(annualBudget * (savingsPercentage / 100));
    const monthlySavings = Math.floor(annualSavings / 12);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-800 mb-4">📊 Simulez vos économies</h3>
            
            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Budget voyage annuel
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
                        <input
                            type="range"
                            min={10000}
                            max={500000}
                            step={5000}
                            value={annualBudget}
                            onChange={(e) => setAnnualBudget(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between mt-2">
                            <span className="text-xs text-slate-400">10k€</span>
                            <span className="text-sm font-bold text-indigo-600">{annualBudget.toLocaleString()}€</span>
                            <span className="text-xs text-slate-400">500k€</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Nombre d'employés
                    </label>
                    <input
                        type="range"
                        min={10}
                        max={1000}
                        step={10}
                        value={employees}
                        onChange={(e) => setEmployees(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between mt-2">
                        <span className="text-xs text-slate-400">10</span>
                        <span className="text-sm font-bold text-indigo-600">{employees}</span>
                        <span className="text-xs text-slate-400">1000+</span>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Économies annuelles</p>
                            <p className="text-2xl font-black text-emerald-600">{annualSavings.toLocaleString()}€</p>
                            <p className="text-xs text-emerald-600">-{savingsPercentage}%</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Gain de productivité</p>
                            <p className="text-2xl font-black text-emerald-600">{timeSavedHours}h</p>
                            <p className="text-xs text-emerald-600">/mois économisées</p>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-emerald-100">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Mensualités à partir de</span>
                            <span className="text-lg font-bold text-indigo-600">{Math.floor(monthlySavings / 3)}€</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <div className="w-[30%] h-full bg-emerald-500 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Plan Card
function PlanCard({ plan, isAnnual }: { plan: PlanDetails; isAnnual: boolean }) {
    const annualPrice = plan.price !== "Sur mesure" ? Math.floor(parseInt(plan.price) * 10.8) : "Sur mesure";
    
    return (
        <div className={`relative rounded-2xl border p-6 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
            plan.popular
                ? "border-indigo-300 bg-gradient-to-b from-white to-indigo-50/30 shadow-xl scale-[1.02]"
                : "border-slate-200 bg-white hover:border-indigo-200"
        }`}>
            {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md whitespace-nowrap">
                    Le plus populaire
                </div>
            )}
            
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-emerald-100 flex items-center justify-center text-2xl">
                    {plan.icon}
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-800">{plan.label}</h3>
                    {plan.maxUsers && (
                        <p className="text-xs text-slate-400">Jusqu'à {plan.maxUsers} utilisateurs</p>
                    )}
                </div>
            </div>

            <div className="mb-4">
                {plan.price !== "Sur mesure" ? (
                    <>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-indigo-600">
                                {isAnnual && plan.price !== "Sur mesure" ? `${Math.floor(parseInt(plan.price) * 10.8)}€` : plan.price}
                            </span>
                            <span className="text-sm text-slate-400">/mois</span>
                        </div>
                        {isAnnual && plan.price !== "Sur mesure" && (
                            <p className="text-xs text-emerald-600 mt-1">+2 mois offerts</p>
                        )}
                    </>
                ) : (
                    <span className="text-xl font-black text-indigo-600">Sur mesure</span>
                )}
            </div>

            <ul className="space-y-3 flex-1 mb-6">
                {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        {feature}
                    </li>
                ))}
            </ul>

            <Link
                href="/infos/contact"
                className={`block text-center rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    plan.popular
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                        : "bg-slate-800 text-white hover:bg-slate-700"
                }`}
            >
                Demander une démo
            </Link>
        </div>
    );
}

// FAQ Accordion
function FAQItem({ faq, isOpen, onClick }: { faq: FAQItem; isOpen: boolean; onClick: () => void }) {
    return (
        <div className="border rounded-xl overflow-hidden bg-white transition-all duration-200 hover:border-indigo-200">
            <button
                onClick={onClick}
                className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50/80 transition-colors"
            >
                <span>{faq.question}</span>
                <span className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-indigo-500" : ""}`}>
                    ▾
                </span>
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "max-h-48 border-t border-slate-100" : "max-h-0"}`}>
                <div className="px-5 py-4 text-sm leading-relaxed text-slate-600">
                    {faq.answer}
                </div>
            </div>
        </div>
    );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────

export default function PricingPage() {
    const [plans, setPlans] = useState<PublicPlan[] | null>(null);
    const [error, setError] = useState(false);
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
    const [openFAQ, setOpenFAQ] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<"all" | "voyage" | "cse">("all");

    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    useEffect(() => {
        if (isInView) {
            controls.start("visible");
        }
    }, [isInView, controls]);

    useEffect(() => {
        plansService.getPublic()
            .then(setPlans)
            .catch(() => setError(true));
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1, duration: 0.5 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    // Filtrer les plans selon l'onglet actif
    const filteredPlans = PLANS_DATA.filter(plan => {
        if (activeTab === "voyage") return plan.hasVoyage;
        if (activeTab === "cse") return plan.hasCSE;
        return true;
    });

    return (
        <main className="min-h-screen font-sans antialiased bg-white text-slate-900">
            
            {/* ── HERO SECTION ── */}
            <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white py-20 lg:py-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                                Tarification transparente
                            </span>
                            <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl leading-[1.1]">
                                Une plateforme qui{" "}
                                <span className="text-emerald-600">s'autofinance</span>
                                <br />
                                par vos économies
                            </h1>
                            <p className="mt-4 text-lg text-slate-500 leading-relaxed">
                                Investissez dans la performance. Nos clients constatent en moyenne
                                une réduction de <span className="font-bold text-emerald-600">-30%</span> de leurs coûts de voyage dès la première année.
                            </p>

                            {/* Sélecteur de solution */}
                            <div className="mt-8 flex gap-2 bg-slate-100 p-1 rounded-xl max-w-xs">
                                <button
                                    onClick={() => setActiveTab("all")}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                                        activeTab === "all"
                                            ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    Pack Unifié
                                </button>
                                <button
                                    onClick={() => setActiveTab("voyage")}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                                        activeTab === "voyage"
                                            ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    AfrikVoyage
                                </button>
                                <button
                                    onClick={() => setActiveTab("cse")}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                                        activeTab === "cse"
                                            ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    AfrikCSE
                                </button>
                            </div>

                            {/* Badge de remise */}
                            {activeTab === "all" && (
                                <div className="mt-4 inline-flex items-center gap-2 bg-emerald-100 px-3 py-1.5 rounded-full">
                                    <span className="text-emerald-600 text-sm">✨</span>
                                    <span className="text-xs font-semibold text-emerald-700">Pack unifié : -15% sur l'ensemble</span>
                                </div>
                            )}
                        </div>

                        {/* Calculateur ROI */}
                        <ROICalculator />
                    </div>
                </div>
            </section>

            {/* ── GRILLE TARIFAIRE ── */}
            <section ref={ref} className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants} className="flex justify-end mb-6">
                        <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setBillingCycle("monthly")}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    billingCycle === "monthly"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                Mensuel
                            </button>
                            <button
                                onClick={() => setBillingCycle("yearly")}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    billingCycle === "yearly"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                Annuel <span className="text-emerald-600 text-[10px]">-10%</span>
                            </button>
                        </div>
                    </motion.div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredPlans.map((plan) => (
                            <motion.div key={plan.name} variants={itemVariants}>
                                <PlanCard plan={plan} isAnnual={billingCycle === "yearly"} />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ── TRANSPARENCE TOTALE ── */}
            <section className="bg-slate-50 py-16 border-y border-slate-100">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-slate-800">Ce qui est <span className="text-indigo-600">toujours inclus</span></h2>
                        <p className="text-slate-500 mt-2">Aucun frais caché, aucune mauvaise surprise</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl p-6 text-center border border-slate-200">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-xl mx-auto mb-3">
                                💰
                            </div>
                            <h3 className="font-bold text-slate-800 mb-1">Zéro commission</h3>
                            <p className="text-sm text-slate-500">Pas de frais cachés sur vos réservations</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 text-center border border-slate-200">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl mx-auto mb-3">
                                🔒
                            </div>
                            <h3 className="font-bold text-slate-800 mb-1">Conformité automatisée</h3>
                            <p className="text-sm text-slate-500">RGPD & régulations locales africaines</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 text-center border border-slate-200">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-xl mx-auto mb-3">
                                📱
                            </div>
                            <h3 className="font-bold text-slate-800 mb-1">Application mobile</h3>
                            <p className="text-sm text-slate-500">Pour tous vos collaborateurs</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PREUVE SOCIALE ET CERTIFICATIONS ── */}
            <section className="py-16 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-black text-slate-800">Ils nous font confiance</h2>
                        <p className="text-slate-500">+500 entreprises africaines et internationales</p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-8 mb-12">
                        {PARTNERS.map((partner, i) => (
                            <div key={i} className="text-center">
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl mx-auto">
                                    {partner.logo}
                                </div>
                                <span className="text-xs text-slate-500 mt-2 block">{partner.name}</span>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                        {CERTIFICATIONS.map((cert, i) => (
                            <div key={i} className="text-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="text-2xl mb-1">{cert.icon}</div>
                                <div className="font-semibold text-slate-700 text-sm">{cert.name}</div>
                                <div className="text-xs text-slate-400">{cert.description}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center gap-3 bg-indigo-50 rounded-full px-5 py-2.5">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                            </span>
                            <span className="text-sm font-semibold text-indigo-700">Assistance d'un expert 24/7</span>
                            <span className="text-xs text-indigo-500">— L'IA ne remplace pas l'humain</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="py-16 bg-slate-50 border-t border-slate-100">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-slate-800">Questions <span className="text-indigo-600">fréquentes</span></h2>
                        <p className="text-slate-500 mt-2">Tout ce qu'il faut savoir</p>
                    </div>
                    <div className="space-y-3">
                        {FAQ_ITEMS.map((faq, idx) => (
                            <FAQItem
                                key={idx}
                                faq={faq}
                                isOpen={openFAQ === idx}
                                onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            
        </main>
    );
}