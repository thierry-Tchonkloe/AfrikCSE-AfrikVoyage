"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useAnimation, useInView } from "framer-motion";
import { DollarSign, Plane, CheckCircle2, TrendingDown, BarChart2, Target, Zap } from "lucide-react";

// ─── DONNÉES DU DASHBOARD ──────────────────────────────────────────────────────
const DASHBOARD_STATS = [
  { label: "Dépenses totales", value: "2.4M €", change: "+12.5%", trend: "up", Icon: DollarSign },
  { label: "Voyages actifs", value: "1,847", change: "+8.3%", trend: "up", Icon: Plane },
  { label: "Taux de conformité", value: "94.2%", change: "+3.1%", trend: "up", Icon: CheckCircle2 },
  { label: "Économies réalisées", value: "342K €", change: "-18.6%", trend: "down", Icon: TrendingDown },
];

const WEEKLY_DATA = [
  { day: "Lun", value: 42 },
  { day: "Mar", value: 68 },
  { day: "Mer", value: 55 },
  { day: "Jeu", value: 89 },
  { day: "Ven", value: 74 },
  { day: "Sam", value: 23 },
  { day: "Dim", value: 12 },
];

const DEPARTMENT_DATA = [
  { name: "Commercial", value: 38, color: "#6366F1" },
  { name: "RH", value: 24, color: "#10B981" },
  { name: "IT", value: 18, color: "#F59E0B" },
  { name: "Finance", value: 12, color: "#8B5CF6" },
  { name: "Marketing", value: 8, color: "#EF4444" },
];

const RECENT_TRIPS = [
  { 
    id: 1, 
    employee: "Marie Dubois", 
    destination: "Paris → Dakar", 
    date: "12 Juin 2026",
    amount: "1,245 €",
    status: "Validé",
    statusColor: "emerald"
  },
  { 
    id: 2, 
    employee: "Thomas Martin", 
    destination: "Abidjan → Nairobi", 
    date: "14 Juin 2026",
    amount: "2,890 €",
    status: "En attente",
    statusColor: "amber"
  },
  { 
    id: 3, 
    employee: "Sophie Koffi", 
    destination: "Lomé → Paris", 
    date: "15 Juin 2026",
    amount: "3,450 €",
    status: "Validé",
    statusColor: "emerald"
  },
  { 
    id: 4, 
    employee: "Jean Aké", 
    destination: "Douala → Lagos", 
    date: "16 Juin 2026",
    amount: "890 €",
    status: "En attente",
    statusColor: "amber"
  },
];

