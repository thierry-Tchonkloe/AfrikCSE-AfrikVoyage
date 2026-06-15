"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useAnimation, useInView } from "framer-motion";

// ── CONFIGURATION DES DONNÉES ENRICHIES AVEC KPIs ───────────────────────────────

const AFRIKVOYAGE_FEATURES = [
    { title: "Réservation centralisée", desc: "Vols, hôtels & transports sur un seul écran", kpi: "-30%" },
    { title: "Contrôle budgétaire en temps réel", desc: "Bloquez les dépassements avant la validation", kpi: "100%" },
    { title: "Gestion des notes de frais", desc: "Numérisation intelligente et rapprochement instantané", kpi: "-18€/note" },
    { title: "Reporting avancé & Heatmaps", desc: "Visualisez les fuites de capitaux par filiale", kpi: "+47% ROI" },
];

const AFRIKCSE_FEATURES = [
    { title: "Gestion des avantages", desc: "Subventions et allocations distribuées en 1 clic", kpi: "95%" },
    { title: "Catalogue de services B2C", desc: "Offres exclusives, loisirs et chèques cadeaux", kpi: "12+ offres" },
    { title: "Suivi de satisfaction en continu", desc: "Pulse sondages pour mesurer le climat social", kpi: "+42%" },
    { title: "Conformité automatisée", desc: "Rapports d'URSSAF et règles fiscales locales intégrés", kpi: "99.2%" },
];

