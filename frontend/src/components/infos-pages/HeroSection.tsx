"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useAnimation, useInView } from "framer-motion";
import Image from "next/image";

// ─── Données des slides narratives ───────────────────────────────────────────
const SLIDES = [
    {
        phase: "Réservation intelligente",
        headline: "Voyages d'affaires, sans friction",
        detail: "Vols, hôtels, visas — tout sur une seule interface. Approbation en 1 clic.",
        accent: "#10B981",
        icon: "✈️",
        stats: [
            { label: "Économies moyennes", value: "-30%" },
            { label: "Temps de réservation", value: "< 3 min" },
        ],
        visual: "travel",
    },
    {
        phase: "Gestion d'équipe",
        headline: "Vos équipes, partout en Afrique",
        detail: "Suivi en temps réel des déplacements. Dashboard RH centralisé. Alertes de sécurité automatiques.",
        accent: "#6366F1",
        icon: "🏢",
        stats: [
            { label: "Pays couverts", value: "54" },
            { label: "Visibilité", value: "Temps réel" },
        ],
        visual: "enterprise",
    },
    {
        phase: "Avantages & fidélité",
        headline: "Propulsez les avantages salariés",
        detail: "Points fidélité, remboursements, accès lounges et assurance voyage intégrée.",
        accent: "#F59E0B",
        icon: "🎯",
        stats: [
            { label: "Avantages actifs", value: "12+" },
            { label: "Satisfaction équipe", value: "+47%" },
        ],
        visual: "perks",
    },
    {
        phase: "Analytique & contrôle",
        headline: "Piloter, c'est mesurer",
        detail: "Rapports de dépenses, conformité politique voyage, prévisions budgétaires par département.",
        accent: "#8B5CF6",
        icon: "📊",
        stats: [
            { label: "Rapport généré", value: "Auto" },
            { label: "Conformité", value: "99.2%" },
        ],
        visual: "analytics",
    },
];

