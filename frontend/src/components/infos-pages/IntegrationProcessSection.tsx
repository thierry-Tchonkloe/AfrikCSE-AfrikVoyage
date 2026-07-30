// /src/components/infos-pages/IntegrationProcessSection.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, 
  Link2, 
  Rocket, 
  TrendingUp,
  Check,
  Clock,
  Users,
  Database,
  Shield,
  Zap,
  Sparkles,
  ChevronRight,
  ArrowRight,
  CircleCheck,
  Building2,
  Smartphone
} from "lucide-react";
import { fadeInUp, scaleIn, slideInLeft, slideInRight } from "../styles/animations";

interface Step {
  num: string;
  title: string;
  description: string;
  tag: string;
  color: string;
  Icon: React.ReactNode;
  duration: string;
  details: string[];
  status?: "completed" | "in-progress" | "pending";
}

const steps: Step[] = [
  {
    num: "01",
    title: "Configuration Intelligente",
    description: "Analyse de votre politique voyage et paramétrage sur-mesure de votre espace de travail.",
    tag: "Setup Express",
    color: "from-teal-500 to-emerald-500",
    Icon: <Settings className="w-6 h-6" />,
    duration: "2-3 jours",
    status: "completed",
    details: [
      "Analyse des besoins et objectifs",
      "Configuration des politiques de voyage",
      "Paramétrage des plafonds budgétaires",
      "Définition des workflows de validation"
    ]
  },
  {
    num: "02",
    title: "Synchronisation ERP",
    description: "Connexion API sécurisée à vos outils pour une donnée unique et éviter la double saisie.",
    tag: "Intégration Native",
    color: "from-indigo-500 to-blue-600",
    Icon: <Link2 className="w-6 h-6" />,
    duration: "3-5 jours",
    status: "in-progress",
    details: [
      "Connexion à vos ERP (SAP, Odoo, Salesforce)",
      "Migration des données existantes",
      "Mise en place des webhooks",
      "Tests de synchronisation"
    ]
  },
  {
    num: "03",
    title: "Déploiement Accompagné",
    description: "Formation des administrateurs et activation de l'application mobile pour les voyageurs.",
    tag: "Onboarding",
    color: "from-purple-500 to-pink-600",
    Icon: <Rocket className="w-6 h-6" />,
    duration: "1-2 semaines",
    status: "pending",
    details: [
      "Formation des administrateurs",
      "Activation des comptes utilisateurs",
      "Déploiement de l'application mobile",
      "Support pendant le démarrage"
    ]
  },
  {
    num: "04",
    title: "Optimisation Continue",
    description: "Analyse des rapports de dépenses et ajustements stratégiques pour atteindre les -30% d'économies.",
    tag: "Santé Système",
    color: "from-amber-500 to-orange-600",
    Icon: <TrendingUp className="w-6 h-6" />,
    duration: "En continu",
    status: "pending",
    details: [
      "Analyse des rapports de dépenses",
      "Identification des axes d'optimisation",
      "Ajustements stratégiques",
      "Reporting mensuel personnalisé"
    ]
  }
];

export default function IntegrationProcessSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance des étapes
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Animation de la barre de progression
  useEffect(() => {
    setProgress(0);
    const timer = setTimeout(() => {
      setProgress(100);
    }, 100);
    return () => clearTimeout(timer);
  }, [activeStep]);

  const currentStep = steps[activeStep];

  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200 overflow-hidden">
      {/* Bande décorative d'arrière-plan */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-indigo-100/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-emerald-100/10 rounded-full blur-3xl" />
        
        {/* Bande diagonale décorative */}
        <div 
          className="absolute top-0 right-0 w-1/2 h-full opacity-5"
          style={{
            background: "linear-gradient(135deg, transparent 40%, rgba(99,102,241,0.1) 50%, transparent 60%)",
            transform: "skewX(-12deg)"
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* En-tête */}
        <motion.div 
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-600 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.15em] mb-4">
            <Zap className="w-4 h-4" />
            Processus d'intégration
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-[rgb(21,0,44)] tracking-tight mb-4 leading-[1.1]">
            Comment ça
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">
              fonctionne
            </span>
          </h2>
          <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
            Une intégration en 4 étapes clés pour une mise en place rapide et efficace
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Colonne gauche: Timeline interactive */}
          <motion.div 
            variants={slideInLeft}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
              {/* Timeline avec barre de progression */}
              <div className="relative">
                {/* Barre de progression verticale */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200">
                  <motion.div 
                    className="absolute top-0 left-0 w-full bg-gradient-to-b from-indigo-500 to-emerald-500"
                    style={{ 
                      height: `${((activeStep + 1) / steps.length) * 100}%`,
                      borderRadius: '2px'
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {/* Étapes */}
                {steps.map((step, idx) => {
                  const isActive = idx === activeStep;
                  const isCompleted = idx < activeStep;
                  
                  return (
                    <motion.button
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      className={`relative flex items-start gap-6 w-full text-left p-4 rounded-2xl transition-all duration-300 ${
                        isActive ? 'bg-indigo-50/50 border border-indigo-200 shadow-sm' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Cercle de statut */}
                      <div className="relative z-10">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                          ${isActive ? `bg-gradient-to-br ${step.color} shadow-lg` : 
                            isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}
                          transition-all duration-300
                          ${isActive ? 'scale-110' : ''}
                        `}>
                          {isCompleted ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            step.num
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className={`font-bold text-sm ${isActive ? 'text-indigo-600' : 'text-slate-700'}`}>
                            {step.title}
                          </h4>
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {step.duration}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {step.description}
                        </p>
                      </div>

                      {isActive && (
                        <motion.div
                          layoutId="active-indicator"
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-lg">
                <div className="text-2xl font-black text-indigo-600">-30%</div>
                <div className="text-xs font-medium text-slate-500">Économies</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-lg">
                <div className="text-2xl font-black text-emerald-600">2 sem.</div>
                <div className="text-xs font-medium text-slate-500">Mise en place</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-lg">
                <div className="text-2xl font-black text-purple-600">99.9%</div>
                <div className="text-xs font-medium text-slate-500">Disponibilité</div>
              </div>
            </div>
          </motion.div>

          {/* Colonne droite: Détails de l'étape active */}
          <motion.div 
            variants={slideInRight}
            className="relative"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 h-full"
              >
                {/* En-tête de l'étape */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentStep.color} flex items-center justify-center text-white shadow-lg`}>
                        {currentStep.Icon}
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-400 block">Étape {currentStep.num}</span>
                        <h3 className="text-2xl font-bold text-slate-800">{currentStep.title}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {currentStep.tag}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {currentStep.duration}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-slate-400">Progression</div>
                    <div className="text-sm font-black text-indigo-600">
                      {Math.round(((activeStep + 1) / steps.length) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {currentStep.description}
                </p>

                {/* Détails */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Étapes détaillées
                  </h4>
                  <ul className="space-y-2">
                    {currentStep.details.map((detail, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100"
                      >
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                          <CircleCheck className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <span className="text-sm text-slate-600">{detail}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Indicateur de progression */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Étape {activeStep + 1}/{steps.length}</span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>En cours</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Action button */}
                <button className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-600 to-emerald-500 text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-indigo-200/50 flex items-center justify-center gap-2">
                  En savoir plus
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}