// ─── COMPOSANT DU DASHBOARD MODERNE ──────────────────────────────────────────
const ModernDashboard = () => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  return (
    <div className="w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Barre de navigation du dashboard */}
      <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <span className="text-xs font-mono text-slate-400 tracking-wider uppercase">
            AfrikWorkspace // Executive Dashboard
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            ● Live
          </span>
          <span className="text-[10px] font-mono text-slate-500">v3.2.1</span>
        </div>
      </div>

      <div className="p-5 bg-slate-900">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {DASHBOARD_STATS.map((stat, idx) => (
            <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center">
                  <stat.Icon className="w-4 h-4 text-slate-300" />
                </div>
                <span className={`text-xs font-bold flex items-center gap-1 ${
                  stat.trend === "up" ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {stat.change}
                  {stat.trend === "up" ? "↑" : "↓"}
                </span>
              </div>
              <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Graphiques et visualisations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Graphique hebdomadaire */}
          <div className="md:col-span-2 bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Activité voyage</p>
                <p className="text-sm font-bold text-white mt-0.5">Réservations de la semaine</p>
              </div>
              <div className="flex gap-1">
                <span className="text-[9px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">7j</span>
                <span className="text-[9px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-indigo-500/30 text-indigo-400">30j</span>
                <span className="text-[9px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">90j</span>
              </div>
            </div>
            <div className="flex items-end h-32 gap-2">
              {WEEKLY_DATA.map((item, idx) => {
                const height = (item.value / Math.max(...WEEKLY_DATA.map(d => d.value))) * 100;
                const isHovered = hoveredBar === idx;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <div 
                      className="w-full rounded-t-sm transition-all duration-300 cursor-pointer relative"
                      style={{ 
                        height: `${height}%`,
                        minHeight: "8px",
                        background: isHovered 
                          ? "linear-gradient(180deg, #6366F1, #818CF8)" 
                          : "linear-gradient(180deg, #4F46E5, #6366F1)",
                        opacity: isHovered ? 1 : 0.8,
                        transform: isHovered ? "scaleY(1.05)" : "scaleY(1)",
                        transformOrigin: "bottom",
                        boxShadow: isHovered ? "0 0 20px rgba(99, 102, 241, 0.4)" : "none"
                      }}
                      onMouseEnter={() => setHoveredBar(idx)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {isHovered && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2 py-0.5 rounded whitespace-nowrap border border-slate-700">
                          {item.value}
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] font-mono text-slate-500">{item.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Répartition par département */}
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Analytique</p>
                <p className="text-sm font-bold text-white mt-0.5">Dépenses par département</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {DEPARTMENT_DATA.map((dept) => (
                <div key={dept.name}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-300 font-medium">{dept.name}</span>
                    <span className="text-slate-400 font-mono">{dept.value}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${dept.value}%`,
                        background: dept.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/30">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Total dépenses</span>
                <span className="font-bold text-white">2.4M €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des voyages récents */}
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Flux</p>
              <p className="text-sm font-bold text-white mt-0.5">Voyages récents</p>
            </div>
            <Link href="/trips" className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition">
              Voir tout →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-700/50">
                  <th className="pb-2 pr-4 font-medium">Employé</th>
                  <th className="pb-2 pr-4 font-medium">Destination</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Montant</th>
                  <th className="pb-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_TRIPS.map((trip) => (
                  <tr key={trip.id} className="border-b border-slate-700/30 last:border-0">
                    <td className="py-2.5 pr-4 text-sm text-white font-medium">{trip.employee}</td>
                    <td className="py-2.5 pr-4 text-sm text-slate-300">{trip.destination}</td>
                    <td className="py-2.5 pr-4 text-sm text-slate-400">{trip.date}</td>
                    <td className="py-2.5 pr-4 text-sm text-white font-mono">{trip.amount}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        trip.statusColor === "emerald" 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}>
                        {trip.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer du dashboard */}
        <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between text-[9px] text-slate-500">
          <span>Dernière mise à jour : {new Date().toLocaleString()}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Système opérationnel
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              IA active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function AuditInterface() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        duration: 0.5
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div ref={sectionRef} className="relative w-full bg-slate-50 overflow-hidden border-t border-slate-200 py-20">
      {/* Arrière-plan */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Halos de lumière */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-12 right-1/4 w-125 h-125 rounded-full bg-indigo-50/40 blur-[130px]" />
        <div className="absolute bottom-12 left-1/4 w-125 h-125 rounded-full bg-teal-50/30 blur-[130px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
        >
          {/* En-tête */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-600 rounded-full mb-4">
              🔍 Audit d'interface analytique
            </span>
            <h2 
              style={{
                fontFamily: "Sanomat, ui-serif",
                fontWeight: 600,
                fontStyle: "normal",
                fontSize: "clamp(32px, 5vw, 42px)",
                lineHeight: "1.2",
                color: "rgb(21, 0, 44)"
              }}
              className="tracking-tight mb-4"
            >
              Pilotez votre activité en <br className="hidden sm:block" />
              <span className="relative">
                temps réel
                <svg className="absolute left-0 bottom-0.5 w-full h-[30%] -z-10 overflow-visible" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0,5 Q20,2 40,6 T80,3 T100,5 L100,9 Q80,7 50,9 T15,7 Z" fill="rgba(99, 102, 241, 0.15)" />
                </svg>
              </span>
            </h2>
            <p className="text-slate-500 text-base max-w-2xl mx-auto font-medium leading-relaxed">
              Visualisez l'intégralité de vos données de voyage, dépenses et conformité dans un dashboard unique et interactif.
            </p>
          </motion.div>

          {/* Dashboard */}
          <motion.div variants={itemVariants}>
            <ModernDashboard />
          </motion.div>

          {/* Indicateurs supplémentaires */}
          <motion.div variants={itemVariants} className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <BarChart2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">ROI Moyen</p>
                <p className="text-lg font-black text-slate-900">+32%</p>
                <span className="text-[10px] text-emerald-600 font-medium">↑ 4.2% vs trimestre précédent</span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Conformité</p>
                <p className="text-lg font-black text-slate-900">94.2%</p>
                <span className="text-[10px] text-indigo-600 font-medium">+3.1% d'amélioration</span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Délai moyen</p>
                <p className="text-lg font-black text-slate-900">2.4 jours</p>
                <span className="text-[10px] text-amber-600 font-medium">↓ 18% de réduction</span>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="mt-8 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-200/50 hover:scale-[1.02] transform"
            >
              Accéder au dashboard complet
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}