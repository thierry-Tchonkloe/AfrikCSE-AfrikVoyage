// /src/components/infos-pages/PricingSection.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Check, 
  X, 
  Rocket, 
  Building2, 
  Landmark,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Users,
  CreditCard,
  Crown,
  Star,
  Gift,
  Plane,
  Hotel,
  Smartphone,
  Clock
} from "lucide-react";
import { fadeInUp, scaleIn, staggerContainer } from "../styles/animations";

// Types
interface PricingPlan {
  id: number;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant: "primary" | "outline" | "secondary";
  popular?: boolean;
  icon: React.ReactNode;
  savings?: string;
  badge?: string;
  highlight?: boolean;
}

interface ComparisonItem {
  criterion: string;
  old: string;
  new: string;
  status: "good" | "bad" | "better";
  icon?: React.ReactNode;
}

// Données enrichies
const PRICING_PLANS: PricingPlan[] = [
  {
    id: 1,
    name: "Startup",
    price: "49€",
    period: "/mois",
    description: "Parfait pour les PME en croissance",
    features: [
      "Jusqu'à 25 utilisateurs",
      "Réservations voyages illimitées",
      "Gestion des notes de frais basique",
      "Support email 5j/7",
      "Dashboard analytics",
      "Catalogue CSE essentiel"
    ],
    buttonText: "Démarrer l'essai",
    buttonVariant: "outline",
    icon: <Rocket className="w-6 h-6" />,
    savings: "Économisez 30%",
    badge: "Idéal pour démarrer"
  },
  {
    id: 2,
    name: "Business",
    price: "99€",
    period: "/mois",
    description: "La solution complète pour les ETI",
    features: [
      "Jusqu'à 150 utilisateurs",
      "Toutes les fonctionnalités voyage",
      "IA predictive + reporting avancé",
      "Support prioritaire 7j/7",
      "Intégrations ERP natives",
      "Gestion CSE complète",
      "API personnalisable"
    ],
    buttonText: "Commencer maintenant",
    buttonVariant: "primary",
    popular: true,
    icon: <Building2 className="w-6 h-6" />,
    savings: "Économisez 45%",
    badge: "⭐ Recommandé",
    highlight: true
  },
  {
    id: 3,
    name: "Enterprise",
    price: "Sur mesure",
    period: "",
    description: "Pour les grands groupes",
    features: [
      "Utilisateurs illimités",
      "API dédiée et personnalisation",
      "SLA garantie 99.9%",
      "Account manager dédié",
      "Formation sur site",
      "Audit et optimisation RSE",
      "Solutions sur mesure"
    ],
    buttonText: "Nous contacter",
    buttonVariant: "secondary",
    icon: <Landmark className="w-6 h-6" />,
    savings: "Sur devis",
    badge: "🏢 Entreprise"
  }
];

const COMPARISONS: ComparisonItem[] = [
  {
    criterion: "Gestion des reçus & frais",
    old: "Notes de frais papier perdues, saisie manuelle interminable",
    new: "Scan IA instantané, rapprochement automatique en 2s",
    status: "good",
    icon: <Zap className="w-4 h-4" />
  },
  {
    criterion: "Validation des dépenses",
    old: "Chaîne d'e-mails interminable, blocages opérationnels",
    new: "Workflows dynamiques et alertes Slack/WhatsApp",
    status: "good",
    icon: <Users className="w-4 h-4" />
  },
  {
    criterion: "Réservation de voyages",
    old: "Salariés avancent les frais sur des sites grand public",
    new: "Inventaire centralisé sans avance de frais",
    status: "good",
    icon: <Plane className="w-4 h-4" />
  },
  {
    criterion: "Avantages & Crédits CSE",
    old: "Chèques cadeaux physiques périmés",
    new: "Compte unique digitalisé utilisable instantanément",
    status: "better",
    icon: <Gift className="w-4 h-4" />
  },
  {
    criterion: "Suivi carbone & RSE",
    old: "Aucun suivi de l'impact environnemental",
    new: "Budget carbone intégré et visualisation CO₂",
    status: "good",
    icon: <Shield className="w-4 h-4" />
  },
  {
    criterion: "Gestion des imprévus",
    old: "Stress et gestion manuelle, heures perdues",
    new: "IA prédictive reprogramme automatiquement",
    status: "better",
    icon: <Clock className="w-4 h-4" />
  }
];

