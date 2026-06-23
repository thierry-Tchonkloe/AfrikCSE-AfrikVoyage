"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useAnimation, useInView } from "framer-motion";
import { plansService, PublicPlan } from "@/services/admin/plans.service";
import {
    Rocket, Building2, Landmark, Check, ChevronDown,
    DollarSign, Lock, Smartphone, ShieldCheck, Leaf, Trophy
} from "lucide-react";

// Types
interface PlanDetails {
    id: number;
    name: string;
    label: string;
    price: string;
    period: string;
    maxUsers?: number;
    features: string[];
    hasVoyage: boolean;
    hasCSE: boolean;
    popular?: boolean;
    icon: string;
    color: string;
    buttonText: string;
    buttonVariant: "outline" | "primary";
}

interface FAQItem {
    question: string;
    answer: string;
}

// ─── DONNÉES DES TARIFS HARMONISÉES AVEC LA PAGE D'ACCUEIL ──────────────────

const PLANS_DATA: PlanDetails[] = [
    {
        id: 1,
        name: "Startup",
        label: "Startup",
        price: "..",
        period: "/mois",
        maxUsers: 25,
        features: [
            "Jusqu'à 25 utilisateurs",
            "Réservations voyages illimitées",
            "Gestion des notes de frais basique",
            "Support email 5j/7",
            "Dashboard analytics"
        ],
        hasVoyage: true,
        hasCSE: false,
        icon: "rocket",
        color: "indigo",
        buttonText: "Commencer",
        buttonVariant: "outline"
    },
    {
        id: 2,
        name: "Business",
        label: "Business",
        price: "..",
        period: "/mois",
        maxUsers: 150,
        features: [
            "Jusqu'à 150 utilisateurs",
            "Toutes les fonctionnalités voyage",
            "IA predictive + reporting avancé",
            "Support prioritaire 7j/7",
            "Intégrations ERP natives",
            "Gestion CSE complète"
        ],
        hasVoyage: true,
        hasCSE: true,
        popular: true,
        icon: "building",
        color: "emerald",
        buttonText: "Commencer",
        buttonVariant: "primary"
    },
    {
        id: 3,
        name: "Enterprise",
        label: "Enterprise",
        price: "Sur mesure",
        period: "",
        maxUsers: undefined,
        features: [
            "Utilisateurs illimités",
            "API dédiée et personnalisation",
            "SLA garantie 99.9%",
            "Account manager dédié",
            "Formation sur site",
            "Audit et optimisation RSE"
        ],
        hasVoyage: true,
        hasCSE: true,
        icon: "landmark",
        color: "purple",
        buttonText: "Nous contacter",
        buttonVariant: "outline"
    }
];

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

const PARTNERS = [
    { name: "Orange", logo: "OR", color: "orange" },
    { name: "TotalEnergies", logo: "TT", color: "blue" },
    { name: "Ecobank", logo: "EC", color: "green" },
    { name: "Air France", logo: "AF", color: "blue" },
    { name: "Booking.com", logo: "BK", color: "blue" },
    { name: "SNCF", logo: "SN", color: "red" }
];

const CERTIFICATIONS = [
    { name: "SOC 2 Type II", Icon: ShieldCheck, description: "Sécurité des données" },
    { name: "ISO 27001", Icon: Check, description: "Management de la sécurité" },
    { name: "RGPD", Icon: Lock, description: "Conformité européenne" },
    { name: "EcoVadis", Icon: Leaf, description: "Performance RSE" }
];

// ─── COMPOSANTS INTERNES ───────────────────────────────────────────────────

function getPlanIcon(icon: string) {
    const cls = "w-6 h-6";
    if (icon === "rocket") return <Rocket className={cls} />;
    if (icon === "building") return <Building2 className={cls} />;
    return <Landmark className={cls} />;
}

function PlanCard({ plan, isAnnual }: { plan: PlanDetails; isAnnual: boolean }) {
    return (
        <div className={`relative rounded-2xl border p-6 flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
            plan.popular
                ? "border-indigo-300 bg-gradient-to-b from-white to-indigo-50/30 shadow-xl"
                : "border-slate-200 bg-white hover:border-indigo-200"
        }`}>
            {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md whitespace-nowrap">
                    Le plus populaire
                </div>
            )}

            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    {getPlanIcon(plan.icon)}
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
                                {isAnnual ? `${Math.floor(parseInt(plan.price) * 10.8)}€` : `${plan.price}€`}
                            </span>
                            <span className="text-sm text-slate-400">{plan.period}</span>
                        </div>
                        {isAnnual && (
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
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        {feature}
                    </li>
                ))}
            </ul>

            <Link
                href="/infos/contact"
                className={`block text-center rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 active:scale-[0.98] hover:scale-[1.02] ${
                    plan.buttonVariant === "primary"
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                        : "border-2 border-slate-300 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700"
                }`}
            >
                {plan.buttonText}
            </Link>
        </div>
    );
}

