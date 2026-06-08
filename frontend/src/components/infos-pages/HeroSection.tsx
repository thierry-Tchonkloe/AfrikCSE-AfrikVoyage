"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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

// ─── Illustration SVG par slide ───────────────────────────────────────────────
function SlideVisual({ type, accent }: { type: string; accent: string }) {
    if (type === "travel") return (
        <svg viewBox="0 0 320 160" className="w-full h-full">
            {/* Fond carte Afrique simplifiée */}
            <ellipse cx="160" cy="90" rx="100" ry="65" fill={accent + "18"} />
            {/* Continent africain simplifié */}
            <path d="M130,35 Q155,28 175,35 Q195,42 200,60 Q210,72 205,88 Q198,105 190,118 Q175,135 160,140 Q145,135 135,120 Q122,105 118,88 Q112,72 118,58 Q122,44 130,35Z"
                  fill={accent + "30"} stroke={accent} strokeWidth="1.5" strokeLinejoin="round"/>
            {/* Ligne de vol */}
            <path d="M100,115 Q135,55 220,45" stroke={accent} strokeWidth="1.5" strokeDasharray="4 3" fill="none"/>
            {/* Avion */}
            <g transform="translate(207,40) rotate(-35)">
                <rect x="-8" y="-4" width="16" height="8" rx="4" fill={accent}/>
                <polygon points="4,-4 12,-1 4,0" fill={accent}/>
                <polygon points="-4,-4 -4,-9 2,-4" fill={accent + "cc"}/>
            </g>
            {/* Points villes */}
            <circle cx="100" cy="115" r="4" fill={accent} opacity="0.9"/>
            <circle cx="100" cy="115" r="8" fill={accent} opacity="0.2"/>
            <circle cx="220" cy="45" r="4" fill={accent} opacity="0.9"/>
            <circle cx="220" cy="45" r="8" fill={accent} opacity="0.2"/>
            {/* Labels */}
            <text x="85" y="132" fontSize="9" fill={accent} fontFamily="system-ui" fontWeight="600">Lagos</text>
            <text x="208" y="38" fontSize="9" fill={accent} fontFamily="system-ui" fontWeight="600">Paris</text>
            {/* Badge approbation */}
            <rect x="48" y="50" width="72" height="24" rx="12" fill="#10B981" opacity="0.95"/>
            <text x="84" y="66" fontSize="9.5" fill="white" fontFamily="system-ui" fontWeight="700" textAnchor="middle">✓ Approuvé</text>
        </svg>
    );

    if (type === "enterprise") return (
        <svg viewBox="0 0 320 160" className="w-full h-full">
            {/* Hub central */}
            <circle cx="160" cy="80" r="22" fill={accent + "25"} stroke={accent} strokeWidth="1.5"/>
            <text x="160" y="84" fontSize="10" fill={accent} fontFamily="system-ui" fontWeight="700" textAnchor="middle">HQ</text>
            {/* Bureaux satellites */}
            {[
                {x:70,y:40,label:"Dakar"},{x:255,y:38,label:"Nairobi"},
                {x:55,y:120,label:"Abidjan"},{x:268,y:118,label:"Joburg"},
                {x:160,y:148,label:"Douala"},
            ].map((b, i) => (
                <g key={i}>
                    <line x1="160" y1="80" x2={b.x} y2={b.y}
                          stroke={accent} strokeWidth="0.8" strokeDasharray="3 2" opacity="0.5"/>
                    <circle cx={b.x} cy={b.y} r="14" fill={accent + "20"} stroke={accent} strokeWidth="1"/>
                    <text x={b.x} y={b.y + 4} fontSize="8" fill={accent} fontFamily="system-ui"
                          fontWeight="600" textAnchor="middle">{b.label}</text>
                </g>
            ))}
            {/* Pulse sur hub */}
            <circle cx="160" cy="80" r="30" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.3"/>
            <circle cx="160" cy="80" r="38" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.15"/>
            {/* Badge live */}
            <rect x="195" y="14" width="76" height="20" rx="10" fill={accent}/>
            <circle cx="207" cy="24" r="3.5" fill="white" opacity="0.9"/>
            <circle cx="207" cy="24" r="3.5" fill="white" opacity="0.4"/>
            <text x="225" y="28" fontSize="8.5" fill="white" fontFamily="system-ui" fontWeight="600">Live tracking</text>
        </svg>
    );

    if (type === "perks") return (
        <svg viewBox="0 0 320 160" className="w-full h-full">
            {/* Carte avantages */}
            <rect x="50" y="30" width="220" height="100" rx="12" fill={accent + "20"} stroke={accent} strokeWidth="1.2"/>
            <rect x="50" y="30" width="220" height="38" rx="12" fill={accent + "40"}/>
            <rect x="50" y="56" width="220" height="12" rx="0" fill={accent + "40"}/>
            <text x="70" y="52" fontSize="11" fill="white" fontFamily="system-ui" fontWeight="700">AfrikVoyage Business Card</text>
            {/* Points fidélité */}
            <text x="70" y="85" fontSize="9" fill={accent} fontFamily="system-ui" fontWeight="500" opacity="0.8">Points fidélité</text>
            <text x="70" y="100" fontSize="22" fill={accent} fontFamily="system-ui" fontWeight="800">12 480</text>
            {/* Avantages icônes */}
            {[
                {x:185, y:85, label:"Lounge"},
                {x:218, y:85, label:"Assur."},
                {x:251, y:85, label:"Visa"},
            ].map((item, i) => (
                <g key={i}>
                    <rect x={item.x - 12} y={item.y - 12} width="24" height="24" rx="6" fill={accent + "30"}/>
                    <text x={item.x} y={item.y + 4} fontSize="8" fill={accent} fontFamily="system-ui"
                          fontWeight="600" textAnchor="middle">{item.label}</text>
                </g>
            ))}
            {/* Badge niveau */}
            <rect x="195" y="102" width="60" height="18" rx="9" fill={accent}/>
            <text x="225" y="115" fontSize="8.5" fill="white" fontFamily="system-ui"
                  fontWeight="700" textAnchor="middle">Gold ★</text>
        </svg>
    );

    // analytics
    return (
        <svg viewBox="0 0 320 160" className="w-full h-full">
            {/* Axes */}
            <line x1="55" y1="20" x2="55" y2="130" stroke={accent} strokeWidth="1" opacity="0.4"/>
            <line x1="55" y1="130" x2="285" y2="130" stroke={accent} strokeWidth="1" opacity="0.4"/>
            {/* Barres dépenses par mois */}
            {[
                {x:75, h:55, v:"Jan"},{x:110, h:72, v:"Fév"},{x:145, h:48, v:"Mar"},
                {x:180, h:90, v:"Avr"},{x:215, h:65, v:"Mai"},{x:250, h:40, v:"Jun"},
            ].map((b, i) => (
                <g key={i}>
                    <rect x={b.x - 14} y={130 - b.h} width="28" height={b.h}
                          rx="3" fill={accent} opacity={i === 3 ? "0.9" : "0.45"}/>
                    <text x={b.x} y="143" fontSize="8" fill={accent} fontFamily="system-ui"
                          textAnchor="middle" opacity="0.7">{b.v}</text>
                </g>
            ))}
            {/* Ligne tendance */}
            <polyline points="75,75 110,58 145,82 180,40 215,65 250,90"
                      stroke={accent} strokeWidth="1.5" fill="none" strokeDasharray="4 2"/>
            {/* Badge économies */}
            <rect x="170" y="18" width="104" height="28" rx="8" fill={accent + "25"} stroke={accent} strokeWidth="1"/>
            <text x="222" y="29" fontSize="8" fill={accent} fontFamily="system-ui"
                  fontWeight="500" textAnchor="middle" opacity="0.8">Vs trimestre précédent</text>
            <text x="222" y="41" fontSize="12" fill={accent} fontFamily="system-ui"
                  fontWeight="800" textAnchor="middle">-18 400 €</text>
        </svg>
    );
}