// Données pour le carrousel mobile
const MOBILE_CAROUSEL_ITEMS = [
    {
        id: "booking",
        title: "Smart Booking",
        icon: "✈️",
        content: (
            <div className="p-4">
                <div className="flex gap-2 mb-3 border-b border-slate-200 pb-2">
                    <button className="flex-1 py-2 text-sm font-semibold text-indigo-600 border-b-2 border-indigo-500">Vols</button>
                    <button className="flex-1 py-2 text-sm font-medium text-slate-500">Hôtels</button>
                    <button className="flex-1 py-2 text-sm font-medium text-slate-500">Services</button>
                </div>
                <input
                    type="text"
                    placeholder="Destination..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 mb-3"
                />
                <div className="p-2 bg-indigo-50 rounded-lg">
                    <p className="text-xs text-indigo-700">💡 IA suggère : Vol direct → Économie -18%</p>
                </div>
            </div>
        )
    },
    {
        id: "dashboard",
        title: "Dashboard Admin",
        icon: "📊",
        content: (
            <div className="p-4">
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">Budget Q2 2026</span>
                            <span className="font-semibold">142 500€ / 210 000€</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="w-[68%] h-full bg-indigo-500 rounded-full" />
                        </div>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Conformité</span>
                        <span className="font-semibold text-emerald-600">99.2%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Alertes notes de frais</span>
                        <span className="font-semibold text-amber-600">2 en attente</span>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: "employee",
        title: "Espace Employé",
        icon: "📱",
        content: (
            <div className="p-4 space-y-2">
                <div className="bg-indigo-100 rounded-lg p-2">
                    <p className="text-indigo-800 text-sm font-medium">🎁 Chèques cadeaux Noël</p>
                    <p className="text-indigo-600 text-xs">Disponible dans 3 jours</p>
                </div>
                <div className="bg-emerald-100 rounded-lg p-2">
                    <p className="text-emerald-800 text-sm font-medium">✈️ Vol retardé → Paris</p>
                    <p className="text-emerald-600 text-xs">✓ Hôtel reprogrammé automatiquement</p>
                </div>
            </div>
        )
    }
];

// ─── Composant vidéo avec deux vidéos en arrière-plan ─────────────────────────
function BackgroundVideo() {
    const video1Ref = useRef<HTMLVideoElement>(null);
    const video2Ref = useRef<HTMLVideoElement>(null);
    const [currentVideo, setCurrentVideo] = useState(0);

    useEffect(() => {
        const video1 = video1Ref.current;
        const video2 = video2Ref.current;
        if (!video1 || !video2) return;

        const playVideo = async () => {
            try {
                await video1.play();
            } catch (e) {
                console.log("Video autoplay blocked:", e);
            }
        };

        playVideo();

        const handleVideo1End = () => {
            video1.pause();
            video2.play();
            setCurrentVideo(1);
        };

        const handleVideo2End = () => {
            video2.pause();
            video1.play();
            setCurrentVideo(0);
        };

        video1.addEventListener("ended", handleVideo1End);
        video2.addEventListener("ended", handleVideo2End);

        return () => {
            video1.removeEventListener("ended", handleVideo1End);
            video2.removeEventListener("ended", handleVideo2End);
            video1.pause();
            video2.pause();
        };
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            <video
                ref={video1Ref}
                autoPlay
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                style={{ 
                    opacity: currentVideo === 0 ? 1 : 0,
                    filter: "brightness(1.05) contrast(1.02)" 
                }}
            >
                <source src="/videos/bg-video1.mp4" type="video/mp4" />
            </video>
            <video
                ref={video2Ref}
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                style={{ 
                    opacity: currentVideo === 1 ? 1 : 0,
                    filter: "brightness(1.05) contrast(1.02)" 
                }}
            >
                <source src="/videos/bg-video2.mp4" type="video/mp4" />
            </video>
        </div>
    );
}

// ─── Animation du globe en particules qui forme l'Afrique (version fluide) ────
function GlobeToAfricaAnimation() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [animationState, setAnimationState] = useState<'globe' | 'exploding' | 'africa'>('globe');
    const [progress, setProgress] = useState(0);
    const animationRef = useRef<number | null>(null); // CORRECTION: initialisé à null
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimationState('exploding');
            const startTime = Date.now();
            const duration = 2000; // 2 secondes pour l'explosion
            
            const animateProgress = () => {
                const elapsed = Date.now() - startTime;
                const newProgress = Math.min(elapsed / duration, 1);
                setProgress(newProgress);
                
                if (newProgress < 1) {
                    animationRef.current = requestAnimationFrame(animateProgress);
                } else {
                    setAnimationState('africa');
                }
            };
            
            animationRef.current = requestAnimationFrame(animateProgress);
        }, 3000);
        
        return () => {
            clearTimeout(timer);
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        let animationFrameId: number;
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        
        let rotationY = 0;
        const rotationSpeed = 0.002;
        const globeRadius = Math.min(width, height) * 0.2;
        const centerX = width / 2;
        const centerY = height / 2;
        
        interface Particle {
            globeX: number;
            globeY: number;
            globeZ: number;
            africaX: number;
            africaY: number;
            currentX: number;
            currentY: number;
            size: number;
            color: string;
            isAfrica: boolean;
        }
        
        // Contour précis de l'Afrique
        const AFRICA_OUTLINE: [number, number][] = [
            [0.28, 0.32], [0.30, 0.30], [0.32, 0.28], [0.35, 0.29],
            [0.33, 0.33], [0.31, 0.35], [0.29, 0.34], [0.38, 0.30],
            [0.40, 0.28], [0.42, 0.27], [0.44, 0.29], [0.43, 0.32],
            [0.41, 0.33], [0.39, 0.31], [0.45, 0.35], [0.47, 0.34],
            [0.49, 0.33], [0.50, 0.36], [0.48, 0.38], [0.46, 0.37],
            [0.44, 0.36], [0.52, 0.40], [0.54, 0.39], [0.56, 0.38],
            [0.58, 0.40], [0.57, 0.42], [0.55, 0.43], [0.53, 0.41],
            [0.62, 0.42], [0.64, 0.41], [0.66, 0.43], [0.65, 0.45],
            [0.63, 0.46], [0.61, 0.44], [0.60, 0.43], [0.36, 0.34],
            [0.34, 0.36], [0.37, 0.37], [0.51, 0.37], [0.53, 0.35],
            [0.59, 0.39], [0.67, 0.44], [0.68, 0.42], [0.47, 0.40],
            [0.49, 0.41], [0.50, 0.43], [0.52, 0.44],
        ];
        
        const PARTICLES_COUNT = 400;
        const particles: Particle[] = [];
        
        // Création des particules avec distribution uniforme
        for (let i = 0; i < PARTICLES_COUNT; i++) {
            const phi = Math.acos(1 - (2 * (i + 0.5)) / PARTICLES_COUNT);
            const theta = (Math.PI * (1 + Math.sqrt(5)) * i) % (2 * Math.PI);
            const lat = phi - Math.PI / 2;
            const lon = theta - Math.PI;
            
            const sx = Math.cos(lat) * Math.cos(lon);
            const sy = Math.sin(lat);
            const sz = Math.cos(lat) * Math.sin(lon);
            
            const africaIndex = i % AFRICA_OUTLINE.length;
            const [ax, ay] = AFRICA_OUTLINE[africaIndex];
            const africaX = centerX + (ax - 0.5) * globeRadius * 2.4;
            const africaY = centerY + (ay - 0.5) * globeRadius * 2.2;
            
            const isAfrica = (lat > 0.2 && lat < 0.8 && lon > -0.9 && lon < 0.7);
            
            particles.push({
                globeX: sx,
                globeY: sy,
                globeZ: sz,
                africaX,
                africaY,
                currentX: centerX + sx * globeRadius,
                currentY: centerY - sy * globeRadius,
                size: isAfrica ? 2.8 : 1.5,
                color: isAfrica ? "#10B981" : "#6366F1",
                isAfrica
            });
        }
        
        let time = 0;
        
        function animate() {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);
            time += 0.016;
            
            if (animationState === 'globe') {
                rotationY += rotationSpeed;
            }
            
            for (const p of particles) {
                let targetX: number, targetY: number;
                
                if (animationState === 'globe') {
                    const rx = p.globeX * Math.cos(rotationY) - p.globeZ * Math.sin(rotationY);
                    const ry = p.globeY;
                    targetX = centerX + rx * globeRadius;
                    targetY = centerY - ry * globeRadius;
                } else if (animationState === 'exploding') {
                    const rx = p.globeX * Math.cos(rotationY) - p.globeZ * Math.sin(rotationY);
                    const ry = p.globeY;
                    const globeX = centerX + rx * globeRadius;
                    const globeY = centerY - ry * globeRadius;
                    const easeProgress = 1 - Math.pow(1 - progress, 2); // easing cubic out
                    targetX = globeX + (p.africaX - globeX) * easeProgress;
                    targetY = globeY + (p.africaY - globeY) * easeProgress;
                } else {
                    targetX = p.africaX;
                    targetY = p.africaY;
                }
                
                // Mouvement fluide
                p.currentX = p.currentX * 0.95 + targetX * 0.05;
                p.currentY = p.currentY * 0.95 + targetY * 0.05;
                
                const pulse = 0.6 + Math.sin(time * 2 + p.currentX * 0.02) * 0.4;
                const finalSize = p.size * (animationState === 'africa' ? 1.3 : 1) * pulse;
                
                // Effet de brillance pour l'Afrique
                if (animationState === 'africa' && p.isAfrica) {
                    ctx.beginPath();
                    ctx.arc(p.currentX, p.currentY, finalSize * 2, 0, Math.PI * 2);
                    const gradient = ctx.createRadialGradient(p.currentX, p.currentY, 0, p.currentX, p.currentY, finalSize * 2);
                    gradient.addColorStop(0, `rgba(16, 185, 129, 0.4)`);
                    gradient.addColorStop(1, `rgba(16, 185, 129, 0)`);
                    ctx.fillStyle = gradient;
                    ctx.fill();
                }
                
                ctx.beginPath();
                ctx.arc(p.currentX, p.currentY, finalSize, 0, Math.PI * 2);
                
                if (animationState === 'africa' && p.isAfrica) {
                    ctx.fillStyle = `rgba(16, 185, 129, 0.9)`;
                } else {
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = 0.5 + pulse * 0.3;
                }
                ctx.fill();
            }
            
            ctx.globalAlpha = 1;
            animationFrameId = requestAnimationFrame(animate);
        }
        
        animate();
        
        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", handleResize);
        
        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [animationState, progress]);
    
    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none z-10" 
            style={{ opacity: 0.9 }}
        />
    );
}