function FAQItemComponent({ faq, isOpen, onClick }: { faq: FAQItem; isOpen: boolean; onClick: () => void }) {
    return (
        <div className={`border rounded-2xl overflow-hidden bg-white transition-all duration-200 shadow-sm hover:shadow-md ${isOpen ? "border-indigo-200" : "border-slate-200 hover:border-slate-300"}`}>
            <button
                onClick={onClick}
                className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-slate-800 hover:bg-slate-50/80 transition-colors"
            >
                <span>{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ml-4 shrink-0 ${isOpen ? "rotate-180 text-indigo-500" : ""}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "max-h-48 border-t border-slate-100" : "max-h-0"}`}>
                <div className="px-6 py-4 text-sm leading-relaxed text-slate-600">
                    {faq.answer}
                </div>
            </div>
        </div>
    );
}

function PricingBlob({ color, position, size }: { color: string; position: string; size: string }) {
    return (
        <div 
            className={`absolute ${position} ${size} rounded-full opacity-60 blur-3xl pointer-events-none`}
            style={{ 
                background: color,
                filter: 'blur(80px)'
            }}
        />
    );
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────

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

    const filteredPlans = PLANS_DATA.filter(plan => {
        if (activeTab === "voyage") return plan.hasVoyage;
        if (activeTab === "cse") return plan.hasCSE;
        return true;
    });

    return (
        <main className="min-h-screen font-sans antialiased bg-white text-slate-900">
            
            {/* ── HERO SECTION AVEC EFFET ZOOM AU HOVER & OVERLAY FLUIDE ── */}
            <section className="relative border-b border-slate-100 py-24 lg:py-32 overflow-hidden group/hero">
                {/* Image de fond plein écran avec transition douce au survol de la section */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <Image
                        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=1080&fit=crop&q=80"
                        alt="Espaces d'affaires modernes et finance d'entreprise"
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover/hero:scale-[1.02]"
                        priority
                    />
                    {/* Multi-overlays riches pour préserver les contrastes du texte premium */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/70" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/30" />
                </div>

                {/* Blobs décoratifs Hero */}
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-200/40 blur-3xl pointer-events-none z-0" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none z-0" />
                
                <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
                        Tarification transparente
                    </span>
                    <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl leading-[1.1]">
                        Une plateforme qui{" "}
                        <span className="text-emerald-600">s'autofinance</span>
                        <br />
                        par vos économies
                    </h1>
                    <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto bg-white/70 backdrop-blur-sm px-6 py-3 rounded-2xl inline-block border border-slate-100/50 shadow-sm">
                        Investissez dans la performance. Nos clients constatent en moyenne
                        une réduction de <span className="font-bold text-emerald-600">-30%</span> de leurs coûts de voyage dès la première année.
                    </p>

                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Link
                            href="#pricing"
                            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
                        >
                            Voir les tarifs
                        </Link>
                        <Link
                            href="/infos/contact"
                            className="inline-flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border-2 border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                        >
                            Demander une démo
                        </Link>
                    </div>

                    {/* Sélecteur de solution */}
                    <div className="mt-10 flex justify-center gap-2 bg-white/90 backdrop-blur-sm p-1 rounded-xl max-w-md mx-auto border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === "all"
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            Pack Unifié
                        </button>
                        <button
                            onClick={() => setActiveTab("voyage")}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === "voyage"
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            AfrikVoyage
                        </button>
                        <button
                            onClick={() => setActiveTab("cse")}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === "cse"
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            AfrikCSE
                        </button>
                    </div>

                    {activeTab === "all" && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-emerald-100/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-emerald-200">
                            <Trophy className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-semibold text-emerald-700">Pack unifié : -15% sur l'ensemble</span>
                        </div>
                    )}
                </div>
            </section>

            {/* ── BANDE DE TRANSITION GRADIENT ── */}
            <div className="relative h-16 bg-gradient-to-b from-white via-indigo-50/30 to-slate-50/50" />
            
            {/* ── ZONE DE TRANSITION AVEC BLOCS ── */}
            <div className="relative bg-slate-50/50 py-2">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
                        <span className="w-12 h-px bg-gradient-to-r from-transparent to-slate-300" />
                        <span className="font-medium text-slate-500">Choisissez votre offre</span>
                        <span className="w-12 h-px bg-gradient-to-l from-transparent to-slate-300" />
                    </div>
                </div>
            </div>

            {/* ── GRILLE TARIFAIRE ── */}
            <section id="pricing" ref={ref} className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 overflow-hidden">
                <PricingBlob 
                    color="radial-gradient(circle at 30% 50%, rgba(99, 102, 241, 0.25), rgba(99, 102, 241, 0.05))"
                    position="top-10 left-10"
                    size="w-[500px] h-[500px]"
                />
                <PricingBlob 
                    color="radial-gradient(circle at 70% 80%, rgba(16, 185, 129, 0.20), rgba(16, 185, 129, 0.03))"
                    position="bottom-10 right-10"
                    size="w-[400px] h-[400px]"
                />
                <PricingBlob 
                    color="radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.02))"
                    position="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    size="w-[600px] h-[600px]"
                />

                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={containerVariants}
                    className="relative z-10"
                >
                    <motion.div variants={itemVariants} className="flex justify-center mb-8">
                        <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                            <button
                                onClick={() => setBillingCycle("monthly")}
                                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                    billingCycle === "monthly"
                                        ? "bg-indigo-600 text-white shadow-md"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                Mensuel
                            </button>
                            <button
                                onClick={() => setBillingCycle("yearly")}
                                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                    billingCycle === "yearly"
                                        ? "bg-indigo-600 text-white shadow-md"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                Annuel <span className="text-emerald-400 text-[10px]">-10%</span>
                            </button>
                        </div>
                    </motion.div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 relative z-10">
                        {filteredPlans.map((plan) => (
                            <motion.div 
                                key={plan.id} 
                                variants={itemVariants}
                                className="relative group"
                            >
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <PlanCard plan={plan} isAnnual={billingCycle === "yearly"} />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ── TRANSMARENCE TOTALE ── */}
            <section className="relative bg-gradient-to-b from-white to-slate-50/50 py-16 border-y border-slate-100 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-indigo-100/10 blur-3xl pointer-events-none" />
                
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-slate-800">Ce qui est <span className="text-indigo-600">toujours inclus</span></h2>
                        <p className="text-slate-500 mt-2">Aucun frais caché, aucune mauvaise surprise</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl p-6 text-center border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                                <DollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h3 className="font-bold text-slate-800 mb-1">Zéro commission</h3>
                            <p className="text-sm text-slate-500">Pas de frais cachés sur vos réservations</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 text-center border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                                <Lock className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h3 className="font-bold text-slate-800 mb-1">Conformité automatisée</h3>
                            <p className="text-sm text-slate-500">RGPD & régulations locales africaines</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 text-center border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                                <Smartphone className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="font-bold text-slate-800 mb-1">Application mobile</h3>
                            <p className="text-sm text-slate-500">Pour tous vos collaborateurs</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PREUVE SOCIALE ET CERTIFICATIONS ── */}
            <section className="py-16 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-indigo-50/50 blur-3xl pointer-events-none" />
                
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-black text-slate-800">Ils nous font confiance</h2>
                        <p className="text-slate-500">+500 entreprises africaines et internationales</p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-8 mb-12">
                        {PARTNERS.map((partner, i) => (
                            <div key={i} className="text-center group">
                                <div className="w-16 h-16 rounded-full bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center text-slate-600 group-hover:text-indigo-600 font-bold text-xl mx-auto transition-all duration-300">
                                    {partner.logo}
                                </div>
                                <span className="text-xs text-slate-500 mt-2 block group-hover:text-slate-700 transition-colors">{partner.name}</span>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                        {CERTIFICATIONS.map((cert, i) => (
                            <div key={i} className="text-center p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mx-auto mb-1.5">
                                    <cert.Icon className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="font-semibold text-slate-700 text-sm">{cert.name}</div>
                                <div className="text-xs text-slate-400">{cert.description}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-emerald-50 rounded-full px-5 py-2.5 border border-indigo-100">
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
            <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-t border-slate-100 relative overflow-hidden">
                <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-emerald-100/20 blur-3xl pointer-events-none" />
                
                <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-slate-800">Questions <span className="text-indigo-600">fréquentes</span></h2>
                        <p className="text-slate-500 mt-2">Tout ce qu'il faut savoir</p>
                    </div>
                    <div className="space-y-3">
                        {FAQ_ITEMS.map((faq, idx) => (
                            <FAQItemComponent
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