export default function HeroSection() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [activeSlide, setActiveSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const progressRef = useRef<NodeJS.Timeout | null>(null);

    // ─── Auto-avance des slides ───────────────────────────────────────────────
    useEffect(() => {
        const DURATION = 4000;
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
                }, 350);
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
        }, 250);
    };

    const slide = SLIDES[activeSlide];

    // ─── Canvas animation ─────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const PARTICLE_COUNT = 420;

        const PHASES = [
            { name: "globe",      frames: 360 },
            { name: "scatter",    frames: 80  },
            { name: "africa",     frames: 400 },
            { name: "scatter2",   frames: 80  },
            { name: "enterprise", frames: 360 },
            { name: "scatter3",   frames: 80  },
        ] as const;
        type PhaseName = (typeof PHASES)[number]["name"];
        const TOTAL = PHASES.reduce((s, p) => s + p.frames, 0);
        let frame = 0;

        function getPhase(f: number): { name: PhaseName; t: number; dur: number } {
            let t = f % TOTAL;
            for (const p of PHASES) {
                if (t < p.frames) return { name: p.name, t, dur: p.frames };
                t -= p.frames;
            }
            return { name: "globe", t: 0, dur: 360 };
        }

        const AFRICA_OUTLINE = [
            [0.42,0.07],[0.46,0.05],[0.50,0.04],[0.54,0.05],[0.58,0.07],
            [0.62,0.09],[0.66,0.12],[0.69,0.16],[0.72,0.20],[0.74,0.24],
            [0.76,0.28],[0.77,0.32],[0.76,0.36],[0.74,0.39],
            [0.78,0.40],[0.80,0.43],[0.79,0.46],[0.76,0.48],
            [0.74,0.52],[0.72,0.57],[0.70,0.62],[0.68,0.67],
            [0.66,0.72],[0.64,0.77],[0.62,0.81],[0.59,0.85],
            [0.57,0.88],[0.54,0.91],[0.51,0.93],[0.48,0.91],[0.45,0.88],
            [0.42,0.83],[0.39,0.78],[0.37,0.73],[0.35,0.68],[0.33,0.63],
            [0.32,0.58],[0.30,0.53],[0.28,0.48],[0.27,0.43],[0.28,0.38],
            [0.30,0.34],[0.31,0.30],[0.30,0.27],[0.28,0.24],
            [0.27,0.21],[0.29,0.18],[0.32,0.16],[0.36,0.14],
            [0.39,0.11],[0.42,0.07],
        ] as number[][];

        function africaPoints(count: number): [number, number][] {
            const pts: [number, number][] = [];
            const cx = 0.52, cy = 0.52;
            for (let i = 0; i < count; i++) {
                const t = i / count;
                const seg = t * AFRICA_OUTLINE.length;
                const a = AFRICA_OUTLINE[Math.floor(seg) % AFRICA_OUTLINE.length];
                const b = AFRICA_OUTLINE[(Math.floor(seg) + 1) % AFRICA_OUTLINE.length];
                const frac = seg - Math.floor(seg);
                const ox = a[0] + (b[0] - a[0]) * frac;
                const oy = a[1] + (b[1] - a[1]) * frac;
                const depth = Math.random();
                const noise = (Math.random() - 0.5) * 0.04;
                pts.push([ox + (cx - ox) * depth + noise, oy + (cy - oy) * depth + noise]);
            }
            return pts;
        }

        const africaPts = africaPoints(PARTICLE_COUNT);

        function isAfricaGlobe(lat: number, lon: number): boolean {
            const lo = (lon * 180) / Math.PI;
            const la = (lat * 180) / Math.PI;
            if (lo < -18 || lo > 52) return false;
            if (la < -35 || la > 38) return false;
            if (la > 15 && (lo < -18 || lo > 38)) return false;
            if (la > 28 && (lo < 25 || lo > 38)) return false;
            return true;
        }

        interface P {
            sx: number; sy: number; sz: number;
            scatterX: number; scatterY: number;
            africaX: number; africaY: number;
            entX: number; entY: number;
            x: number; y: number;
            africa: boolean;
            size: number;
            pulse: number;
            pulseSpeed: number;
        }

        function buildParticles(): P[] {
            const list: P[] = [];
            const eCols = 18;
            const eRows = Math.ceil(PARTICLE_COUNT / eCols);
            const afScale = Math.min(width, height) * 0.88;
            const afCX = width * 0.50;
            const afCY = height * 0.50;

            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const phi = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);
                const theta = (Math.PI * (1 + Math.sqrt(5)) * i) % (2 * Math.PI);
                const lat = phi - Math.PI / 2;
                const lon = theta - Math.PI;
                const sx = Math.cos(lat) * Math.cos(lon);
                const sy = Math.sin(lat);
                const sz = Math.cos(lat) * Math.sin(lon);
                const eCol = i % eCols;
                const eRow = Math.floor(i / eCols);
                const [ax, ay] = africaPts[i];
                list.push({
                    sx, sy, sz,
                    scatterX: Math.random() * width,
                    scatterY: Math.random() * height,
                    africaX: afCX + (ax - 0.5) * afScale,
                    africaY: afCY + (ay - 0.5) * afScale,
                    entX: width * 0.07 + eCol * ((width * 0.86) / (eCols - 1)),
                    entY: height * 0.10 + eRow * ((height * 0.80) / Math.max(eRows - 1, 1)),
                    x: width * 0.5,
                    y: height * 0.5,
                    africa: isAfricaGlobe(lat, lon),
                    size: isAfricaGlobe(lat, lon) ? 2.6 : 1.4 + Math.random() * 1.0,
                    pulse: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.025 + Math.random() * 0.03,
                });
            }
            return list;
        }

        let particles = buildParticles();

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            particles = buildParticles();
        };
        window.addEventListener("resize", handleResize);

        function lerp(a: number, b: number, k: number) { return a + (b - a) * k; }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            const { name: phase, t } = getPhase(frame);
            const rotY = frame * 0.010;
            const cosR = Math.cos(rotY);
            const sinR = Math.sin(rotY);
            const R = Math.min(width, height) * 0.26;
            const gCX = width > 900 ? width * 0.34 : width * 0.5;
            const gCY = height * 0.5;
            const eCols = 18;

            if (phase === "enterprise") {
                const alpha = Math.min(t / 60, 1) * 0.09;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = "#6366F1";
                ctx.lineWidth = 0.5;
                for (let i = 0; i < PARTICLE_COUNT; i += 4) {
                    const a = particles[i];
                    const b = particles[(i + eCols) % PARTICLE_COUNT];
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
                ctx.restore();
            }

            if (phase === "africa") {
                const alpha = Math.min(t / 80, 1) * 0.07;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = "#10B981";
                ctx.lineWidth = 0.4;
                for (let i = 0; i < PARTICLE_COUNT; i += 6) {
                    const a = particles[i];
                    const b = particles[(i + 12) % PARTICLE_COUNT];
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
                ctx.restore();
            }

            for (const p of particles) {
                p.pulse += p.pulseSpeed;
                const pv = (Math.sin(p.pulse) + 1) / 2;
                let tx = p.x, ty = p.y;
                let lerpK = 0.06;

                if (phase === "globe") {
                    const rx = p.sx * cosR - p.sz * sinR;
                    const ry = p.sy;
                    const rz = p.sx * sinR + p.sz * cosR;
                    tx = gCX + rx * R;
                    ty = gCY - ry * R;
                    const depth = (rz + 1) / 2;
                    const visible = rz > -0.3;
                    if (p.africa) {
                        const gs = p.size * (1.0 + pv * 0.8) * (0.5 + depth * 0.6);
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, gs * 2.5, 0, Math.PI * 2);
                        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gs * 2.5);
                        g.addColorStop(0, `rgba(16,185,129,${0.15 * pv})`);
                        g.addColorStop(1, "rgba(16,185,129,0)");
                        ctx.fillStyle = g;
                        ctx.globalAlpha = 1;
                        ctx.fill();
                        ctx.globalAlpha = visible ? 0.5 + pv * 0.5 : 0.05;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, Math.max(gs, 0.5), 0, Math.PI * 2);
                        ctx.fillStyle = `hsl(${158 + pv * 20},${70 + pv * 30}%,${50 + pv * 20}%)`;
                        ctx.fill();
                    } else {
                        ctx.globalAlpha = visible ? (0.15 + depth * 0.55) : 0.03;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, Math.max(p.size * (0.4 + depth * 0.7), 0.5), 0, Math.PI * 2);
                        ctx.fillStyle = "#818CF8";
                        ctx.fill();
                    }
                } else if (phase === "scatter" || phase === "scatter2" || phase === "scatter3") {
                    tx = p.scatterX;
                    ty = p.scatterY;
                    lerpK = 0.045;
                    ctx.globalAlpha = 0.18 + pv * 0.12;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
                    ctx.fillStyle = p.africa ? "#10B981" : "#818CF8";
                    ctx.fill();
                } else if (phase === "africa") {
                    tx = p.africaX;
                    ty = p.africaY;
                    lerpK = 0.05;
                    const fadeIn = Math.min(t / 120, 1);
                    const blink = 0.35 + pv * 0.65;
                    if (pv > 0.6) {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
                        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.8);
                        g.addColorStop(0, `rgba(16,185,129,${0.12 * fadeIn})`);
                        g.addColorStop(1, "rgba(16,185,129,0)");
                        ctx.fillStyle = g;
                        ctx.globalAlpha = 1;
                        ctx.fill();
                    }
                    ctx.globalAlpha = blink * fadeIn;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * (0.8 + pv * 0.5), 0, Math.PI * 2);
                    ctx.fillStyle = `hsl(${158 + pv * 25},${75 + pv * 25}%,${48 + pv * 22}%)`;
                    ctx.fill();
                } else if (phase === "enterprise") {
                    tx = p.entX + Math.sin(frame * 0.025 + p.pulse) * 2.5;
                    ty = p.entY + Math.cos(frame * 0.020 + p.pulse) * 2.5;
                    lerpK = 0.04;
                    const isHub = Math.floor(p.entX / ((width * 0.86) / (eCols - 1))) % 3 === 0;
                    const fadeIn = Math.min(t / 90, 1);
                    const color = p.africa ? "#10B981" : (isHub ? "#818CF8" : "#94A3B8");
                    const sz = p.africa ? p.size * 1.3 : (isHub ? p.size * 1.1 : p.size * 0.75);
                    ctx.globalAlpha = fadeIn * (0.28 + pv * 0.42);
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                }

                p.x = lerp(p.x, tx, lerpK);
                p.y = lerp(p.y, ty, lerpK);
            }

            ctx.globalAlpha = 1;
            frame++;
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <section
            id="hero"
            className="relative w-full overflow-hidden flex items-center"
            style={{
                background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #1E1B4B 100%)",
                minHeight: "calc(100vh - 64px)",
            }}
        >
            {/* CANVAS */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

            {/* HALOS */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 -right-24 w-150 h-150 rounded-full opacity-20 blur-[150px] animate-pulse"
                     style={{ background: "#6366F1" }} />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full opacity-10 blur-[100px]"
                     style={{ background: "#10B981" }} />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 z-10 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* ── GAUCHE ── */}
                    <div className="flex flex-col gap-8 bg-slate-900/10 backdrop-blur-[2px] p-4 rounded-2xl">
                        <h1
                            style={{ fontFamily: "Sanomat, ui-serif", fontWeight: 600, fontSize: "45px", lineHeight: "54px" }}
                            className="text-white tracking-tight"
                        >
                            Pilotez vos <span className="text-indigo-400">voyages</span>.<br />
                            Propulsez vos <span className="text-emerald-400">avantages</span>.
                        </h1>
                        <p className="text-slate-300 text-lg sm:text-xl leading-relaxed max-w-lg font-medium">
                            L'unique plateforme africaine et internationale qui unifie la gestion
                            de vos déplacements professionnels et l'épanouissement de vos équipes.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5 mt-4">
                            <Link href="#"
                                className="inline-flex items-center justify-center bg-[#6366F1] hover:bg-[#818CF8] text-white font-bold text-lg px-8 py-4 rounded-xl transition-all duration-300 shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:scale-[1.02] transform">
                                Demander une démo
                            </Link>
                            <Link href="/infos/platform"
                                className="inline-flex items-center justify-center border-2 border-slate-700 hover:border-indigo-500 hover:bg-white/5 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all duration-300">
                                Découvrir la plateforme
                            </Link>
                        </div>
                    </div>

                    {/* ── DROITE : Carrousel narratif ── */}
                    <div className="relative flex flex-col gap-4">

                        {/* Carte principale */}
                        <div
                            className="relative rounded-2xl border border-white/10 overflow-hidden transition-all duration-300"
                            style={{
                                background: "rgba(15,23,42,0.75)",
                                backdropFilter: "blur(16px)",
                                opacity: isAnimating ? 0 : 1,
                                transform: isAnimating ? "translateY(8px)" : "translateY(0)",
                            }}
                        >
                            {/* Barre de phase */}
                            <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-white/5">
                                <span className="text-xl">{slide.icon}</span>
                                <span className="text-xs font-semibold uppercase tracking-widest"
                                      style={{ color: slide.accent }}>{slide.phase}</span>
                                <div className="ml-auto flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full animate-ping" style={{ background: slide.accent }} />
                                    <span className="text-xs text-slate-400">En direct</span>
                                </div>
                            </div>

                            {/* Zone illustration */}
                            <div className="px-5 pt-4 pb-2" style={{ height: "168px" }}>
                                <SlideVisual type={slide.visual} accent={slide.accent} />
                            </div>

                            {/* Texte */}
                            <div className="px-5 pb-4">
                                <h3 className="text-white font-bold text-lg leading-snug mb-1">
                                    {slide.headline}
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {slide.detail}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-px border-t border-white/5">
                                {slide.stats.map((s, i) => (
                                    <div key={i} className="px-5 py-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                                        <p className="text-xs text-slate-500 mb-0.5">{s.label}</p>
                                        <p className="text-lg font-black" style={{ color: slide.accent }}>{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Barre de progression */}
                            <div className="h-0.5 w-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                                <div
                                    className="h-full transition-none"
                                    style={{ width: `${progress}%`, background: slide.accent }}
                                />
                            </div>
                        </div>

                        {/* Dots de navigation */}
                        <div className="flex items-center justify-center gap-3 pt-1">
                            {SLIDES.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => goToSlide(i)}
                                    className="transition-all duration-300 rounded-full"
                                    style={{
                                        width: i === activeSlide ? "28px" : "8px",
                                        height: "8px",
                                        background: i === activeSlide ? s.accent : "rgba(255,255,255,0.2)",
                                    }}
                                    aria-label={`Slide ${i + 1}`}
                                />
                            ))}
                        </div>

                        {/* Mini-cartes de contexte (les 3 autres slides en miniature) */}
                        <div className="grid grid-cols-3 gap-2 mt-1">
                            {SLIDES.filter((_, i) => i !== activeSlide).map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => goToSlide(SLIDES.indexOf(s))}
                                    className="rounded-xl border border-white/8 p-3 text-left transition-all duration-200 hover:border-white/20 hover:scale-[1.02]"
                                    style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(8px)" }}
                                >
                                    <span className="text-base">{s.icon}</span>
                                    <p className="text-xs font-semibold mt-1 leading-tight"
                                       style={{ color: s.accent }}>{s.phase}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}