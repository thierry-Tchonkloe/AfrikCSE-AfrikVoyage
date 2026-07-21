"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent, AnimatePresence, useInView, useAnimation } from "framer-motion";
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
} from "lucide-react";

// ─── 1. DONNÉES DU SCROLL DES AVANTAGES ───────────────────────────────────────
interface AdvantageStep {
  id: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
  title: string;
  subtitle: string;
  image: string;
  imagePosition: "left" | "right";
  benefits: {
    title: string;
    description: string;
    highlight?: boolean;
  }[];
}

const ADVANTAGES_STEPS: AdvantageStep[] = [
  {
    id: "global-2in1",
    badge: "Synergie 2-en-1",
    badgeBg: "bg-purple-100 border-purple-200 text-purple-700",
    badgeText: "Plateforme Unifiée",
    title: "Une seule plateforme pour vos CSE & Voyages d'Affaires",
    subtitle: "Dites adieu aux outils dispersés. Centralisez la gestion des avantages salariés et la réservation de vos déplacements professionnels sur une interface moderne et ultra-performante.",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
    imagePosition: "left",
    benefits: [
      {
        title: "Gain de temps massif pour la gestion",
        description: "Centralisez les demandes de vos salariés, qu'il s'agisse d'un chèque vacances ou d'une réservation de billet d'avion.",
        highlight: true,
      },
      {
        title: "Adoption collaborateurs maximale",
        description: "Un compte unique pour vos employés : un identifiant pour accéder à leurs réductions et réserver leurs missions pro.",
      },
      {
        title: "Saisie et comptabilité automatisées",
        description: "Exportation directe vers votre logiciel de paie et votre comptabilité sans aucune double saisie manuelle.",
      },
    ],
  },
  {
    id: "cse-advantages",
    badge: "Avantages CSE",
    badgeBg: "bg-blue-100 border-blue-200 text-blue-700",
    badgeText: "Espace Comité",
    title: "Maximisez le pouvoir d'achat de vos collaborateurs",
    subtitle: "Offrez un accès instantané à des milliers d'offres de loisirs et gérez vos subventions en toute conformité URSSAF.",
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80",
    imagePosition: "right",
    benefits: [
      {
        title: "Billetterie & Cartes Cadeaux 100% URSSAF",
        description: "Émission instantanée de titres cadeaux respectant scrupuleusement les événements réglementés.",
        highlight: true,
      },
      {
        title: "Subventions vacances & loisirs sur-mesure",
        description: "Définissez vos règles de prise en charge et attribuez automatiquement les recharges aux salariés.",
      },
      {
        title: "Accompagnement par des experts CSE",
        description: "Un conseiller dédié vous guide dans la mise en place et le suivi légal de vos activités sociales.",
      },
    ],
  },
  {
    id: "travel-advantages",
    badge: "Voyages d'Affaires",
    badgeBg: "bg-emerald-100 border-emerald-200 text-emerald-700",
    badgeText: "Corporate Travel",
    title: "Simplifiez vos déplacements professionnels d'entreprise",
    subtitle: "Gardez le contrôle sur la politique de voyage tout en offrant une liberté totale de réservation à vos équipes.",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80",
    imagePosition: "left",
    benefits: [
      {
        title: "Travel Policy & Plafonds Automatisés",
        description: "Les réservations hors barème sont bloquées ou soumises à validation RH instantanée.",
        highlight: true,
      },
      {
        title: "Tarifs Négociés & Zéro Avance de Frais",
        description: "Accédez aux meilleurs tarifs vols, trains et hôtels avec facturation directe à l'entreprise.",
      },
      {
        title: "Dématérialisation totale des reçus de frais",
        description: "Prenez en photo votre ticket de caisse : les données sont extraites par IA et transmises à la compta.",
      },
    ],
  },
];

