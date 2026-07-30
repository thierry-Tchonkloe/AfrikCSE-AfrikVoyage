"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plane, Users, Smile, ChartBar } from "lucide-react";

// ─── CARROUSEL D'UNIVERS POUR LE TRAPÈZE EN ARRIÈRE-PLAN ─────────────────
const HERO_UNIVERSES = [
  {
    src: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=80",
    label: "Voyages d'affaires",
    icon: <Plane size={16} className="text-blue-400" />,
  },
  {
    src: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1400&q=80",
    label: "Gestion RH & Avantages",
    icon: <Users size={16} className="text-emerald-400" />,
  },
  {
    src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1400&q=80",
    label: "Bien-être & CSE",
    icon: <Smile size={16} className="text-amber-400" />,
  },
  {
    src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80",
    label: "Performance & Subventions",
    icon: <ChartBar size={16} className="text-purple-400" />,
  },
];

// ─── LOGOS PARTENAIRES (Taille agrandie) ─────────────────────────────────
const PARTNER_LOGOS = [
  { name: "ORANGE", color: "text-orange-500" },
  { name: "TOTALENERGIES", color: "text-red-500" },
  { name: "ECOBANK", color: "text-emerald-600" },
  { name: "BRIDGECORP", color: "text-blue-600" },
  { name: "MTN", color: "text-yellow-500" },
  { name: "BOLLORÉ", color: "text-slate-700" },
  { name: "SUNU", color: "text-amber-600" },
  { name: "BICICI", color: "text-indigo-600" },
];