// ─── Composant pour les formes ovales difformes animées ──────────────────────
function AnimatedBlobShapes({ color1, color2, isActive }: { color1: string; color2: string; isActive: boolean }) {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg 
                className="absolute -top-48 -left-48 w-125 h-125 opacity-30"
                viewBox="0 0 500 500"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    animation: isActive ? "floatBlob1 8s ease-in-out infinite" : "none"
                }}
            >
                <path 
                    d="M250,50 C320,45 400,100 430,180 C460,260 450,350 390,410 C330,470 220,480 140,440 C60,400 10,310 15,220 C20,130 180,55 250,50Z" 
                    fill={color1}
                    stroke={color1}
                    strokeWidth="3"
                    strokeDasharray="12 8"
                    opacity="0.5"
                />
            </svg>
            
            <svg 
                className="absolute -bottom-48 -right-48 w-137.5 h-137.5 opacity-30"
                viewBox="0 0 550 550"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    animation: isActive ? "floatBlob3 9s ease-in-out infinite" : "none"
                }}
            >
                <path 
                    d="M275,60 C360,55 450,120 490,210 C530,300 510,400 440,460 C370,520 240,530 150,480 C60,430 10,330 20,230 C30,130 190,65 275,60Z" 
                    fill={color2}
                    stroke={color2}
                    strokeWidth="3"
                    strokeDasharray="14 6"
                    opacity="0.5"
                />
            </svg>
        </div>
    );
}

