"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useAnimation, useInView } from "framer-motion";

// ─── IMAGES HAUTE RÉSOLUTION LIBRES DE DROIT POUR LE FOND DU CARROUSEL ──────
const HERO_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1920&q=80",
    fallbackSrc: "https://placehold.co/1920x1080/1e293b/ffffff?text=✈️+Voyages+daffaires",
    alt: "Avion de ligne en plein vol - Voyages d'affaires",
    label: "✈️ Voyages d'affaires",
    bgColor: "from-blue-950/40 to-slate-900/60",
  },
  {
    src: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1920&q=80",
    fallbackSrc: "https://placehold.co/1920x1080/064e3b/ffffff?text=👥+Gestion+RH",
    alt: "Équipe professionnelle qui collabore - Gestion RH",
    label: "👥 Gestion RH",
    bgColor: "from-emerald-950/40 to-slate-900/60",
  },
  {
    src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1920&q=80",
    fallbackSrc: "https://placehold.co/1920x1080/7c2d12/ffffff?text=😊+Bien-être+au+travail",
    alt: "Collaborateurs souriants au bureau - Bien-être au travail",
    label: "😊 Bien-être au travail",
    bgColor: "from-orange-950/40 to-slate-900/60",
  },
  {
    src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=80",
    fallbackSrc: "https://placehold.co/1920x1080/581c87/ffffff?text=📊+Performance+financière",
    alt: "Graphiques et analyse financière sur écran - Performance financière",
    label: "📊 Performance financière",
    bgColor: "from-purple-950/40 to-slate-900/60",
  },
  {
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80",
    fallbackSrc: "https://placehold.co/1920x1080/172554/ffffff?text=🌅+Évasion+et+voyages",
    alt: "Plage paradisiaque au coucher du soleil - Évasion et voyages",
    label: "🌅 Évasion et voyages",
    bgColor: "from-sky-950/40 to-slate-900/60",
  },
];

// ─── LOGOS PARTENAIRES POUR LA BANDE DÉFILANTE ──────────────────────────────
const PARTNER_LOGOS = [
  { name: "ORANGE", color: "text-orange-400" },
  { name: "TOTALENERGIES", color: "text-red-500" },
  { name: "ECOBANK", color: "text-emerald-400" },
  { name: "BRIDGECORP", color: "text-blue-400" },
  { name: "MTN", color: "text-yellow-400" },
  { name: "BOLLORÉ", color: "text-slate-300" },
  { name: "SUNU", color: "text-amber-400" },
  { name: "BICICI", color: "text-indigo-400" },
  { name: "ORANGE", color: "text-orange-400" },
  { name: "TOTALENERGIES", color: "text-red-500" },
  { name: "ECOBANK", color: "text-emerald-400" },
  { name: "BRIDGECORP", color: "text-blue-400" },
];