// ─── 2. DONNÉES DES CHIFFRES CLÉS ─────────────────────────────────────────────
const STATS_CARDS = [
  {
    value: "+ 2 000",
    label: "marques partenaires",
    subtext: "Partout en Afrique & Europe",
    bg: "bg-slate-900 text-white",
    accentBg: "bg-blue-500",
    rotation: "sm:-rotate-2",
    shadow: "shadow-slate-900/10",
  },
  {
    value: "+ 500 000",
    label: "offres & réductions",
    subtext: "Loisirs, ciné, billets & hôtels",
    bg: "bg-blue-600 text-white",
    accentBg: "bg-white",
    rotation: "sm:rotate-2",
    shadow: "shadow-blue-500/20",
  },
  {
    value: "+ 1 200 €",
    label: "économie / salarié / an",
    subtext: "Pouvoir d'achat préservé",
    bg: "bg-amber-100 text-slate-900 border border-amber-200/80",
    accentBg: "bg-amber-500",
    rotation: "sm:-rotate-1",
    shadow: "shadow-amber-500/10",
  },
  {
    value: "- 80 %",
    label: "de temps de gestion",
    subtext: "Pour les RH & Élus CSE",
    bg: "bg-emerald-600 text-white",
    accentBg: "bg-emerald-300",
    rotation: "sm:rotate-3",
    shadow: "shadow-emerald-500/20",
  },
];

// ─── 3. DONNÉES PARTENAIRES POUR LE CAROUSEL ──────────────────────────────────
interface Partner {
  id: number;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  logoSvg: React.ReactNode;
  websiteUrl: string;
  linkedinUrl: string;
}

const PARTNERS: Partner[] = [
  {
    id: 1,
    name: "TechAfrik Solutions",
    city: "Cotonou",
    country: "Bénin",
    countryCode: "BJ",
    websiteUrl: "https://example.com",
    linkedinUrl: "https://linkedin.com",
    logoSvg: (
      <svg className="w-6 h-6 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 22h20L12 2zm0 3.99L19.53 19H4.47L12 5.99zM13 16h-2v2h2v-2zm0-6h-2v4h2v-4z" />
      </svg>
    )
  },
  {
    id: 2,
    name: "InnovCorp Global",
    city: "Dakar",
    country: "Sénégal",
    countryCode: "SN",
    websiteUrl: "https://example.com",
    linkedinUrl: "https://linkedin.com",
    logoSvg: (
      <svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
      </svg>
    )
  },
  {
    id: 3,
    name: "EcoTransit Africa",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    countryCode: "CI",
    websiteUrl: "https://example.com",
    linkedinUrl: "https://linkedin.com",
    logoSvg: (
      <svg className="w-6 h-6 text-cyan-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
    )
  },
  {
    id: 4,
    name: "Kamal Logistics",
    city: "Nairobi",
    country: "Kenya",
    countryCode: "KE",
    websiteUrl: "https://example.com",
    linkedinUrl: "https://linkedin.com",
    logoSvg: (
      <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
      </svg>
    )
  },
  {
    id: 5,
    name: "SonaBank Corp",
    city: "Lomé",
    country: "Togo",
    countryCode: "TG",
    websiteUrl: "https://example.com",
    linkedinUrl: "https://linkedin.com",
    logoSvg: (
      <svg className="w-6 h-6 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 18v2H3v-2h18zM12 2L2 7h20L12 2zM4 9v7h3V9H4zm5 0v7h3V9H9zm5 0v7h3V9h-3zm5 0v7h3V9h-3z" />
      </svg>
    )
  }
];

// ─── COMPOSANT CAROUSEL DES PARTENAIRES ───────────────────────────────────────
const PartnerCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % PARTNERS.length);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + PARTNERS.length) % PARTNERS.length);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0
    })
  };

  return (
    <div className="w-full pt-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block w-fit">
            Écosystème
          </span>
          <h3 className="text-slate-900 font-bold text-2xl md:text-3xl tracking-tight mt-2">
            Nos partenaires stratégiques
          </h3>
        </div>
        <div className="flex gap-2 self-end">
          <button
            onClick={prevSlide}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 shadow-sm cursor-pointer"
          >
            ←
          </button>
          <button
            onClick={nextSlide}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 shadow-sm cursor-pointer"
          >
            →
          </button>
        </div>
      </div>

      <motion.div
        key={activeIndex}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.4 }}
        className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-emerald-50 flex items-center justify-center shrink-0">
            {PARTNERS[activeIndex].logoSvg}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 text-xl">{PARTNERS[activeIndex].name}</h4>
            <p className="text-slate-500 text-sm mt-1">
              {PARTNERS[activeIndex].city}, {PARTNERS[activeIndex].country}
            </p>
          </div>
          <div className="flex gap-2 self-end sm:self-center">
            <Link href={PARTNERS[activeIndex].websiteUrl} target="_blank" className="p-2.5 rounded-xl bg-slate-100 hover:bg-indigo-100 transition-colors">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4-3-9s1.34-9 3-9" />
              </svg>
            </Link>
            <Link href={PARTNERS[activeIndex].linkedinUrl} target="_blank" className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-100 transition-colors">
              <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center justify-center gap-2 mt-6">
        {PARTNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (isAnimating) return;
              setIsAnimating(true);
              setDirection(i > activeIndex ? 1 : -1);
              setActiveIndex(i);
              setTimeout(() => setIsAnimating(false), 400);
            }}
            className={`transition-all duration-300 rounded-full cursor-pointer ${i === activeIndex ? 'w-6 h-1.5 bg-indigo-600' : 'w-1.5 h-1.5 bg-slate-300'}`}
          />
        ))}
      </div>
    </div>
  );
};