// ── COMPOSANT TRUST BAR (MARQUEE DE LOGOS) - COLLÉ EN HAUT ──────────────────────
const TrustBar = () => {
    const logos = [
        { name: "ORANGE", color: "#FF7900" },
        { name: "TOTALENERGIES", color: "#ED1B24" },
        { name: "ECOBANK", color: "#009F4D" },
        { name: "BRIDGECORP", color: "#1E3A8A" },
        { name: "MTN", color: "#FFCD00" },
        { name: "BOLLORÉ", color: "#004080" },
        { name: "SUNU", color: "#E87C1F" },
        { name: "BICICI", color: "#003399" },
    ];
    
    const duplicatedLogos = [...logos, ...logos, ...logos];

    return (
        <div className="w-full overflow-hidden py-4 border-y border-slate-200/50 bg-slate-50/30">
            <div className="relative flex overflow-x-hidden group">
                <div className="animate-marquee flex items-center gap-12 whitespace-nowrap">
                    {duplicatedLogos.map((logo, idx) => (
                        <div
                            key={idx}
                            className="inline-flex items-center justify-center px-4 py-1 transition-all duration-300 grayscale hover:grayscale-0 hover:scale-110 cursor-pointer"
                            style={{ transition: "all 0.3s ease" }}
                        >
                            <span className="text-slate-400 text-lg font-bold tracking-wider hover:text-slate-800 transition-colors">
                                {logo.name}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="absolute top-0 left-0 w-20 h-full bg-linear-to-r from-slate-50/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-20 h-full bg-linear-to-l from-slate-50/80 to-transparent z-10 pointer-events-none" />
            </div>
        </div>
    );
};

// ── COMPOSANT VIDÉO INTÉGRÉE ────────────────────────────────────────────────────
const VideoSection = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handlePlay = () => {
        if (videoRef.current) {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const handlePause = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    return (
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-xl">
            {/* Thumbnail / Video */}
            <div className="relative aspect-video">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    poster="/videos/bg-video1.mp4"
                    playsInline
                >
                    <source src="/videos/bg-video1.mp4" type="video/mp4" />
                </video>
                
                {/* Overlay lecture si non joué */}
                {!isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <button
                            onClick={handlePlay}
                            className="group relative w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-indigo-500/80 transition-all duration-300 hover:scale-110"
                        >
                            <div className="absolute inset-0 rounded-full animate-ping bg-white/30 opacity-75" />
                            <svg className="w-8 h-8 text-white ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>
                )}
                
                {/* Contrôles si en lecture */}
                {isPlaying && (
                    <button
                        onClick={handlePause}
                        className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                )}
            </div>
            
            {/* Texte descriptif */}
            <div className="p-5 bg-white border-t border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-indigo-600 text-sm">📹</span>
                    <h3 className="font-bold text-slate-800">Découvrez la plateforme en action</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                    Regardez comment AfrikWorkspace unifie la gestion des voyages d'affaires et des avantages collaborateurs en une seule interface intuitive.
                </p>
            </div>
        </div>
    );
};

// ── COMPOSANT DE SURLIGNAGE STYLE FEUTRE PREMIUM ────────────────────────────────
const MarkerHighlight = ({ children, color = "rgba(20, 184, 166, 0.2)" }: { children: React.ReactNode, color?: string }) => (
    <span className="relative inline-block px-1 z-10">
        <span className="relative z-10">{children}</span>
        <svg 
            className="absolute left-0 bottom-0.5 w-full h-[65%] -z-10 pointer-events-none transform scale-x-105 overflow-visible"
            viewBox="0 0 100 10" 
            preserveAspectRatio="none"
        >
            <path 
                d="M0,5 Q20,2 40,6 T80,3 T100,5 L100,9 Q80,7 50,9 T15,7 Z" 
                fill={color} 
            />
        </svg>
    </span>
);

// ── FOND LIVE CANVAS (RÉSEAU INTERCONNECTÉ) ─────────────────────────────────────
const BackgroundParticles = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number; alpha: number }> = [];

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        const createParticles = () => {
            particles = [];
            const count = Math.min(Math.floor(canvas.width / 50), 40);
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.2,
                    vy: (Math.random() - 0.5) * 0.2,
                    radius: Math.random() * 2 + 0.5,
                    alpha: Math.random() * 0.1 + 0.03
                });
            }
        };

        resize();
        createParticles();
        window.addEventListener("resize", () => {
            resize();
            createParticles();
        });

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.strokeStyle = "rgba(99, 102, 241, 0.03)";
            ctx.lineWidth = 0.5;
            
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                    if (dist < 180) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            particles.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha})`;
                ctx.fill();

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
};

// ── BENTO GRID INTERACTIVE POUR LES DÉFIS ──────────────────────────────────────
interface ChallengeCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgGradient: string;
    solutionTitle: string;
    solutionDesc: string;
    kpi: string;
    kpiLabel: string;
    isActive: boolean;
    onHover: () => void;
}

const ChallengeCard = ({ 
    title, description, icon, color, bgGradient, 
    solutionTitle, solutionDesc, kpi, kpiLabel, 
    isActive, onHover 
}: ChallengeCardProps) => {
    return (
        <motion.div
            onMouseEnter={onHover}
            className={`relative cursor-pointer rounded-2xl p-6 transition-all duration-500 overflow-hidden ${
                isActive 
                    ? `shadow-2xl scale-[1.02] border-${color}-200` 
                    : 'shadow-sm hover:shadow-xl hover:scale-[1.01]'
            }`}
            style={{
                background: isActive ? bgGradient : "white",
                borderWidth: "1px",
                borderColor: isActive ? `rgba(var(--color-${color}), 0.3)` : "#e2e8f0"
            }}
            animate={{
                scale: isActive ? 1.02 : 1,
                transition: { duration: 0.3 }
            }}
        >
            {isActive && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -inset-1 bg-linear-to-r from-transparent via-white/20 to-transparent opacity-0 animate-shimmer" />
                </div>
            )}
            
            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 mb-4 ${
                    isActive ? `bg-${color}-500 text-white shadow-md` : `bg-${color}-50 text-${color}-500`
                }`}>
                    {icon}
                </div>
                
                {!isActive ? (
                    <>
                        <h3 className="text-slate-900 font-extrabold text-lg mb-2">
                            {title}
                        </h3>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">
                            {description}
                        </p>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-slate-900 font-extrabold text-lg">
                                {solutionTitle}
                            </h3>
                            <div className="flex flex-col items-end">
                                <span className={`text-2xl font-black text-${color}-600`}>{kpi}</span>
                                <span className="text-[10px] text-slate-400">{kpiLabel}</span>
                            </div>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed font-medium">
                            {solutionDesc}
                        </p>
                        <div className="mt-4 flex items-center gap-2">
                            <span className={`text-xs font-semibold text-${color}-600`}>Solution activée</span>
                            <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </>
                )}
            </div>
            
            {isActive && (
                <div className="absolute bottom-4 right-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

// ── COMPOSANTS DE VISUALISATION PREMIUM ─────────────────────────────────────────
const BudgetLeakPreview = () => (
    <div className="w-full h-full bg-slate-900 text-white flex flex-col justify-between p-6 relative overflow-hidden font-sans rounded-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(244,63,94,0.15),transparent_70%)]" />
        <div className="flex justify-between items-center z-10">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest text-rose-400 uppercase font-bold">Alerte Perte active</span>
            </div>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Frais Q2 — Hub Afrique</span>
        </div>
        <div className="my-auto space-y-4 z-10">
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white tracking-tight">-34%</span>
                <span className="text-xs font-bold text-rose-400">Écart d'alignement budgétaire</span>
            </div>
            <div className="w-full h-20 flex items-end gap-1 pt-2">
                {[45, 75, 55, 90, 60, 115, 140, 70, 95, 130].map((h, i) => (
                    <div 
                        key={i} 
                        style={{ height: `${h}%` }} 
                        className={`w-full rounded-t-sm transition-all duration-500 origin-bottom ${i === 6 || i === 9 ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'bg-slate-800'}`}
                    />
                ))}
            </div>
        </div>
        <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3 flex justify-between items-center z-10">
            <span>Flux de réservation non contrôlé</span>
            <span className="text-rose-400 font-bold font-mono">Impact : Direct</span>
        </div>
    </div>
);

const CseFragmentationPreview = () => (
    <div className="w-full h-full bg-slate-900 text-white flex flex-col justify-between p-6 relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(245,158,11,0.12),transparent_70%)]" />
        <div className="flex justify-between items-center z-10">
            <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">Données d'Engagement</span>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Suivi RH</span>
        </div>
        <div className="my-auto relative flex flex-col items-center justify-center gap-2 z-10">
            <div className="absolute top-2 left-0 bg-slate-800/80 border border-slate-700 shadow-xl px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-300 transform -rotate-3">Demandes perdues (Excel) 📄</div>
            <div className="absolute bottom-2 right-0 bg-slate-800/80 border border-slate-700 shadow-xl px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-300 transform rotate-3">Attente validation : 18 jours ⏳</div>
            <div className="text-3xl font-black text-amber-400 tracking-tight">-42%</div>
            <div className="text-xs font-medium text-slate-400 text-center max-w-45">Baisse de participation aux subventions</div>
        </div>
        <div className="text-[11px] text-center text-slate-500 border-t border-slate-800 pt-3 z-10">
            Fragmentation due à la dispersion des outils locaux
        </div>
    </div>
);

const ComplianceRiskPreview = () => (
    <div className="w-full h-full bg-slate-900 text-white flex flex-col justify-between p-6 relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.12),transparent_70%)]" />
        <div className="flex justify-between items-center z-10">
            <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase font-bold">Réglementation & Taxes</span>
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 px-2 py-0.5 rounded font-mono">ID: Audit-2026</span>
        </div>
        <div className="my-auto space-y-2 z-10">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-200 truncate">Réglementation Fiscale UEMOA</p>
                    <p className="text-[10px] text-slate-400 font-medium">Écarts critiques sur la récupération TVA</p>
                </div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-200 truncate">Loi de Finance Sociale</p>
                    <p className="text-[10px] text-slate-400 font-medium">Plafonds d'exonération CSE dépassés</p>
                </div>
            </div>
        </div>
        <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5 z-10">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Risque d'ajustement fiscal imminent
        </div>
    </div>
);

// ── COMPOSANTS VISUELS PREMIUM (INTERACTIONS AVEC ÉCRANS IMAGES & ROI) ──────────
const TravelConsolePreview = () => (
    <div className="w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col font-sans">
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-800" />
                    <span className="w-3 h-3 rounded-full bg-slate-800" />
                    <span className="w-3 h-3 rounded-full bg-slate-800" />
                </div>
                <span className="text-xs font-mono text-slate-400 tracking-wider uppercase">AfrikVoyage // Analytics Platform</span>
            </div>
            <div className="bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded text-[10px] text-teal-400 font-mono font-bold">
                Optimisation IA active
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-5 relative h-48 md:h-full min-h-45 bg-slate-950">
                <img 
                    src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80" 
                    alt="Gestion des flux aériens professionnels" 
                    className="w-full h-full object-cover opacity-60 mix-blend-luminosity grayscale group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[11px] font-mono text-teal-400 font-bold uppercase tracking-wider">Couverture Globale</p>
                    <p className="text-xs text-white font-medium mt-0.5">Centralisation des politiques multi-compagnies.</p>
                </div>
            </div>

            <div className="md:col-span-7 p-5 flex flex-col justify-between bg-slate-900 border-l border-slate-800/60">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-xs font-medium text-slate-400">Évolution globale des dépenses</p>
                            <h4 className="text-xl font-black text-white tracking-tight mt-0.5">-30% sur l'année</h4>
                        </div>
                        <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                            ROI Atteint
                        </span>
                    </div>

                    <div className="relative h-24 w-full mt-4 flex items-end">
                        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <path d="M 0 20 Q 25 15, 50 35 T 100 25" fill="none" stroke="rgba(244,63,94,0.4)" strokeWidth="2" strokeDasharray="4" />
                            <path d="M 0 80 Q 25 50, 50 40 T 100 15" fill="none" stroke="#14b8a6" strokeWidth="3" />
                        </svg>
                        
                        <div className="w-full flex justify-between text-[9px] font-mono text-slate-500 z-10 pt-2 border-t border-slate-800/60 mt-auto">
                            <span>Jan</span>
                            <span>Mai</span>
                            <span>Sep</span>
                            <span>Déc</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/40 mt-4">
                    <div>
                        <span className="text-[10px] font-medium text-slate-500 block">Sans AfrikVoyage</span>
                        <span className="text-xs font-bold text-rose-400 font-mono">Budget exponentiel</span>
                    </div>
                    <div>
                        <span className="text-[10px] font-medium text-slate-500 block">Avec plateforme</span>
                        <span className="text-xs font-bold text-teal-400 font-mono">Dépenses maîtrisées</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const CseWorkspacePreview = () => (
    <div className="w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col font-sans">
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-800" />
                    <span className="w-3 h-3 rounded-full bg-slate-800" />
                    <span className="w-3 h-3 rounded-full bg-slate-800" />
                </div>
                <span className="text-xs font-mono text-slate-400 tracking-wider uppercase">AfrikCSE // Service Gallery</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-mono text-slate-400">98% d'adoption active</span>
            </div>
        </div>

        <div className="p-5 space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">Avantages disponibles</h4>
                    <p className="text-sm font-bold text-white mt-0.5">Sélection personnalisée pour vos équipes</p>
                </div>
                <span className="text-[11px] font-medium text-slate-400 hover:text-white cursor-pointer flex items-center gap-1">
                    Voir tout 
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="relative h-28 rounded-xl overflow-hidden border border-slate-800 group/item bg-slate-950">
                    <img 
                        src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=300&q=80" 
                        alt="Bons d'achat et alimentation" 
                        className="w-full h-full object-cover opacity-40 group-hover/item:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                        <span className="text-[9px] font-bold bg-amber-500/20 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded uppercase">Alimentation</span>
                        <p className="text-[11px] font-extrabold text-white mt-1">Chèques Resto & Paniers</p>
                    </div>
                </div>

                <div className="relative h-28 rounded-xl overflow-hidden border border-slate-800 group/item bg-slate-950">
                    <img 
                        src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=300&q=80" 
                        alt="Santé, sport et bien-être" 
                        className="w-full h-full object-cover opacity-40 group-hover/item:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                        <span className="text-[9px] font-bold bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-1.5 py-0.5 rounded uppercase">Bien-être</span>
                        <p className="text-[11px] font-extrabold text-white mt-1">Abonnements Sport & Santé</p>
                    </div>
                </div>

                <div className="relative h-28 rounded-xl overflow-hidden border border-slate-800 group/item bg-slate-950">
                    <img 
                        src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=300&q=80" 
                        alt="Formations et e-learning" 
                        className="w-full h-full object-cover opacity-40 group-hover/item:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                        <span className="text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded uppercase">Éducation</span>
                        <p className="text-[11px] font-extrabold text-white mt-1">Formations & E-learning</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const CheckIcon = () => (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
);

// ── COMPOSANT PRINCIPAL ────────────────────────────────────────────────────────
export default function ChallengesAndSolutions() {
    const [activeChallenge, setActiveChallenge] = useState<number>(0);
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
    const controls = useAnimation();

    useEffect(() => {
        if (isInView) {
            controls.start("visible");
        }
    }, [isInView, controls]);

    const challenges = [
        {
            title: "Fuite des capitaux & Angles morts",
            description: "Les dépenses de voyage d'affaires explosent de manière opaque. Sans contrôle analytique en amont de l'achat, l'ajustement budgétaire en temps réel reste impossible.",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            color: "rose",
            bgGradient: "linear-gradient(135deg, #fff 0%, #fff1f0 100%)",
            solutionTitle: "Contrôle budgétaire IA",
            solutionDesc: "Notre IA analyse et bloque automatiquement les dépenses hors politique avant validation, réduisant les fuites de 34%.",
            kpi: "-34%",
            kpiLabel: "fuites détectées",
            preview: <BudgetLeakPreview />
        },
        {
            title: "Fragmentation des avantages CSE",
            description: "La gestion manuelle et distribuée des comités sociaux nuit à la cohésion. Les collaborateurs profitent peu de leurs privilèges à cause de processus complexes.",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
            color: "amber",
            bgGradient: "linear-gradient(135deg, #fff 0%, #fffaf0 100%)",
            solutionTitle: "Portail unifié des avantages",
            solutionDesc: "Centralisez tous vos avantages dans une interface B2C moderne, augmentant la participation de 42%.",
            kpi: "+42%",
            kpiLabel: "participation",
            preview: <CseFragmentationPreview />
        },
        {
            title: "Risque de non-conformité fiscale",
            description: "Naviguer sans garde-fou à travers les lois douanières, les taxes régionales d'hébergement et les normes d'audit expose les groupes à des redressements majeurs.",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
            color: "blue",
            bgGradient: "linear-gradient(135deg, #fff 0%, #eff6ff 100%)",
            solutionTitle: "Bouclier de conformité",
            solutionDesc: "Nos algorithmes surveillent en temps réel les réglementations locales et vous alertent avant les échéances critiques.",
            kpi: "99.2%",
            kpiLabel: "conformité",
            preview: <ComplianceRiskPreview />
        }
    ];

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
        <div ref={sectionRef} className="relative w-full bg-white overflow-hidden border-t border-slate-100">
            {/* Trame technique d'arrière-plan */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
            
            <BackgroundParticles />

            {/* Halos de lumière épurés */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-12 right-1/4 w-125 h-125 rounded-full bg-indigo-50/30 blur-[130px]" />
                <div className="absolute bottom-12 left-1/4 w-125 h-125 rounded-full bg-teal-50/20 blur-[130px]" />
            </div>

            {/* ── TRUST BAR (Bandeau de logos) - Collé en haut ── */}
            <TrustBar />

            {/* ── SECTION DÉFIS ET SOLUTIONS ── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-24 relative z-10">
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants} className="text-center mb-16">
                        <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-600 rounded-full mb-4">
                            Diagnostic 2026
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
                            className="tracking-tight mb-5"
                        >
                            Les frictions qui freinent votre croissance
                        </h2>
                        <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                            Le paysage des entreprises africaines exige une agilité maximale, pourtant les anciens processus manuels créent des barrières invisibles.
                        </p>
                    </motion.div>

                    {/* Grille Bento Grid 3 colonnes + Vidéo */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
                        {/* 3 cartes challenges */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {challenges.slice(0, 2).map((challenge, idx) => (
                                <ChallengeCard
                                    key={idx}
                                    title={challenge.title}
                                    description={challenge.description}
                                    icon={challenge.icon}
                                    color={challenge.color}
                                    bgGradient={challenge.bgGradient}
                                    solutionTitle={challenge.solutionTitle}
                                    solutionDesc={challenge.solutionDesc}
                                    kpi={challenge.kpi}
                                    kpiLabel={challenge.kpiLabel}
                                    isActive={activeChallenge === idx}
                                    onHover={() => setActiveChallenge(idx)}
                                />
                            ))}
                            
                        </div>
                        
                        
                        {/* 3ème carte challenge - seule à droite */}
                        <div>
                            <ChallengeCard
                                key={2}
                                title={challenges[2].title}
                                description={challenges[2].description}
                                icon={challenges[2].icon}
                                color={challenges[2].color}
                                bgGradient={challenges[2].bgGradient}
                                solutionTitle={challenges[2].solutionTitle}
                                solutionDesc={challenges[2].solutionDesc}
                                kpi={challenges[2].kpi}
                                kpiLabel={challenges[2].kpiLabel}
                                isActive={activeChallenge === 2}
                                onHover={() => setActiveChallenge(2)}
                            />
                        </div>
                    </div>

                    {/* Zone de visualisation interactive */}
                    <motion.div variants={itemVariants} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl">
                        <div className="w-full h-6 flex items-center gap-2 px-2 mb-3 border-b border-slate-800 pb-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-mono font-bold text-slate-500 ml-2 tracking-wider uppercase">Audit d'interface analytique</span>
                        </div>
                        
                        <div className="bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden shadow-inner flex items-center justify-center min-h-80">
                            {challenges[activeChallenge]?.preview}
                        </div>
                    </motion.div>
                </motion.div>
            </section>
            {/* Section vidéo intégrée */}
                            <div className="md:col-span-2 w-5xl mx-auto mb-32 relative z-10">
                                <VideoSection />
                            </div>

            {/* ── SECTION SOLUTIONS UNIFIÉES AVEC KPIs VISIBLES ── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pb-20">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants} className="text-center mb-16">
                        <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-600 rounded-full mb-4">
                            Solutions unifiées
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
                            className="tracking-tight mb-5"
                        >
                            Deux piliers interconnectés, <br />une cohérence totale
                        </h2>
                        <p className="text-slate-500 text-base max-w-2xl mx-auto font-medium leading-relaxed">
                            Unifiez enfin la performance logistique et financière de vos déplacements avec la gestion de l'épanouissement social de vos collaborateurs.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
                        
                        {/* SOLUTION 1 : AFRIKVOYAGE */}
                        <motion.div variants={itemVariants} className="group relative rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col justify-between hover:border-teal-500/80 transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-1">
                            <div className="absolute -top-3 right-6 bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                                -30% de coûts
                            </div>
                            
                            <div className="space-y-6">
                                <TravelConsolePreview />

                                <div className="flex items-center gap-4 pt-2">
                                    <div className="w-11 h-11 bg-teal-50 border border-teal-100 text-teal-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </div>
                                    <h3 className="font-black text-slate-900 text-2xl tracking-tight">AfrikVoyage</h3>
                                </div>

                                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                                    Automatisez l'achat de billets, centralisez vos politiques de voyage régionales et suivez vos indicateurs de ROI en <MarkerHighlight color="rgba(20, 184, 166, 0.15)">temps réel</MarkerHighlight> sans friction administrative.
                                </p>

                                <div className="h-px bg-linear-to-r from-slate-200 via-transparent to-transparent" />

                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {AFRIKVOYAGE_FEATURES.map((f) => (
                                        <li key={f.title} className="flex items-start gap-3 text-slate-700">
                                            <span className="text-teal-600 bg-teal-50 p-1 rounded-md border border-teal-100 shadow-sm mt-0.5 shrink-0">
                                                <CheckIcon />
                                            </span>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-slate-900 leading-tight">{f.title}</p>
                                                    <span className="text-[10px] font-black text-emerald-600">{f.kpi}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug font-medium">{f.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-8">
                                <Link
                                    href="/companies/AfrikVoyage/dashboard"
                                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-teal-600 transition-all duration-200 shadow-lg shadow-slate-900/10 group/link w-full sm:w-auto justify-center"
                                >
                                    Accéder à la console AfrikVoyage
                                    <svg className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </motion.div>

                        {/* SOLUTION 2 : AFRIKCSE */}
                        <motion.div variants={itemVariants} className="group relative rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col justify-between hover:border-amber-500/80 transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-1">
                            <div className="absolute -top-3 right-6 bg-amber-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                                95% d'adoption
                            </div>
                            
                            <div className="space-y-6">
                                <CseWorkspacePreview />

                                <div className="flex items-center gap-4 pt-2">
                                    <div className="w-11 h-11 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-black text-slate-900 text-2xl tracking-tight">AfrikCSE</h3>
                                </div>

                                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                                    Boostez la satisfaction de vos talents via un portail d'avantages sociaux moderne. Offrez-leur un accès fluide à des <MarkerHighlight color="rgba(245, 158, 11, 0.15)">services exclusifs</MarkerHighlight> adaptés à leur quotidien.
                                </p>

                                <div className="h-px bg-linear-to-r from-slate-200 via-transparent to-transparent" />

                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {AFRIKCSE_FEATURES.map((f) => (
                                        <li key={f.title} className="flex items-start gap-3 text-slate-700">
                                            <span className="text-amber-600 bg-amber-50 p-1 rounded-md border border-amber-100 shadow-sm mt-0.5 shrink-0">
                                                <CheckIcon />
                                            </span>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-slate-900 leading-tight">{f.title}</p>
                                                    <span className="text-[10px] font-black text-emerald-600">{f.kpi}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug font-medium">{f.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-8">
                                <Link
                                    href="/companies/AfrikCSE/dashboard"
                                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-all duration-200 shadow-lg shadow-slate-900/10 group/link w-full sm:w-auto justify-center"
                                >
                                    Ouvrir le Workspace Avantages
                                    <svg className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </motion.div>

                    </div>
                </motion.div>
            </section>

            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-marquee {
                    animation: marquee 20s linear infinite;
                }
                .animate-shimmer {
                    animation: shimmer 1.5s ease-in-out infinite;
                }
                @keyframes ping {
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
                .animate-ping {
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
            `}</style>
        </div>
    );
}