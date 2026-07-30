// /src/components/infos-pages/OffersMapSection.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  ChevronRight,
  ShoppingBag,
  TreePine,
  Music,
  X,
  Sparkles,
  Building2,
  Utensils,
  Hotel,
  Mountain,
  Waves,
  Camera,
  Ticket,
  Bus,
  Plane,
  Briefcase,
} from "lucide-react";
import { fadeInUp, scaleIn, slideInRight } from "../styles/animations";

// ============================================================================
// DONNÉES DES RÉGIONS
// Les coordonnées x/y sont exprimées en % sur une grille 0–100 dérivée des
// coordonnées géographiques réelles (voir AfricaMapSVG plus bas), afin que
// chaque marqueur tombe précisément sur le continent, à l'endroit attendu.
// ============================================================================

interface Region {
  id: string;
  name: string;
  country: string;
  cities: string[];
  x: number;
  y: number;
  color: string;
  glow: string;
  icon: React.ReactNode;
  description: string;
  stats: { label: string; value: string }[];
  offers: {
    category: string;
    icon: React.ReactNode;
    items: string[];
  }[];
}

const regions: Region[] = [
  {
    id: "north",
    name: "Afrique du Nord",
    country: "Maroc, Algérie, Tunisie, Libye, Égypte",
    cities: ["Casablanca", "Alger", "Tunis", "Le Caire", "Marrakech"],
    x: 42.9,
    y: 23.5,
    color: "#F97316",
    glow: "rgba(249,115,22,0.45)",
    icon: <Building2 className="w-4 h-4" />,
    description: "Un carrefour culturel et économique entre l'Europe et l'Afrique",
    stats: [
      { label: "Offres", value: "120K+" },
      { label: "Villes", value: "45+" },
      { label: "Partenaires", value: "850+" },
    ],
    offers: [
      {
        category: "Culture & Patrimoine",
        icon: <Camera className="w-4 h-4" />,
        items: ["Musée du Bardo - Tunis", "Pyramides de Gizeh", "Médina de Fès", "Théâtre antique de Carthage"],
      },
      {
        category: "Loisirs & Détente",
        icon: <Waves className="w-4 h-4" />,
        items: ["Station balnéaire de Hammamet", "Parcs aquatiques", "Spa & thalassothérapie", "Croisières en Méditerranée"],
      },
      {
        category: "Gastronomie",
        icon: <Utensils className="w-4 h-4" />,
        items: ["Couscous royal", "Tajine marocain", "Brik tunisien", "Dégustation de vins"],
      },
    ],
  },
  {
    id: "west",
    name: "Afrique de l'Ouest",
    country: "Sénégal, Côte d'Ivoire, Ghana, Nigéria, Bénin",
    cities: ["Dakar", "Abidjan", "Accra", "Lagos", "Cotonou"],
    x: 30.6,
    y: 37.8,
    color: "#F97316",
    glow: "rgba(249,115,22,0.45)",
    icon: <MapPin className="w-4 h-4" />,
    description: "Le dynamisme économique et culturel de l'Afrique de l'Ouest",
    stats: [
      { label: "Offres", value: "150K+" },
      { label: "Villes", value: "60+" },
      { label: "Partenaires", value: "1200+" },
    ],
    offers: [
      {
        category: "Culture & Festivals",
        icon: <Music className="w-4 h-4" />,
        items: ["Festival de Jazz de Dakar", "Fêtes des Masques", "Musée des Civilisations", "Artisanat local"],
      },
      {
        category: "Shopping & Marchés",
        icon: <ShoppingBag className="w-4 h-4" />,
        items: ["Marché de Koumbi Saleh", "Centres commerciaux", "Boutiques d'artisans", "Marchés nocturnes"],
      },
      {
        category: "Nature & Aventure",
        icon: <TreePine className="w-4 h-4" />,
        items: ["Parc National du Niokolo-Koba", "Réserve de Taï", "Plages de la Côte d'Or"],
      },
    ],
  },
  {
    id: "central",
    name: "Afrique Centrale",
    country: "Cameroun, Gabon, RDC, RCA, Guinée Équatoriale",
    cities: ["Yaoundé", "Libreville", "Kinshasa", "Bangui", "Malabo"],
    x: 53.1,
    y: 48.0,
    color: "#F97316",
    glow: "rgba(249,115,22,0.45)",
    icon: <Mountain className="w-4 h-4" />,
    description: "Le cœur vert de l'Afrique, entre forêts équatoriales et montagnes",
    stats: [
      { label: "Offres", value: "80K+" },
      { label: "Villes", value: "35+" },
      { label: "Partenaires", value: "600+" },
    ],
    offers: [
      {
        category: "Écotourisme & Nature",
        icon: <TreePine className="w-4 h-4" />,
        items: ["Parc National de la Salonga", "Forêt du Bassin du Congo", "Gorilles des montagnes", "Randonnées"],
      },
      {
        category: "Culture & Traditions",
        icon: <Camera className="w-4 h-4" />,
        items: ["Musée National de Yaoundé", "Art pygmée", "Festivals traditionnels"],
      },
    ],
  },
  {
    id: "east",
    name: "Afrique de l'Est",
    country: "Kenya, Tanzanie, Rwanda, Ouganda, Éthiopie",
    cities: ["Nairobi", "Dar es Salaam", "Kigali", "Kampala", "Addis Abeba"],
    x: 71.4,
    y: 42.9,
    color: "#F97316",
    glow: "rgba(249,115,22,0.45)",
    icon: <Plane className="w-4 h-4" />,
    description: "Le berceau du safari et des paysages à couper le souffle",
    stats: [
      { label: "Offres", value: "110K+" },
      { label: "Villes", value: "50+" },
      { label: "Partenaires", value: "900+" },
    ],
    offers: [
      {
        category: "Safari & Aventure",
        icon: <Bus className="w-4 h-4" />,
        items: ["Parc National du Serengeti", "Masai Mara", "Gorilles du Rwanda", "Kilimandjaro"],
      },
      {
        category: "Culture & Histoire",
        icon: <Camera className="w-4 h-4" />,
        items: ["Musée de Nairobi", "Villages Massaï", "Églises rupestres de Lalibela"],
      },
      {
        category: "Plages & Détente",
        icon: <Waves className="w-4 h-4" />,
        items: ["Zanzibar", "Plages de Mombasa", "Îles de la Réunion"],
      },
    ],
  },
  {
    id: "south",
    name: "Afrique Australe",
    country: "Afrique du Sud, Namibie, Botswana, Zambie, Zimbabwe",
    cities: ["Le Cap", "Johannesburg", "Windhoek", "Gaborone", "Lusaka"],
    x: 57.1,
    y: 69.4,
    color: "#F97316",
    glow: "rgba(249,115,22,0.45)",
    icon: <Hotel className="w-4 h-4" />,
    description: "Où les paysages spectaculaires rencontrent une culture vibrante",
    stats: [
      { label: "Offres", value: "130K+" },
      { label: "Villes", value: "55+" },
      { label: "Partenaires", value: "1100+" },
    ],
    offers: [
      {
        category: "Voyages & Découverte",
        icon: <Plane className="w-4 h-4" />,
        items: ["Le Cap et Table Mountain", "Désert du Namib", "Chutes Victoria", "Route des jardins"],
      },
      {
        category: "Loisirs & Divertissement",
        icon: <Ticket className="w-4 h-4" />,
        items: ["Parcs d'attractions", "Safari photo", "Dégustation de vins", "Sports nautiques"],
      },
      {
        category: "Culture & Art",
        icon: <Briefcase className="w-4 h-4" />,
        items: ["Musée de l'Apartheid", "Art rupestre", "Festivals musicaux"],
      },
    ],
  },
];