// ─── COMPOSANT PRINCIPAL GLOBAL ───────────────────────────────────────────────
export default function CompleteAdvantagesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const foundersRef = useRef<HTMLDivElement>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const isInViewFounders = useInView(foundersRef, { once: true, amount: 0.1 });
  const foundersControls = useAnimation();

  useEffect(() => {
    if (isInViewFounders) {
      foundersControls.start("visible");
    }
  }, [isInViewFounders, foundersControls]);

  // 1. Scroll Sticky Agrandie (h-[360vh] pour laisser plus d'espace au scroll)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.33) {
      setActiveStepIndex(0);
    } else if (latest >= 0.33 && latest < 0.66) {
      setActiveStepIndex(1);
    } else {
      setActiveStepIndex(2);
    }
  });

  const currentStep = ADVANTAGES_STEPS[activeStepIndex];

  const titleStyle = {
    fontFamily: "Sanomat, ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
    fontStyle: "normal",
    fontWeight: 600,
    color: "rgb(21, 0, 44)",
    fontSize: "45px",
    lineHeight: "54px"
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        duration: 0.6
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.7
      }
    }
  };

  return (
    <div className="w-full bg-[#F8FAFC] text-slate-900">
      
      {/* ────────────────────────────────────────────────────────────────────────
          PARTIE 1 : STICKY SCROLL DES AVANTAGES (SECTIONS AGRANDIES)
      ──────────────────────────────────────────────────────────────────────── */}
      <section ref={containerRef} className="relative h-[360vh] w-full">
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden py-6 sm:py-10">
          
          {/* Halos de fond dynamique */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-10 w-[650px] h-[650px] bg-purple-200/30 blur-[150px] rounded-full transition-all duration-700" />
            <div className="absolute bottom-1/4 right-10 w-[650px] h-[650px] bg-emerald-200/30 blur-[150px] rounded-full transition-all duration-700" />
          </div>

          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 w-full relative z-10">
            
            {/* Barre d'indicateurs de progression du Scroll */}
            <div className="mb-8 flex items-center justify-center gap-3">
              {ADVANTAGES_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`flex items-center gap-2.5 px-5 py-2 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-300 cursor-pointer ${
                    activeStepIndex === idx
                      ? "bg-slate-900 text-white shadow-xl scale-105"
                      : "bg-white/80 backdrop-blur-md text-slate-600 border border-slate-200/80 hover:bg-slate-100"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    idx === 0 ? "bg-purple-500" : idx === 1 ? "bg-blue-500" : "bg-emerald-500"
                  }`} />
                  {step.badgeText}
                </button>
              ))}
            </div>

            {/* Structure Agrandie : 12 Colonnes plus spacieuses */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              
              {/* CÔTÉ A : IMAGE AGRANDIE */}
              <div className={`lg:col-span-6 transition-all duration-700 ${
                currentStep.imagePosition === "right" ? "lg:order-2" : "lg:order-1"
              }`}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep.id}
                    initial={{ opacity: 0, scale: 0.9, rotate: currentStep.imagePosition === "left" ? -4 : 4 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.95, rotate: currentStep.imagePosition === "left" ? 4 : -4 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="relative w-full h-[400px] sm:h-[520px] lg:h-[580px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-slate-100 group"
                  >
                    <Image
                      src={currentStep.image}
                      alt={currentStep.title}
                      fill
                      priority
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />

                    {/* Overlay bas de carte */}
                    <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl bg-white/95 backdrop-blur-md border border-white/50 shadow-xl">
                      <p className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest">
                        {currentStep.badgeText}
                      </p>
                      <p className="text-base sm:text-lg font-black text-slate-900 mt-1">
                        {currentStep.title}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* CÔTÉ B : TEXTE & AVANTAGES DÉTAILLÉS */}
              <div className={`lg:col-span-6 transition-all duration-700 ${
                currentStep.imagePosition === "right" ? "lg:order-1" : "lg:order-2"
              }`}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep.id}
                    initial={{ opacity: 0, x: currentStep.imagePosition === "left" ? 40 : -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: currentStep.imagePosition === "left" ? -40 : 40 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="space-y-6"
                  >
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black border ${currentStep.badgeBg}`}>
                      <Sparkles size={14} />
                      {currentStep.badge}
                    </span>

                    <div>
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        {currentStep.title}
                      </h2>
                      <p className="text-slate-600 text-base sm:text-lg mt-4 leading-relaxed font-medium">
                        {currentStep.subtitle}
                      </p>
                    </div>

                    <div className="space-y-4 pt-2">
                      {currentStep.benefits.map((benefit, bIdx) => (
                        <div
                          key={bIdx}
                          className={`p-5 rounded-2xl transition-all duration-300 border ${
                            benefit.highlight
                              ? "bg-white border-slate-200/90 shadow-lg shadow-slate-200/60"
                              : "bg-white/60 border-slate-200/50 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                              <CheckCircle2 size={18} />
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-slate-900">
                                {benefit.title}
                              </h4>
                              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                                {benefit.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          PARTIE 2 : SECTION DES CARTES DE CHIFFRES CLÉS
      ──────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-24 bg-white border-t border-slate-200/80 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[350px] bg-gradient-to-r from-blue-100 via-indigo-50 to-emerald-100 blur-[130px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full">
              Impact Mesurable
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Notre plateforme en quelques chiffres
            </h3>
            <p className="text-slate-600 text-sm sm:text-base">
              Des résultats concrets observés auprès de plus de 500 entreprises partenaires.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {STATS_CARDS.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`group relative p-8 rounded-3xl transition-all duration-500 transform ${stat.rotation} hover:rotate-0 hover:scale-105 ${stat.bg} ${stat.shadow} hover:shadow-2xl flex flex-col justify-between h-56 cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <span className={`w-3 h-3 rounded-full ${stat.accentBg}`} />
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-70">
                    #Impact 0{idx + 1}
                  </span>
                </div>

                <div>
                  <p className="text-3xl sm:text-4xl font-black tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-sm font-bold mt-1 opacity-90 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>

                <div className="border-t border-current/15 pt-3">
                  <p className="text-xs opacity-75 font-medium">
                    {stat.subtext}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center pt-6">
            <Link
              href="/demo"
              className="inline-flex items-center gap-3 bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 cursor-pointer"
            >
              Rejoindre nos partenaires
              <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          PARTIE 3 : SECTION DES RESPONSABLES / FONDATEURS & PARTENAIRES
      ──────────────────────────────────────────────────────────────────────── */}
      <section 
        ref={foundersRef}
        className="w-full bg-[#F9FAFB] py-24 overflow-hidden border-t border-slate-200/60 relative"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[length:14px_24px] pointer-events-none" />
        
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-50/40 blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-50/40 blur-[100px]" />
        </div>

        <motion.div
          initial="hidden"
          animate={foundersControls}
          variants={containerVariants}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-20"
        >
          {/* MANIFESTE ET FONDATEURS */}
          <div className="space-y-16">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full inline-block">
                Notre manifeste
              </span>
              <h3 style={titleStyle} className="mt-4 tracking-tight hidden sm:block">
                Pourquoi avoir créé cette solution ?
              </h3>
              <h3 style={{ ...titleStyle, fontSize: "32px", lineHeight: "40px" }} className="mt-4 tracking-tight sm:hidden">
                Pourquoi avoir créé cette solution ?
              </h3>
              <p className="text-slate-500 mt-4 text-base sm:text-lg font-medium max-w-2xl mx-auto">
                L'histoire derrière la convergence unique d'AfrikVoyage et AfrikCSE racontée par ses concepteurs.
              </p>
            </div>

            {/* CARTES DE FONDATEURS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              
              {/* Carte Richnel AGAZOUNON */}
              <motion.div variants={cardVariants} className="flex">
                <div className="gradient-border-card relative p-0.5 rounded-[2.5rem] flex flex-col w-full transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 group">
                  <div className="h-full bg-white rounded-[2.40rem] p-8 sm:p-10 flex flex-col justify-between overflow-hidden relative z-10">
                    <div>
                      <div className="flex items-center justify-between w-full flex-wrap gap-2">
                        <span className="text-[10px] font-black text-slate-800 tracking-widest uppercase bg-slate-100 px-3 py-1.5 rounded-lg">
                          Fondateur & CEO
                        </span>
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Focus AfrikVoyage
                        </span>
                      </div>
                      
                      <p className="text-slate-700 font-medium text-base sm:text-lg leading-relaxed italic mt-8 relative pl-4 border-l-2 border-indigo-500">
                        "Nous avons constaté que les entreprises africaines perdaient une énergie folle à synchroniser les déplacements terrains et la satisfaction des collaborateurs. Centraliser les dépenses de voyage et les avantages sociaux sur une interface unique était la seule réponse logique pour catalyser la croissance."
                      </p>
                    </div>

                    <div className="flex items-end justify-between gap-4 mt-12 border-t border-slate-100 pt-6 flex-wrap">
                      <div className="flex items-center gap-4">
                        <div className="relative w-18 h-18 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                          <img 
                            src="/images/richnel.png"
                            alt="Richnel AGAZOUNON"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <h4 style={{ fontFamily: "Sanomat, ui-serif" }} className="text-slate-900 font-bold text-lg tracking-tight">
                            Richnel AGAZOUNON
                          </h4>
                          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-0.5">
                            Ex-McKinsey // Tech Visionary
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end text-right bg-slate-50 border border-slate-100 p-3 rounded-xl transition-all duration-300 group-hover:bg-emerald-50 group-hover:border-emerald-500">
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Optimisation</span>
                        <span className="text-lg font-black text-slate-900 mt-0.5">-30% de coûts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Carte Michaelis MAHOUTO */}
              <motion.div variants={cardVariants} className="flex">
                <div className="gradient-border-card relative p-0.5 rounded-[2.5rem] flex flex-col w-full transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 group">
                  <div className="h-full bg-white rounded-[2.40rem] p-8 sm:p-10 flex flex-col justify-between overflow-hidden relative z-10">
                    <div>
                      <div className="flex items-center justify-between w-full flex-wrap gap-2">
                        <span className="text-[10px] font-black text-indigo-600 tracking-widest uppercase bg-indigo-50 px-3 py-1.5 rounded-lg">
                          Co-fondateur & CTO
                        </span>
                        <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Focus AfrikCSE
                        </span>
                      </div>
                      
                      <p className="text-slate-700 font-medium text-base sm:text-lg leading-relaxed italic mt-8 relative pl-4 border-l-2 border-emerald-500">
                        "La tech n'a de valeur que si elle sert l'humain. Avec le volet CSE, nous redonnons du pouvoir d'achat et une reconnaissance directe aux salariés via un catalogue fluide, tandis que la branche Voyage élimine la friction administrative pour les équipes financières."
                      </p>
                    </div>

                    <div className="flex items-end justify-between gap-4 mt-12 border-t border-slate-100 pt-6 flex-wrap">
                      <div className="flex items-center gap-4">
                        <div className="relative w-18 h-18 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                          <img 
                            src="/images/michaelis.png" 
                            alt="Michaelis MAHOUTO" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <h4 style={{ fontFamily: "Sanomat, ui-serif" }} className="text-slate-900 font-bold text-lg tracking-tight">
                            Michaelis MAHOUTO
                          </h4>
                          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-0.5">
                            Ex-VP Operations // Fintech Expert
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end text-right bg-slate-50 border border-slate-100 p-3 rounded-xl transition-all duration-300 group-hover:bg-indigo-50 group-hover:border-indigo-500">
                        <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Indicateur</span>
                        <span className="text-lg font-black text-slate-900 mt-0.5">Retours 100% Zen</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>

         

        </motion.div>
      </section>

      {/* STYLES PERSONNALISÉS BORDURES ANIMÉES ET GRADIENTS */}
      <style jsx global>{`
        .w-18 { width: 4.5rem; }
        .h-18 { height: 4.5rem; }

        @keyframes rotateGradient {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .gradient-border-card {
          overflow: hidden;
        }
        
        .gradient-border-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(
            from 0deg,
            transparent 20%,
            #6366f1 40%,
            #10b981 60%,
            transparent 80%
          );
          animation: rotateGradient 8s linear infinite;
          z-index: 1;
        }
        
        .gradient-border-card:hover::before {
          animation: rotateGradient 4s linear infinite;
        }
        
        .gradient-border-card > div {
          position: relative;
          z-index: 2;
        }
      `}</style>
    </div>
  );
}