export default function HeroSection() {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % HERO_UNIVERSES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full bg-slate-50 overflow-hidden py-8 lg:py-12 flex flex-col justify-between min-h-[92vh]">
      
      {/* ─── 1. ARRIÈRE-PLAN : BANDES SVG (1 ÉPAISSE HORIZONTALE + 1 FINE VERTICALE) ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* Bande 1 : Horizontale Épaisse */}
        <svg
          className="absolute top-1/2 left-0 w-[140%] -translate-y-1/2 -translate-x-[10%] h-[400px] opacity-25"
          viewBox="0 0 1200 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-100 150 C 200 40, 450 280, 750 110 C 980 -10, 1150 240, 1300 130"
            stroke="url(#gradient-horizontal)"
            strokeWidth="110"
            strokeLinecap="round"
            fill="none"
          />
          <defs>
            <linearGradient id="gradient-horizontal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="50%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>

        {/* Bande 2 : Verticale Fine */}
        <svg
          className="absolute top-0 right-[25%] w-[250px] h-full opacity-35"
          viewBox="0 0 250 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 125 -50 C 220 200, 30 500, 150 850"
            stroke="url(#gradient-vertical)"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
          />
          <defs>
            <linearGradient id="gradient-vertical" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
        </svg>

      </div>

      {/* ─── 2. TRAPÈZE CARROUSEL DÉMARRANT DERRIÈRE LE BLOC BLEU VERS LA DROITE ─── */}
      <div 
        className="absolute top-8 bottom-24 left-[20%] right-0 hidden lg:block overflow-hidden z-1 shadow-2xl rounded-l-3xl"
        style={{
          clipPath: "polygon(22% 0%, 100% 0%, 100% 100%, 0% 100%)"
        }}
      >
        {HERO_UNIVERSES.map((item, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIdx ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={item.src}
              alt={item.label}
              fill
              className="object-cover object-center scale-105"
              priority={index === 0}
            />
            {/* Voile très léger pour conserver une image très claire et esthétique */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950/40 via-transparent to-black/10" />
          </div>
        ))}

        {/* Label de l'univers actif en bas à droite du trapèze */}
        <div className="absolute bottom-6 right-10 z-20 bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-xs font-semibold flex items-center gap-2 shadow-xl">
          {HERO_UNIVERSES[currentIdx].icon}
          <span className="text-white">{HERO_UNIVERSES[currentIdx].label}</span>
        </div>
      </div>

      {/* ─── 3. GRILLE PRINCIPALE DE CONTENU (POUSSÉE NATIVE VERS LA GAUCHE) ─── */}
      <div className="relative w-full pl-4 sm:pl-6 lg:pl-10 pr-4 sm:pr-6 lg:pr-8 z-10 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center min-h-[500px]">
          
          {/* ─── BLOC BLEU AGRANDI ET POUSSÉ AU MAXIMUM À GAUCHE ─── */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:col-span-7 relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 rounded-[2.8rem] p-8 sm:p-12 lg:p-16 text-white shadow-2xl shadow-blue-900/30 overflow-hidden z-20"
          >
            {/* Hexagone décoratif en haut à droite du bloc bleu */}
            <div className="absolute top-6 right-8 w-16 h-16 opacity-30 pointer-events-none">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon
                  points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-white"
                />
              </svg>
            </div>

            {/* Petit cercle orange décoratif */}
            <div className="absolute top-16 right-20 w-6 h-6 rounded-full bg-orange-500 shadow-md animate-bounce" style={{ animationDuration: '4s' }} />

            {/* Hexagone bleu translucide en bas à gauche */}
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-500/50 backdrop-blur-sm rounded-3xl rotate-12 border border-white/10" />

            {/* CONTENU TEXTE */}
            <div className="relative z-20 space-y-6 max-w-xl">
              
              {/* Badge supérieur */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-blue-100">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                AfrikVoyage × AfrikCSE
              </div>

              {/* Titre Principal */}
              <h1 className="text-3xl sm:text-4xl lg:text-[2.85rem] font-black tracking-tight leading-[1.16] text-white">
                La plateforme qui simplifie, valorise et réinvente vos <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-emerald-300">avantages & voyages</span>.
              </h1>

              {/* Description */}
              <p className="text-blue-100/90 text-sm sm:text-base lg:text-lg leading-relaxed font-normal">
                Avec AfrikCSE & AfrikVoyage, centralisez la gestion de vos déplacements d'affaires et offrez plus de pouvoir d'achat à vos salariés grâce à une interface unique et intuitive.
              </p>

              {/* Bouton CTA Pilule */}
              <div className="pt-2 flex flex-wrap gap-4 items-center">
                <Link
                  href="/infos/demo"
                  className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm sm:text-base px-8 py-4 rounded-full transition-all duration-200 shadow-lg shadow-blue-600/40 hover:scale-105"
                >
                  Découvrir la billetterie CSE
                  <span className="w-2.5 h-2.5 rounded-full bg-white inline-block ml-1" />
                </Link>

                <Link
                  href="/infos/solutions"
                  className="inline-flex items-center text-xs sm:text-sm font-semibold text-blue-200 hover:text-white underline underline-offset-4"
                >
                  Voir nos solutions
                </Link>
              </div>

            </div>
          </motion.div>

          {/* ─── 4. MOCKUPS POSITIONNÉS BIEN PLUS EN BAS ─── */}
          <div className="lg:col-span-5 relative h-full min-h-[320px] lg:min-h-[480px]">
            
            <div className="absolute top-[68%] lg:top-[72%] -translate-y-1/2 left-1/2 lg:-left-24 -translate-x-1/2 lg:translate-x-0 z-30 flex items-center pointer-events-auto">
              
              {/* LAPTOP AGRANDI (InvoiceSimple) */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative w-[340px] sm:w-[440px] lg:w-[500px] shrink-0 drop-shadow-2xl"
              >
                <div className="relative rounded-2xl overflow-hidden border-4 border-slate-900 bg-slate-900 shadow-2xl">
                  <Image
                    src="https://www.invoicesimple.com/wp-content/uploads/2025/01/A3-Icon-overlay-on-man-at-laptop_.jpg"
                    alt="Aperçu Ordinateur Laptop"
                    width={950}
                    height={590}
                    className="object-cover w-full h-auto"
                  />
                </div>
              </motion.div>

              {/* TÉLÉPHONE POSITIONNÉ BIEN BAS (HelloCSE) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="absolute -bottom-8 -left-4 sm:-left-8 w-[85px] sm:w-[105px] lg:w-[115px] z-40 drop-shadow-2xl"
              >
                <div className="relative rounded-[18px] overflow-hidden border-[3px] border-slate-900 bg-slate-900 shadow-2xl">
                  <Image
                    src="https://f.hellowork.com/bdmtools/2023/08/hellocse-4.jpg"
                    alt="Application Mobile HelloCSE"
                    width={461}
                    height={900}
                    className="object-cover w-full h-auto"
                  />
                </div>
              </motion.div>

            </div>

          </div>

        </div>
      </div>

      {/* ─── 5. BANDEAU PREUVE SOCIALE AVEC LOGOS AGRANDIS ─── */}
      <div className="relative z-20 mt-12 pt-6 pb-2 border-t border-slate-200/60 bg-white/80 backdrop-blur-md">
        <p className="text-center text-xs sm:text-sm font-bold text-slate-800 mb-4 tracking-wide">
          Plus de <span className="text-blue-600 font-extrabold">1 million de salariés</span> utilisent nos solutions au quotidien.
        </p>
        
        {/* Défilé continu avec logos plus grands et espacés */}
        <div className="w-full overflow-hidden flex">
          <div className="animate-marquee flex whitespace-nowrap gap-14 items-center">
            {PARTNER_LOGOS.map((partner, index) => (
              <span
                key={index}
                className={`${partner.color} font-black text-sm sm:text-base lg:text-lg tracking-wider uppercase opacity-90 hover:opacity-100 transition hover:scale-105`}
              >
                {partner.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Animation Marquee CSS */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: 200%;
          animation: marquee 22s linear infinite;
        }
      `}</style>
    </section>
  );
}