// Composant pour les cartes de prix
const PricingCard = ({ plan, index }: { plan: PricingPlan; index: number }) => {
  const getButtonStyles = () => {
    const baseStyles = "block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-[0.97]";
    
    switch(plan.buttonVariant) {
      case "primary":
        return `${baseStyles} bg-gradient-to-r from-indigo-600 to-emerald-500 text-white shadow-lg shadow-indigo-200/50 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-200/70`;
      case "secondary":
        return `${baseStyles} bg-slate-800 text-white hover:bg-slate-700 hover:scale-[1.02] shadow-lg shadow-slate-200/50`;
      case "outline":
        return `${baseStyles} border-2 border-slate-300 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 hover:scale-[1.02]`;
      default:
        return baseStyles;
    }
  };

  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-3xl border p-8 transition-all duration-300 flex flex-col h-full ${
        plan.popular 
          ? "border-indigo-300 bg-gradient-to-b from-indigo-50/80 via-white to-white shadow-2xl scale-[1.02] md:scale-[1.05]" 
          : "border-slate-200 bg-white hover:border-indigo-200 hover:shadow-xl"
      }`}
    >
      {/* Badge populaire */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg shadow-indigo-200/50 z-10 whitespace-nowrap">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            {plan.badge || "Le plus populaire"}
          </span>
        </div>
      )}

      {/* Badge secondaire */}
      {plan.badge && !plan.popular && (
        <div className="absolute -top-2 right-4 bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full z-10">
          {plan.badge}
        </div>
      )}

      {/* En-tête de la carte */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
            plan.popular ? "from-indigo-500 to-blue-600" : "from-slate-200 to-slate-300"
          } flex items-center justify-center text-white shadow-lg shrink-0`}>
            {plan.icon}
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 leading-tight">{plan.name}</h3>
            {plan.savings && (
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                {plan.savings}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Prix */}
      <div className="mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-indigo-600">
            {plan.price}
          </span>
          {plan.period && (
            <span className="text-slate-400 text-sm font-medium">{plan.period}</span>
          )}
        </div>
        <p className="text-slate-500 text-sm mt-1">{plan.description}</p>
      </div>

      {/* Séparateur */}
      <div className="h-px bg-slate-200 my-4" />

      {/* Caractéristiques */}
      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Bouton - Aligné en bas */}
      <div className="mt-auto pt-2">
        <Link
          href="#"
          className={getButtonStyles()}
        >
          {plan.buttonText}
          <ArrowRight className="inline-block w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
        </Link>
        
        {/* Petit texte sous le bouton */}
        {plan.popular && (
          <p className="text-center text-[10px] text-slate-400 mt-2.5">
            ✅ Essai gratuit de 14 jours inclus
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [activeComparison, setActiveComparison] = useState<number | null>(null);

  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
      {/* Fond décoratif */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-100/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-100/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* En-tête */}
        <motion.div 
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-600 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.15em] mb-4">
            <Zap className="w-4 h-4" />
            Tarifs flexibles
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-[rgb(21,0,44)] tracking-tight mb-4 leading-[1.1]">
            Des offres
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">
              transparentes
            </span>
          </h2>
          <p className="text-slate-500 text-lg font-medium">
            Choisissez le plan adapté à votre structure. Sans engagement, évolutif à tout moment.
          </p>

          {/* Toggle cycle de facturation */}
          <div className="mt-8 inline-flex items-center gap-2 bg-slate-100 p-1 rounded-full shadow-inner">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                billingCycle === "monthly" 
                  ? "bg-white shadow-md text-slate-900" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 relative ${
                billingCycle === "annual" 
                  ? "bg-white shadow-md text-slate-900" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Annuel
              <span className="absolute -top-1.5 -right-1.5 text-[8px] font-black text-white bg-gradient-to-r from-indigo-600 to-emerald-500 px-1.5 py-0.5 rounded-full shadow-sm">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plans - Grid avec alignement parfait */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-20 items-stretch"
        >
          {PRICING_PLANS.map((plan, idx) => (
            <PricingCard key={plan.id} plan={plan} index={idx} />
          ))}
        </motion.div>

        {/* Tableau comparatif amélioré */}
        <motion.div 
          variants={fadeInUp}
          className="relative mt-12"
        >
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full">
              <Shield className="w-4 h-4" />
              Comparaison
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-[rgb(21,0,44)] mt-4">
              Pourquoi les leaders <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">changent de méthode</span>
            </h3>
            <p className="text-slate-500 text-sm mt-2">
              Découvrez les avantages de notre solution face aux méthodes traditionnelles
            </p>
          </div>

          <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/50 bg-white">
            {/* Header avec dégradé amélioré */}
            <div className="grid grid-cols-1 md:grid-cols-3 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white p-5 text-sm font-bold border-b border-slate-800">
              <div className="hidden md:block flex items-center gap-2">
                <span className="text-indigo-400">📊</span>
                CRITÈRE
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2">
                <span className="text-amber-400 text-lg">✕</span>
                <span className="opacity-80">MÉTHODES ANCIENNES</span>
              </div>
              <div className="flex items-center gap-3 bg-emerald-500/10 rounded-xl px-4 py-2 border border-emerald-400/20">
                <span className="text-emerald-400 text-lg">✓</span>
                <span className="flex items-center gap-2 text-emerald-300">
                  SOLUTION AFRIK
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </span>
              </div>
            </div>

            {/* Corps */}
            <div className="divide-y divide-slate-100">
              {COMPARISONS.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  whileHover={{ 
                    backgroundColor: "rgba(99,102,241,0.04)",
                    transition: { duration: 0.1 }
                  }}
                  className="grid grid-cols-1 md:grid-cols-3 p-5 md:p-6 gap-4 text-sm cursor-pointer"
                  onClick={() => setActiveComparison(activeComparison === idx ? null : idx)}
                >
                  {/* Critère */}
                  <div className="font-bold text-slate-800 text-base md:text-sm flex items-center gap-2">
                    <span className="text-indigo-500">{item.icon}</span>
                    {item.criterion}
                    {activeComparison === idx && (
                      <span className="text-[9px] text-indigo-500 font-normal bg-indigo-50 px-2 py-0.5 rounded-full">
                        détail
                      </span>
                    )}
                  </div>
                  
                  {/* Avant */}
                  <div className="text-slate-400 font-medium flex items-start gap-2.5 bg-amber-50/50 rounded-xl p-3.5 border border-amber-100/30">
                    <span className="text-amber-500 text-lg leading-none shrink-0">✕</span>
                    <span className="line-through decoration-amber-400/50">{item.old}</span>
                  </div>
                  
                  {/* Maintenant */}
                  <div className={`text-slate-700 font-semibold p-3.5 rounded-xl flex items-start gap-2.5 shadow-sm transition-all duration-300 ${
                    item.status === "better"
                      ? "bg-emerald-100/40 border-2 border-emerald-400/60"
                      : "bg-emerald-50/50 border border-emerald-100"
                  }`}>
                    <span className="text-emerald-500 text-lg leading-none shrink-0">✓</span>
                    <span>{item.new}</span>
                    {item.status === "better" && (
                      <span className="ml-auto flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                        <Sparkles className="w-3 h-3" /> IA
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Des résultats mesurables et concrets pour votre entreprise
              </p>
            </div>
          </div>
        </motion.div>

        {/* Section de confiance */}
        <motion.div 
          variants={fadeInUp}
          className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-slate-500"
        >
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <Users className="w-4 h-4 text-indigo-500" />
            <span>500+ entreprises clientes</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Garantie 100% satisfait</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <CreditCard className="w-4 h-4 text-purple-500" />
            <span>Paiement sécurisé</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Support 24/7 inclus</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}