const categoryColors: Record<string, string> = {
  "Culture & Patrimoine": "bg-indigo-50 text-indigo-600",
  "Culture & Festivals": "bg-purple-50 text-purple-600",
  "Culture & Traditions": "bg-amber-50 text-amber-600",
  "Culture & Histoire": "bg-rose-50 text-rose-600",
  "Culture & Art": "bg-pink-50 text-pink-600",
  "Loisirs & Détente": "bg-teal-50 text-teal-600",
  "Loisirs & Divertissement": "bg-emerald-50 text-emerald-600",
  "Shopping & Marchés": "bg-blue-50 text-blue-600",
  "Nature & Aventure": "bg-green-50 text-green-600",
  "Écotourisme & Nature": "bg-emerald-50 text-emerald-600",
  "Safari & Aventure": "bg-orange-50 text-orange-600",
  "Voyages & Découverte": "bg-cyan-50 text-cyan-600",
  Gastronomie: "bg-red-50 text-red-600",
  "Plages & Détente": "bg-sky-50 text-sky-600",
};

// ============================================================================
// IMAGE DE LA CARTE
// Remplace-la par ton propre fichier (acheté/licencié) placé dans /public.
// L'image doit être CARRÉE (ratio 1:1) — c'est la carte 3D Afrique utilisée
// pour calibrer les coordonnées % des marqueurs ci-dessus (image source
// 980x980px). Si tu changes d'image, il faut recalibrer region.x / region.y.
// ============================================================================
const AFRICA_IMAGE_SRC = "/images/africa-3d-map.jpg";