// ─── Composant pour l'image - hauteur 80% du container ────────────────────────
function StyledImageCard({ 
    src, 
    alt, 
    title, 
    description,
    color1,
    color2,
    isActive
}: { 
    src: string; 
    alt: string; 
    title: string; 
    description: string;
    color1: string;
    color2: string;
    isActive: boolean;
}) {
    return (
        <div className="relative group w-full h-full">
            <AnimatedBlobShapes color1={color1} color2={color2} isActive={isActive} />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-transparent transition-all duration-500 group-hover:shadow-3xl h-full min-h-125">
                <div className="relative h-full w-full min-h-125">
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className="object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent rounded-2xl" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/90 via-black/50 to-transparent rounded-b-2xl">
                    <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-white/80 text-base leading-relaxed">{description}</p>
                    <button className="mt-4 text-white/90 font-semibold text-sm hover:text-white transition flex items-center gap-2 group/btn">
                        Découvrir la solution
                        <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Composant pour le contenu droit alternatif - hauteur 80% ─────────────────
function RightContent({ 
    type, 
    onComplete 
}: { 
    type: 'widget' | 'image1' | 'image2'; 
    onComplete?: () => void;
}) {
    const [isImageActive, setIsImageActive] = useState(false);

    useEffect(() => {
        if (type !== 'widget') {
            setIsImageActive(true);
            if (onComplete) {
                const timer = setTimeout(() => {
                    onComplete();
                    setIsImageActive(false);
                }, 5000);
                return () => clearTimeout(timer);
            }
        }
    }, [type, onComplete]);

    if (type === 'image1') {
        return (
            <StyledImageCard
                src="/images/dashboard-roi.jpeg"
                alt="Gestion des avantages salariés"
                title="Gestion centralisée des avantages"
                description="Plateforme intuitive pour gérer l'ensemble des avantages de vos collaborateurs : chèques cadeaux, mutuelle, titres restaurant, et bien plus."
                color1="#6366F1"
                color2="#10B981"
                isActive={isImageActive}
            />
        );
    }

    if (type === 'image2') {
        return (
            <StyledImageCard
                src="/images/control.png"
                alt="Dashboard contrôle budgétaire"
                title="Contrôle budgétaire en temps réel"
                description="Suivez vos dépenses, automatisez les notes de frais et optimisez votre politique de voyage avec notre dashboard intelligent."
                color1="#8B5CF6"
                color2="#F59E0B"
                isActive={isImageActive}
            />
        );
    }

    // Widget par défaut
    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xl bg-white/80 backdrop-blur-xl">
                <div className="flex border-b border-slate-200">
                    <button className="flex-1 py-5 text-center text-lg font-semibold text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/50">✈️ Vols</button>
                    <button className="flex-1 py-5 text-center text-lg font-medium text-slate-600 hover:text-indigo-600 transition">🏨 Hôtels</button>
                    <button className="flex-1 py-5 text-center text-lg font-medium text-slate-600 hover:text-emerald-600 transition">🎁 Services CSE</button>
                </div>
                <div className="p-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Vers où souhaitez-vous voyager ? (ex: Paris, Dakar, Nairobi...)"
                            className="w-full px-6 py-5 pr-14 border border-slate-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition text-lg"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-5 text-base text-slate-500">
                        <span>✈️ Paris · 12 mai → 15 mai</span>
                        <span className="text-emerald-600 font-semibold">🌿 Score carbone: B+</span>
                    </div>
                    <div className="mt-5 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-base text-indigo-700">
                            <span className="font-semibold">💡 IA suggère :</span> Vol direct + Hôtel Mercure → Économie -18%
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-4">
                <div className="col-span-3 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Dashboard Admin</span>
                        <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Live</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Budget Q2 2026</span>
                            <span className="font-semibold text-slate-800">142 500€ / 210 000€</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="w-[68%] h-full bg-indigo-500 rounded-full" />
                        </div>
                        <div className="flex justify-between text-sm mt-3">
                            <span className="text-slate-500">Conformité politique voyage</span>
                            <span className="font-semibold text-emerald-600">99.2%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Alertes notes de frais</span>
                            <span className="font-semibold text-amber-600">2 en attente</span>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-2">
                        <span>🤖 IA: 12 factures scannées</span>
                        <span className="text-emerald-600">✓ Conformes</span>
                    </div>
                </div>

                <div className="col-span-2 rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-700 p-4 shadow-xl border border-indigo-300 relative">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-white/40 rounded-full" />
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-white text-lg">📱</span>
                        <span className="text-xs font-medium text-white/80">Espace Employé</span>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3 mb-2">
                        <p className="text-white text-sm font-medium">🎁 Chèques cadeaux Noël</p>
                        <p className="text-white/70 text-xs">Disponible dans 3 jours</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                        <p className="text-white text-sm font-medium">✈️ Vol retardé → Paris</p>
                        <p className="text-emerald-200 text-xs">✓ Hôtel reprogrammé automatiquement</p>
                    </div>
                    <div className="absolute -top-3 -right-3 bg-white rounded-full px-3 py-1 shadow-md">
                        <span className="text-xs font-bold text-indigo-600">✨ IA actif</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Illustration SVG par slide (simplifié pour garder le code lisible) ──────
function SlideVisual({ type, accent }: { type: string; accent: string }) {
    return (
        <div className="w-full h-full flex items-center justify-center text-2xl">
            <span style={{ color: accent }}>{type === "travel" ? "✈️" : type === "enterprise" ? "🏢" : type === "perks" ? "🎯" : "📊"}</span>
        </div>
    );
}

// Composant de carrousel mobile
function MobileCarousel() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const nextSlide = () => {
        setDirection(1);
        setActiveIndex((prev) => (prev + 1) % MOBILE_CAROUSEL_ITEMS.length);
    };

    const prevSlide = () => {
        setDirection(-1);
        setActiveIndex((prev) => (prev - 1 + MOBILE_CAROUSEL_ITEMS.length) % MOBILE_CAROUSEL_ITEMS.length);
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
        <div className="relative">
            <div className="flex items-center justify-between mb-3">
                <button onClick={prevSlide} className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                    ←
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-lg">{MOBILE_CAROUSEL_ITEMS[activeIndex].icon}</span>
                    <span className="font-semibold text-slate-800">{MOBILE_CAROUSEL_ITEMS[activeIndex].title}</span>
                </div>
                <button onClick={nextSlide} className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                    →
                </button>
            </div>
            <motion.div
                key={activeIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 overflow-hidden"
            >
                {MOBILE_CAROUSEL_ITEMS[activeIndex].content}
            </motion.div>
            <div className="flex items-center justify-center gap-2 mt-3">
                {MOBILE_CAROUSEL_ITEMS.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className={`transition-all duration-300 rounded-full ${i === activeIndex ? 'w-6 h-1.5 bg-indigo-600' : 'w-1.5 h-1.5 bg-slate-300'}`}
                    />
                ))}
            </div>
        </div>
    );
}

export default function HeroSection() {
    const [activeSlide, setActiveSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const progressRef = useRef<NodeJS.Timeout | null>(null);
    
    const [rightContentType, setRightContentType] = useState<'widget' | 'image1' | 'image2'>('widget');
    
    const textAnimations = useAnimation();
    const textRef = useRef(null);
    const textInView = useInView(textRef, { once: true, amount: 0.1 });

    useEffect(() => {
        if (textInView) {
            textAnimations.start("visible");
        }
    }, [textInView, textAnimations]);

    useEffect(() => {
        const cycleContent = () => {
            setRightContentType('image1');
            setTimeout(() => {
                setRightContentType('image2');
                setTimeout(() => {
                    setRightContentType('widget');
                }, 6000);
            }, 6000);
        };
        const interval = setInterval(cycleContent, 18000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const DURATION = 4500;
        const TICK = 50;

        const startCycle = () => {
            setProgress(0);
            progressRef.current = setInterval(() => {
                setProgress(p => Math.min(p + (TICK / DURATION) * 100, 100));
            }, TICK);
            intervalRef.current = setTimeout(() => {
                setIsAnimating(true);
                setTimeout(() => {
                    setActiveSlide(s => (s + 1) % SLIDES.length);
                    setIsAnimating(false);
                    startCycle();
                }, 300);
            }, DURATION);
        };

        startCycle();
        return () => {
            if (intervalRef.current) clearTimeout(intervalRef.current);
            if (progressRef.current) clearInterval(progressRef.current);
        };
    }, []);

    const goToSlide = (i: number) => {
        if (intervalRef.current) clearTimeout(intervalRef.current);
        if (progressRef.current) clearInterval(progressRef.current);
        setIsAnimating(true);
        setTimeout(() => {
            setActiveSlide(i);
            setIsAnimating(false);
            setProgress(0);
        }, 200);
    };

    const slide = SLIDES[activeSlide];

    const textContainerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
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
                delay: 0.8,
                ease: "easeOut" as const
            }
        }
    };

    const badgeVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
                duration: 0.5, 
                delay: 0.3,
                ease: "easeOut" as const
            }
        }
    };

    return (
        <section
            id="hero"
            className="relative w-full overflow-hidden flex items-center"
            style={{ minHeight: "calc(100vh - 64px)" }}
        >
            <BackgroundVideo />
            
            <div className="absolute inset-0 bg-white/25 z-5" />
            <div className="absolute inset-0 bg-linear-to-b from-white/10 via-transparent to-white/5 z-5" />

            <GlobeToAfricaAnimation />

            <motion.div 
                variants={badgeVariants}
                initial="hidden"
                animate={textInView ? "visible" : "hidden"}
                className="absolute top-8 left-8 z-20 hidden md:flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-full px-5 py-2.5 shadow-xl border border-emerald-200 animate-float"
            >
                <span className="text-2xl">📉</span>
                <div>
                    <p className="text-xs text-slate-600 font-medium">Économies moyennes</p>
                    <p className="text-xl font-black text-emerald-600 leading-none">-30%</p>
                </div>
                <div className="w-px h-8 bg-emerald-200 mx-2" />
                <div>
                    <p className="text-xs text-slate-600 font-medium">Score RSE</p>
                    <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                            <div className="w-[72%] h-full bg-emerald-500 rounded-full" />
                        </div>
                        <span className="text-xs font-semibold text-emerald-700">72%</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Empreinte carbone optimisée</p>
                </div>
            </motion.div>

            <motion.div 
                variants={badgeVariants}
                initial="hidden"
                animate={textInView ? "visible" : "hidden"}
                transition={{ delay: 0.5 }}
                className="absolute bottom-8 right-8 z-20 hidden md:flex items-center gap-3 bg-indigo-50/90 backdrop-blur-md rounded-2xl px-5 py-2.5 shadow-xl border border-indigo-200"
            >
                <span className="text-xl">⭐</span>
                <div>
                    <p className="text-xs text-indigo-600 font-semibold">Taux d'adoption</p>
                    <p className="text-xl font-black text-indigo-700 leading-tight">95%</p>
                </div>
            </motion.div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 z-15 w-full">
                
                <div className="hidden lg:grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
                    
                    <motion.div
                        ref={textRef}
                        initial="hidden"
                        animate={textAnimations}
                        variants={textContainerVariants}
                        className="flex flex-col gap-6 bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-xl border border-white/80"
                    >
                        <motion.div variants={textItemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100 rounded-full w-fit border border-indigo-200">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-xs font-semibold text-indigo-700 tracking-wide">AfrikVoyage × AfrikCSE</span>
                        </motion.div>
                        
                        <motion.h1 variants={textItemVariants} 
                            className="text-slate-900 text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.15]"
                            style={{ fontFamily: "Sanomat, ui-serif", fontWeight: 600 }}>
                            Pilotez vos <span className="text-indigo-600">voyages</span>.<br />
                            Propulsez vos <span className="text-emerald-600">avantages</span>.
                        </motion.h1>
                        
                        <motion.p variants={textItemVariants} 
                            className="text-slate-700 text-lg sm:text-xl leading-relaxed max-w-lg font-medium">
                            L'unique plateforme qui unifie la rigueur de la performance financière 
                            <span className="font-semibold text-indigo-600"> (AfrikVoyage)</span> et l'épanouissement des collaborateurs 
                            <span className="font-semibold text-emerald-600"> (AfrikCSE)</span> grâce à l'IA prédictive.
                        </motion.p>

                        <motion.div variants={textItemVariants} className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200">
                                <span className="text-emerald-600 text-sm">🌱</span>
                                <span className="text-xs font-medium text-emerald-700">Empreinte carbone optimisée</span>
                                <div className="w-20 h-1.5 bg-emerald-200 rounded-full ml-1 overflow-hidden">
                                    <div className="w-[68%] h-full bg-emerald-500 rounded-full" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={buttonVariants} className="flex flex-col sm:flex-row gap-4 mt-2">
                            <Link href="#"
                                className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-200 hover:scale-[1.02] transform">
                                Demander une démo
                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                            <Link href="/login"
                                className="inline-flex items-center justify-center border-2 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 font-semibold text-base px-6 py-3 rounded-xl transition-all duration-300">
                                Découvrir la plateforme
                            </Link>
                        </motion.div>

                        <motion.div variants={textItemVariants} className="pt-4 border-t border-slate-200">
                            <p className="text-xs text-slate-500 mb-3 text-center sm:text-left">Ils nous font confiance</p>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-6 opacity-70">
                                <span className="text-slate-600 font-semibold text-sm tracking-wider">ORANGE</span>
                                <span className="text-slate-600 font-semibold text-sm tracking-wider">TOTALENERGIES</span>
                                <span className="text-slate-600 font-semibold text-sm tracking-wider">ECOBANK</span>
                                <span className="text-slate-600 font-semibold text-sm tracking-wider">BRIDGECORP</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    <div className="relative w-full h-full flex flex-col">
                        <div className="flex-1 min-h-125">
                            <RightContent 
                                type={rightContentType} 
                                onComplete={() => {}}
                            />
                        </div>
                    </div>
                </div>

                {/* Version Mobile */}
                <div className="flex flex-col lg:hidden gap-5">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-col gap-4 bg-white/80 backdrop-blur-xl p-5 rounded-2xl shadow-xl border border-white/80"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100 rounded-full w-fit">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-xs font-semibold text-indigo-700">AfrikVoyage × AfrikCSE</span>
                        </div>
                        <h2 className="text-slate-900 text-3xl font-bold tracking-tight"
                            style={{ fontFamily: "Sanomat, ui-serif", fontWeight: 600 }}>
                            Pilotez vos <span className="text-indigo-600">voyages</span>.<br />
                            Propulsez vos <span className="text-emerald-600">avantages</span>.
                        </h2>
                        <p className="text-slate-700 text-sm leading-relaxed">
                            L'unique plateforme qui unifie la rigueur de la performance financière et l'épanouissement des collaborateurs.
                        </p>
                        <Link href="#" className="inline-flex items-center justify-center bg-indigo-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl">
                            Demander une démo
                        </Link>
                    </motion.div>

                    <MobileCarousel />

                    <div className="relative">
                        <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-white/80 backdrop-blur-xl">
                            <div className="flex items-center gap-2 px-3 pt-2 pb-1 border-b border-slate-100">
                                <span className="text-sm">{slide.icon}</span>
                                <span className="text-[10px] font-semibold uppercase" style={{ color: slide.accent }}>{slide.phase}</span>
                            </div>
                            <div className="px-3 pt-1 pb-1" style={{ height: "70px" }}>
                                <SlideVisual type={slide.visual} accent={slide.accent} />
                            </div>
                            <div className="px-3 pb-2">
                                <h4 className="text-slate-800 font-bold text-xs">{slide.headline}</h4>
                                <p className="text-slate-500 text-[10px]">{slide.detail}</p>
                            </div>
                            <div className="h-0.5 w-full bg-slate-100">
                                <div className="h-full transition-none" style={{ width: `${progress}%`, background: slide.accent }} />
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 pt-2">
                            {SLIDES.map((s, i) => (
                                <button key={i} onClick={() => goToSlide(i)}
                                    className="transition-all duration-300 rounded-full"
                                    style={{
                                        width: i === activeSlide ? "20px" : "5px",
                                        height: "5px",
                                        background: i === activeSlide ? s.accent : "#CBD5E1",
                                    }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                
                @keyframes floatBlob1 {
                    0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
                    25% { transform: translate(15px, -10px) rotate(5deg); }
                    50% { transform: translate(-10px, 20px) rotate(-3deg); }
                    75% { transform: translate(5px, -15px) rotate(2deg); }
                }
                
                @keyframes floatBlob3 {
                    0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
                    20% { transform: translate(-20px, 10px) rotate(-6deg); }
                    40% { transform: translate(10px, -15px) rotate(4deg); }
                    60% { transform: translate(-5px, -20px) rotate(-2deg); }
                    80% { transform: translate(15px, 5px) rotate(5deg); }
                }
            `}</style>
        </section>
    );
}