// ─── COMPOSANT CARROUSEL D'IMAGES DE FOND (CORRIGÉ) ──────────────────────────
function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {HERO_IMAGES.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100 z-0" : "opacity-0 -z-10"
          }`}
        >
          {/* L'image Next.js configurée pour occuper tout l'arrière-plan */}
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover object-center"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = image.fallbackSrc;
            }}
          />

          {/* Overlay dégradé de couleur par-dessus l'image pour garantir la lisibilité du texte */}
          <div className={`absolute inset-0 bg-gradient-to-br ${image.bgColor} mix-blend-multiply`} />
          <div className="absolute inset-0 bg-slate-900/40" />

          {/* Motif décoratif en arrière-plan */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-white/5 rounded-full blur-3xl" />
          </div>

          {/* Label en bas */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 z-10">
            <span className="text-white text-sm md:text-base font-medium tracking-wide">
              {image.label}
            </span>
          </div>
        </div>
      ))}
      
      {/* Indicateurs du carrousel */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {HERO_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? "w-8 h-2 bg-white"
                : "w-2 h-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── BANDE DÉFILANTE DE LOGOS PARTENAIRES ──────────────────────────────────
function PartnerMarquee() {
  return (
    <div className="w-full overflow-hidden bg-black/40 backdrop-blur-md border-t border-white/5 py-3 z-10">
      <div className="relative flex overflow-x-hidden">
        <div className="animate-marquee flex whitespace-nowrap gap-12">
          {PARTNER_LOGOS.map((partner, index) => (
            <span
              key={`${partner.name}-${index}`}
              className={`${partner.color} font-bold text-sm md:text-base tracking-wider uppercase transition hover:scale-110 hover:brightness-125`}
            >
              {partner.name}
            </span>
          ))}
        </div>
        <div className="animate-marquee2 flex whitespace-nowrap gap-12">
          {PARTNER_LOGOS.map((partner, index) => (
            <span
              key={`${partner.name}-${index}-duplicate`}
              className={`${partner.color} font-bold text-sm md:text-base tracking-wider uppercase transition hover:scale-110 hover:brightness-125`}
            >
              {partner.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const textAnimations = useAnimation();
  const textRef = useRef(null);
  const textInView = useInView(textRef, { once: true, amount: 0.1 });

  useEffect(() => {
    if (textInView) {
      textAnimations.start("visible");
    }
  }, [textInView, textAnimations]);

  const textContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.3
      }
    }
  };

  const textItemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6,
        ease: "easeOut" as const
      }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.5, 
        delay: 0.7,
        ease: "easeOut" as const
      }
    }
  };

  const searchVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: 0.9,
        ease: "easeOut" as const
      }
    }
  };

  // Version mobile
  const MobileContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex flex-col gap-4 bg-white/85 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/20 mx-4"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100/80 rounded-full w-fit">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        <span className="text-xs font-semibold text-indigo-700">AfrikVoyage × AfrikCSE</span>
      </div>
      <h2 className="text-slate-900 text-2xl font-bold tracking-tight">
        Pilotez vos <span className="text-indigo-600">voyages</span>.<br />
        Propulsez vos <span className="text-emerald-600">avantages</span>.
      </h2>
      <p className="text-slate-700 text-sm leading-relaxed">
        L'unique plateforme qui unifie la rigueur de la performance financière et l'épanouissement des collaborateurs.
      </p>
      <div className="flex flex-col gap-3 mt-2">
        <Link href="/infos/demo" className="inline-flex items-center justify-center bg-indigo-600 text-white font-bold text-sm px-6 py-3 rounded-xl">
          Demander une démo
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
        <Link href="/infos/solutions" className="inline-flex items-center justify-center border-2 border-slate-300 text-slate-700 font-semibold text-sm px-6 py-3 rounded-xl">
          Découvrir la plateforme
        </Link>
      </div>
      <div className="mt-2">
        <div className="flex items-center bg-white/80 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <input
            type="text"
            placeholder="Rechercher..."
            className="flex-1 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          <button className="px-3 py-2.5 bg-indigo-600 text-white text-sm font-medium">
            🔍
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden flex flex-col"
      style={{ minHeight: "calc(100vh - 64px)" }}
    >
      {/* ─── CARROUSEL D'IMAGES EN ARRIÈRE-PLAN ─── */}
      <ImageCarousel />
      
      {/* ─── OVERLAY GRADIENT LÉGER ─── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 z-5 pointer-events-none" />

      {/* ─── CONTENU PRINCIPAL ─── */}
      <div className="relative flex-1 flex items-center justify-center z-10 py-16 md:py-20">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          
          {/* ─── VERSION DESKTOP ─── */}
          <div className="hidden md:block">
            <motion.div
              ref={textRef}
              initial="hidden"
              animate={textAnimations}
              variants={textContainerVariants}
              className="flex flex-col items-center gap-5 bg-white/85 backdrop-blur-2xl p-10 md:p-14 rounded-3xl shadow-2xl border border-white/20"
            >
              {/* Badge */}
              <motion.div 
                variants={textItemVariants} 
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100/80 rounded-full border border-indigo-200/50"
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-xs font-semibold text-indigo-700 tracking-wide uppercase">
                  AfrikVoyage × AfrikCSE
                </span>
              </motion.div>
              
              {/* Titre */}
              <motion.h1 
                variants={textItemVariants} 
                className="text-slate-900 text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1] text-center"
                style={{ fontFamily: "Sanomat, ui-serif", fontWeight: 600 }}
              >
                Pilotez vos <span className="text-indigo-600">voyages</span>.<br />
                Propulsez vos <span className="text-emerald-600">avantages</span>.
              </motion.h1>
              
              {/* Sous-titre */}
              <motion.p 
                variants={textItemVariants} 
                className="text-slate-800 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl text-center"
              >
                L'unique plateforme qui unifie la rigueur de la performance financière 
                <span className="font-semibold text-indigo-600"> (AfrikVoyage)</span> et l'épanouissement des collaborateurs 
                <span className="font-semibold text-emerald-600"> (AfrikCSE)</span> grâce à l'IA prédictive.
              </motion.p>

              {/* Boutons */}
              <motion.div 
                variants={buttonVariants} 
                className="flex flex-col sm:flex-row gap-4 mt-1"
              >
                <Link
                  href="/infos/demo"
                  className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base px-8 py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-200/50 hover:scale-[1.02] transform"
                >
                  Demander une démo
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link
                  href="/infos/solutions"
                  className="inline-flex items-center justify-center border-2 border-slate-300/70 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700 font-semibold text-base px-8 py-3.5 rounded-xl transition-all duration-300 backdrop-blur-sm"
                >
                  Découvrir la plateforme
                </Link>
              </motion.div>

              {/* Barre de recherche */}
              <motion.div 
                variants={searchVariants}
                className="w-full max-w-2xl mt-1"
              >
                <div className="relative">
                  <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/50 shadow-sm overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-200/50 transition">
                    <div className="flex-1 flex items-center px-4">
                      <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Recherchez une destination, un service ou une fonctionnalité..."
                        className="w-full px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                      />
                    </div>
                    <button className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition whitespace-nowrap">
                      Rechercher
                    </button>
                  </div>
                  {/* <div className="flex items-center justify-center gap-4 mt-2 text-xs text-white/80 drop-shadow-md">
                    <span className="flex items-center gap-1">
                      <span className="text-indigo-400">✈️</span> Vols
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-emerald-400">🏨</span> Hôtels
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-amber-400">🎁</span> Avantages
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-purple-400">📊</span> Analytics
                    </span>
                  </div> */}
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* ─── VERSION MOBILE ─── */}
          <div className="md:hidden">
            <MobileContent />
          </div>
        </div>
      </div>

      {/* ─── BANDE DÉFILANTE DES LOGOS PARTENAIRES ─── */}
      <PartnerMarquee />

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee2 {
          0% { transform: translateX(50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee2 {
          animation: marquee2 25s linear infinite;
        }
      `}</style>
    </section>
  );
}