const AfricaMapImage = () => (
  <div className="relative w-full h-full">
    <img
      src={AFRICA_IMAGE_SRC}
      alt="Carte 3D de l'Afrique"
      className="w-full h-full object-cover select-none pointer-events-none"
      draggable={false}
      onError={(e) => {
        // Filet de sécurité pendant le développement, tant que l'asset
        // licencié n'est pas encore placé dans /public/images.
        (e.target as HTMLImageElement).style.opacity = "0";
      }}
    />
  </div>
);

// Hexagone décoratif réutilisable
const Hexagon = ({ className, fill = "#3D5AFE" }: { className?: string; fill?: string }) => (
  <svg viewBox="0 0 100 86.6" className={className}>
    <polygon points="25,0 75,0 100,43.3 75,86.6 25,86.6 0,43.3" fill={fill} />
  </svg>
);

export default function OffersMapSection() {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 bg-[#0B1330] overflow-hidden">
      {/* Décor hexagonal, ambiance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 left-10 w-16 h-14 opacity-90"
        >
          <Hexagon fill="#3D5AFE" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 16, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-24 right-0 w-64 h-56 opacity-80 translate-x-1/3"
        >
          <Hexagon fill="#2C3E8C" />
        </motion.div>
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* En-tête */}
        <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 bg-white/10 text-orange-400 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.15em] mb-4 border border-white/10">
            <Sparkles className="w-4 h-4" />
            Offres CSE locales
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4 leading-[1.1]">
            Des offres partout
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              en Afrique
            </span>
          </h2>
          <p className="text-slate-300 text-lg font-medium">
            Plus de 500 000 offres à prix attractifs dans toute l'Afrique
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          {/* Carte d'Afrique */}
          <motion.div variants={scaleIn} className="flex-1 relative">
            <div className="relative w-full aspect-square max-h-[600px] mx-auto">
              {/* Calque image : seul lui est rogné aux coins arrondis */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <AfricaMapImage />
              </div>

              {/* Points régionaux (au-dessus, jamais rognés) */}
              {regions.map((region, i) => {
                const isActive = selectedRegion?.id === region.id;
                const isHovered = hoveredRegion === region.id;
                return (
                  <motion.button
                    key={region.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.08, type: "spring", stiffness: 260, damping: 18 }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.92 }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                    style={{
                      left: `${region.x}%`,
                      top: `${region.y}%`,
                      zIndex: isActive ? 30 : 20,
                    }}
                    onMouseEnter={() => setHoveredRegion(region.id)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() => setSelectedRegion(region)}
                    aria-label={`Voir les offres pour ${region.name}`}
                  >
                    {/* Halo pulsé, uniquement pour l'état actif/survolé */}
                    {(isActive || isHovered) && (
                      <motion.div
                        animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full"
                        style={{ background: isActive ? region.glow : "rgba(59,130,246,0.35)" }}
                      />
                    )}

                    {/* Point */}
                    <div
                      className={`relative z-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                        isActive ? "w-5 h-5 ring-4 ring-orange-400/40" : "w-3 h-3 ring-2 ring-white/60"
                      }`}
                      style={{ backgroundColor: isActive ? "#F97316" : "#3B82F6" }}
                    />

                    {/* Étiquette */}
                    <AnimatePresence>
                      {(isHovered || isActive) && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3.5 py-1.5 bg-white text-[#0B1330] text-xs font-bold rounded-lg whitespace-nowrap shadow-xl"
                        >
                          {region.name}
                          <span className="text-slate-400 font-medium text-[10px] ml-1.5">
                            {region.cities.length} villes
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}

              {/* Légende */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-x-4 gap-y-2 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
                {regions.map((region) => (
                  <button
                    key={`legend-${region.id}`}
                    onClick={() => setSelectedRegion(region)}
                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: selectedRegion?.id === region.id ? "#F97316" : "#3B82F6" }}
                    />
                    <span className="text-[11px] font-medium text-slate-200">{region.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Panel des offres */}
          <motion.div variants={slideInRight} className="lg:w-[420px] xl:w-[460px] flex">
            <AnimatePresence mode="wait">
              {selectedRegion ? (
                <motion.div
                  key="offers"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className="bg-white rounded-3xl shadow-2xl p-8 w-full max-h-[600px] overflow-y-auto"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-3 h-3 rounded-full bg-orange-500" />
                        <h3 className="text-xl font-black text-[rgb(21,0,44)]">{selectedRegion.name}</h3>
                      </div>
                      <p className="text-sm text-slate-500">{selectedRegion.country}</p>
                      <p className="text-xs text-slate-400 mt-1">{selectedRegion.cities.join(" · ")}</p>
                    </div>
                    <button
                      onClick={() => setSelectedRegion(null)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
                      aria-label="Fermer"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>

                  <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 mb-6">
                    {selectedRegion.description}
                  </p>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {selectedRegion.stats.map((stat, idx) => (
                      <div key={idx} className="text-center bg-slate-50 rounded-xl py-2 px-1">
                        <div className="text-lg font-black text-orange-500">{stat.value}</div>
                        <div className="text-[10px] font-medium text-slate-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <span className="inline-block text-xs font-bold text-orange-500 uppercase tracking-wide mb-3">
                    Notre sélection de premier choix
                  </span>

                  <div className="space-y-5">
                    {selectedRegion.offers.map((offer, idx) => (
                      <div key={idx} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              categoryColors[offer.category] || "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              {offer.icon}
                              {offer.category}
                            </span>
                          </span>
                        </div>
                        <ul className="grid grid-cols-1 gap-1">
                          {offer.items.map((item, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-center gap-2 py-0.5">
                              <ChevronRight className="w-3 h-3 text-orange-400 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Plus de 500 000 offres disponibles
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 w-full flex flex-col items-center justify-center text-center min-h-[400px]"
                >
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center mb-6"
                  >
                    <MapPin className="w-12 h-12 text-orange-400" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-[rgb(21,0,44)] mb-3">Explorez les offres</h3>
                  <p className="text-sm text-slate-500 max-w-xs mb-6">
                    Cliquez sur une région pour découvrir les avantages disponibles localement
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {regions.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRegion(r)}
                        className="text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 px-3 py-1 rounded-full border border-slate-200 transition-colors"
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}