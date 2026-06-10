"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TeamMember { 
    name: string; 
    role: string; 
    title: string; 
    description: string; 
    initials: string; 
    color: string;
    linkedin?: string;
    email?: string;
}
interface VisionCard { 
    icon: string; 
    title: string; 
    subtitle: string; 
    description: string; 
    gridClass: string;
    badge?: { text: string; color: string };
    type: "voyage" | "cse" | "global";
    bg?: string; // Optionnel pour compatibilité
}
interface ValueCard {
    icon: string;
    title: string;
    description: string;
    points: string[];
    roiBadge?: { text: string; sub: string };
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const teamMembers: TeamMember[] = [
    { 
        name: "Amadou Diallo", 
        role: "CEO & Fondateur", 
        title: "CEO", 
        description: "Expert en fintech avec 15 ans d'expérience dans l'innovation technologique africaine. Ancien cadre chez Orange et pionnier du SaaS en Afrique de l'Ouest.", 
        initials: "AD", 
        color: "from-blue-400 to-teal-500",
        linkedin: "#",
        email: "amadou@afrikvoyage.com"
    },
    { 
        name: "Fatima Benali", 
        role: "CTO", 
        title: "CTO", 
        description: "Architecte logiciel passionnée par les solutions SaaS scalables et la sécurité des données. Experte en cloud computing et IA appliquée aux RH.", 
        initials: "FB", 
        color: "from-emerald-400 to-cyan-500",
        linkedin: "#",
        email: "fatima@afrikvoyage.com"
    },
    { 
        name: "Kwame Asante", 
        role: "COO", 
        title: "COO", 
        description: "Spécialiste en opérations et développement commercial avec une expertise des marchés africains. A piloté l'expansion de plusieurs startups à travers le continent.", 
        initials: "KA", 
        color: "from-amber-400 to-orange-500",
        linkedin: "#",
        email: "kwame@afrikvoyage.com"
    },
    { 
        name: "Aisha Kone", 
        role: "CPO", 
        title: "CPO", 
        description: "Experte en design produit et expérience utilisateur, focalisée sur l'innovation centrée utilisateur. Diplômée de l'ESSEC et ancienne chez Decathlon.", 
        initials: "AK", 
        color: "from-purple-400 to-pink-500",
        linkedin: "#",
        email: "aisha@afrikvoyage.com"
    },
];

const visionCards: VisionCard[] = [
    { 
        icon: "🌍", 
        title: "Pivot de la Transformation Africaine", 
        subtitle: "Écosystème Intégré",
        description: "Comprendre et servir les spécificités des entreprises africaines en devenant le pivot unique qui unifie la gestion des déplacements et les structures d'avantages sociaux.", 
        gridClass: "md:col-span-2 md:row-span-1",
        badge: { text: "Standard Régional", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
        type: "global"
    },
    { 
        icon: "✈️",
        title: "Expansion Internationale", 
        subtitle: "AfrikVoyage",
        description: "Fluidifier la mobilité des talents vers l'international tout en maintenant une conformité réglementaire absolue.", 
        gridClass: "md:col-span-1 md:row-span-1",
        type: "voyage"
    },
    { 
        icon: "🎁",
        title: "Croissance Durable & Bien-être", 
        subtitle: "AfrikCSE",
        description: "Accompagner la performance des collaborateurs avec une galerie de services style Netflix pour booster l'engagement au quotidien.", 
        gridClass: "md:col-span-1 md:row-span-1",
        type: "cse"
    },
    { 
        icon: "📈", 
        title: "Analytique Avancée & Performance", 
        subtitle: "Data & Insights",
        description: "Donner aux décideurs une visibilité en temps réel sur les dépenses grâce aux heatmaps et à la centralisation pour transformer le chaos en performance mesurable.", 
        gridClass: "md:col-span-2 md:row-span-1",
        badge: { text: "+47% Productivité", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
        type: "global"
    }
];

const valueCards: ValueCard[] = [
    { 
        icon: "💡", 
        title: "Innovation & Simplicité B2C", 
        description: "Nous repoussons les limites pour créer des parcours fluides et plaisants, traduisant la complexité administrative en une interface moderne.", 
        points: ["Interface pensée utilisateur", "Recherche prédictive", "Remboursements en 1 clic"],
        roiBadge: { text: "-30%", sub: "Coûts de gestion" }
    },
    { 
        icon: "🛡️", 
        title: "Confiance & Compliance", 
        description: "La sécurité est au cœur de nos relations. Notre système automatise le respect des réglementations locales et fiscales sans effort.", 
        points: ["Sécurité des données", "Contrôle budgétaire automatisé", "Conformité fiscale Afrique/Int."],
        roiBadge: { text: "Zéro", sub: "Erreur de conformité" }
    },
    { 
        icon: "🏆", 
        title: "Efficience Opérationnelle", 
        description: "Nous visons l'excellence dans chacun de nos modules, en mesurant directement notre succès par le retour sur investissement de nos clients.", 
        points: ["Visibilité des dépenses", "Heatmaps de dépenses", "Amélioration continue"],
        roiBadge: { text: "-30%", sub: "Frais de déplacement" }
    }
];

function useInView(ref: React.RefObject<HTMLElement | null>) {
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold: 0.15 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [ref]);
    return inView;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── HERO SECTION — "Le Carrefour" ────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function HeroSection() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [unlocked, setUnlocked] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setUnlocked(true), 1200);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        let raf: number;
        let W = (canvas.width = canvas.offsetWidth);
        let H = (canvas.height = canvas.offsetHeight);

        const PHASES = [
            { name: "chaos",   frames: 260 },
            { name: "fuse",    frames: 110 },
            { name: "spheres", frames: 280 },
            { name: "split",   frames: 90  },
            { name: "grid",    frames: 280 },
            { name: "scatter", frames: 90  },
        ] as const;
        type Ph = (typeof PHASES)[number]["name"];
        const TOTAL = PHASES.reduce((s, p) => s + p.frames, 0);
        let frame = 0;

        function getPhase(f: number): { name: Ph; t: number } {
            let t = f % TOTAL;
            for (const p of PHASES) { if (t < p.frames) return { name: p.name, t }; t -= p.frames; }
            return { name: "chaos", t: 0 };
        }
        const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

        const N = 400;
        interface P { x: number; y: number; chaosX: number; chaosY: number; sax: number; say: number; saz: number; sbx: number; sby: number; sbz: number; gridX: number; gridY: number; sphere: "A" | "B"; size: number; pulse: number; spd: number; }

        function build(): P[] {
            const list: P[] = [];
            const GC = 20, GR = Math.ceil(N / GC);
            for (let i = 0; i < N; i++) {
                const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
                const theta = (Math.PI * (1 + Math.sqrt(5)) * i) % (2 * Math.PI);
                const lat = phi - Math.PI / 2, lon = theta - Math.PI;
                const phi2 = Math.acos(1 - (2 * ((i + N / 2) % N + 0.5)) / N);
                const theta2 = (Math.PI * (1 + Math.sqrt(5)) * ((i + N / 2) % N)) % (2 * Math.PI);
                const lat2 = phi2 - Math.PI / 2, lon2 = theta2 - Math.PI;
                list.push({
                    x: Math.random() * W, y: Math.random() * H,
                    chaosX: Math.random() * W, chaosY: Math.random() * H,
                    sax: Math.cos(lat) * Math.cos(lon), say: Math.sin(lat), saz: Math.cos(lat) * Math.sin(lon),
                    sbx: Math.cos(lat2) * Math.cos(lon2), sby: Math.sin(lat2), sbz: Math.cos(lat2) * Math.sin(lon2),
                    gridX: W * 0.05 + (i % GC) * ((W * 0.9) / (GC - 1)),
                    gridY: H * 0.05 + Math.floor(i / GC) * ((H * 0.9) / Math.max(GR - 1, 1)),
                    sphere: i < N / 2 ? "A" : "B",
                    size: 1.1 + Math.random() * 1.5,
                    pulse: Math.random() * Math.PI * 2,
                    spd: 0.016 + Math.random() * 0.024,
                });
            }
            return list;
        }

        let pts = build();
        const onResize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; pts = build(); };
        window.addEventListener("resize", onResize);

        const animate = () => {
            ctx.clearRect(0, 0, W, H);
            const { name: ph, t } = getPhase(frame);
            const prog = easeOut(Math.min(t / 80, 1));
            const rotY = frame * 0.008;
            const cosR = Math.cos(rotY), sinR = Math.sin(rotY);
            const R = Math.min(W, H) * 0.22;
            const sep = W * 0.22;
            const cAX = W / 2 - sep, cBX = W / 2 + sep, cY = H * 0.48;

            if (ph === "spheres" || ph === "fuse" || ph === "chaos") {
                ctx.save();
                ctx.globalAlpha = 0.15;
                ctx.beginPath();
                ctx.arc(cAX, cY, R + 15, -Math.PI / 2, Math.PI / 2);
                ctx.strokeStyle = "#6366F1";
                ctx.lineWidth = 2.5;
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cBX, cY, R + 15, -Math.PI / 2, Math.PI / 2);
                ctx.strokeStyle = "#10B981";
                ctx.stroke();
                ctx.restore();
            }

            if (ph === "grid") {
                ctx.save(); ctx.globalAlpha = prog * 0.12; ctx.strokeStyle = "#6366F1"; ctx.lineWidth = 0.6;
                for (let i = 0; i < N; i += 2) { const a = pts[i], b = pts[(i + 15) % N]; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
                ctx.restore();
            }

            if (ph === "spheres" || ph === "fuse") {
                const a2 = (ph === "spheres" ? Math.min(t / 50, 1) : prog) * 0.35;
                ctx.save(); ctx.globalAlpha = a2;
                const gr = ctx.createLinearGradient(cAX, cY, cBX, cY);
                gr.addColorStop(0, "#6366F1"); gr.addColorStop(0.5, "#a5f3fc"); gr.addColorStop(1, "#10B981");
                ctx.strokeStyle = gr; ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]);
                ctx.beginPath(); ctx.moveTo(cAX, cY); ctx.lineTo(cBX, cY); ctx.stroke(); ctx.setLineDash([]);
                ctx.globalAlpha = a2 * 2.5;
                const cg = ctx.createRadialGradient(W / 2, cY, 0, W / 2, cY, 15);
                cg.addColorStop(0, "rgba(99,102,241,0.8)"); cg.addColorStop(1, "rgba(99,102,241,0)");
                ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(W / 2, cY, 15, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }

            for (const p of pts) {
                p.pulse += p.spd;
                const pv = (Math.sin(p.pulse) + 1) / 2;
                let tx = p.x, ty = p.y, lk = 0.05;

                if (ph === "chaos") {
                    tx = p.chaosX + Math.sin(frame * 0.019 + p.pulse) * 25;
                    ty = p.chaosY + Math.cos(frame * 0.016 + p.pulse) * 25;
                    lk = 0.03;
                    ctx.globalAlpha = 0.15 + pv * 0.2;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
                    ctx.fillStyle = p.sphere === "A" ? "#6366F1" : "#10B981"; ctx.fill();
                }
                else if (ph === "fuse" || ph === "spheres") {
                    const isA = p.sphere === "A";
                    const ux = isA ? p.sax : p.sbx, uy = isA ? p.say : p.sby, uz = isA ? p.saz : p.sbz;
                    const rx = ux * cosR - uz * sinR, ry = uy, rz = ux * sinR + uz * cosR;
                    const depth = (rz + 1) / 2;
                    const cx = isA ? cAX : cBX;
                    tx = cx + rx * R; ty = cY - ry * R; lk = 0.07;
                    const vis = rz > -0.2;
                    const sz = p.size * (0.5 + depth * 0.9);
                    if (pv > 0.5 && vis) {
                        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 4);
                        const bc = isA ? "99,102,241" : "16,185,129";
                        g.addColorStop(0, `rgba(${bc},${0.2 * pv})`); g.addColorStop(1, `rgba(${bc},0)`);
                        ctx.beginPath(); ctx.arc(p.x, p.y, sz * 4, 0, Math.PI * 2); ctx.fillStyle = g; ctx.globalAlpha = 1; ctx.fill();
                    }
                    ctx.globalAlpha = vis ? 0.2 + depth * 0.8 : 0.05;
                    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(sz, 0.5), 0, Math.PI * 2);
                    ctx.fillStyle = isA ? `hsl(${239 + pv * 14},${70 + pv * 18}%,${65 + pv * 14}%)` : `hsl(${158 + pv * 18},${68 + pv * 24}%,${52 + pv * 16}%)`; ctx.fill();
                }
                else if (ph === "split" || ph === "scatter") {
                    tx = p.gridX; ty = p.gridY; lk = 0.055;
                    ctx.globalAlpha = (ph === "scatter" ? 1 - prog : prog) * (0.25 + pv * 0.35);
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
                    ctx.fillStyle = p.sphere === "A" ? "#818CF8" : "#34D399"; ctx.fill();
                }
                else if (ph === "grid") {
                    tx = p.gridX + Math.sin(frame * 0.02 + p.pulse) * 3; ty = p.gridY + Math.cos(frame * 0.017 + p.pulse) * 3; lk = 0.04;
                    ctx.globalAlpha = Math.min(t / 80, 1) * (0.3 + pv * 0.4);
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
                    ctx.fillStyle = p.sphere === "A" ? "#818CF8" : "#34D399"; ctx.fill();
                }

                p.x = lerp(p.x, tx, lk); p.y = lerp(p.y, ty, lk);
            }

            ctx.globalAlpha = 1;
            frame++;
            raf = requestAnimationFrame(animate);
        };

        animate();
        return () => { window.removeEventListener("resize", onResize); cancelAnimationFrame(raf); };
    }, []);

    return (
        <section className="relative w-full overflow-hidden flex items-center" style={{ minHeight: "calc(100vh - 64px)", background: "#FFFFFF" }}>
            <div className="absolute inset-0 z-0" style={{ background: "#FFFFFF" }} />
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                 style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", backgroundSize: "120px" }} />
            <div className="absolute inset-0 z-0 opacity-[0.04]"
                 style={{ backgroundImage: "radial-gradient(circle, #6366F1 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute bottom-0 right-0 w-150 h-100 opacity-[0.08] blur-[120px]"
                     style={{ background: "radial-gradient(ellipse, #6366F1 0%, transparent 70%)" }} />
                <div className="absolute top-0 left-0 w-100 h-100 opacity-[0.06] blur-[100px]"
                     style={{ background: "radial-gradient(ellipse, #10B981 0%, transparent 70%)" }} />
            </div>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-100"
                    style={{ width: "100%", height: "100%" }} />
            <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="flex flex-col gap-7">
                        <div className="flex items-center gap-2 text-xs font-medium"
                             style={{ color: "rgba(0,0,0,0.45)", fontFamily: "Inter, system-ui, sans-serif" }}>
                            <span>À Propos</span>
                            <span>→</span>
                            <span style={{ color: "#6366F1" }}>Notre Histoire</span>
                        </div>
                        <div className="inline-flex w-fit items-center gap-2.5 px-4 py-2 rounded-full"
                             style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", fontFamily: "Inter, system-ui, sans-serif" }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#6366F1" }} />
                            <span className="text-xs font-semibold" style={{ color: "#4F46E5" }}>Basé en Afrique · Orienté vers le monde</span>
                        </div>
                        <h1 style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 800, fontSize: "clamp(34px, 5.5vw, 62px)", lineHeight: "1.06", color: "#1a1a2e" }}>
                            L&apos;architecte d&apos;une
                            <br />
                            gestion{" "}
                            <span style={{ background: "linear-gradient(92deg, #6366F1 0%, #38BDF8 50%, #10B981 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                                moderne
                            </span>
                            <br />
                            <span style={{ color: "rgba(0,0,0,0.55)", fontWeight: 600, fontSize: "0.78em" }}>
                                pour les entreprises africaines
                            </span>
                        </h1>
                        <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "clamp(15px, 1.8vw, 18px)", color: "rgba(0,0,0,0.65)", lineHeight: "1.72", maxWidth: "520px" }}>
                            Nous transformons la complexité administrative en avantage compétitif — en unifiant la gestion des voyages d&apos;affaires et des services salariés sur une seule plateforme.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl flex-1"
                                 style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
                                <span className="text-lg">✈️</span>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#6366F1", fontFamily: "Inter, system-ui, sans-serif" }}>AfrikVoyage</p>
                                    <p className="text-xs mt-0.5" style={{ color: "rgba(0,0,0,0.55)", fontFamily: "Inter, system-ui, sans-serif" }}>Contrôle prédictif des budgets voyage</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl flex-1"
                                 style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
                                <span className="text-lg">🎯</span>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#059669", fontFamily: "Inter, system-ui, sans-serif" }}>AfrikCSE</p>
                                    <p className="text-xs mt-0.5" style={{ color: "rgba(0,0,0,0.55)", fontFamily: "Inter, system-ui, sans-serif" }}>Galerie avantages salariés unifiée</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3 pt-1">
                            <Link href="#"
                                className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.03] hover:brightness-110 text-sm"
                                style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)", boxShadow: "0 0 24px rgba(99,102,241,0.3)", fontFamily: "Inter, system-ui, sans-serif" }}>
                                Planifier une démo
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </Link>
                            <Link href="/infos/manifeste"
                                className="inline-flex items-center font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 text-sm"
                                style={{ border: "1.5px solid rgba(0,0,0,0.12)", color: "#1a1a2e", fontFamily: "Inter, system-ui, sans-serif", background: "rgba(255,255,255,0.6)" }}>
                                Notre manifeste
                            </Link>
                        </div>
                    </div>
                    <div className="relative flex flex-col gap-4">
                        <div className="relative rounded-2xl overflow-hidden transition-all duration-700"
                            style={{
                                background: "rgba(255,255,255,0.85)",
                                backdropFilter: "blur(8px)",
                                border: "1px solid rgba(99,102,241,0.15)",
                                boxShadow: "0 25px 60px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
                                opacity: unlocked ? 1 : 0,
                                transform: unlocked ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
                            }}>
                            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full" style={{ background: "#FF5F57" }} />
                                        <div className="w-3 h-3 rounded-full" style={{ background: "#FEBC2E" }} />
                                        <div className="w-3 h-3 rounded-full" style={{ background: "#28C840" }} />
                                    </div>
                                    <span className="text-xs font-semibold ml-2" style={{ color: "rgba(0,0,0,0.5)", fontFamily: "Inter, system-ui, sans-serif" }}>AfrikVoyage · Dashboard</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#10B981" }} />
                                    <span className="text-xs" style={{ color: "#10B981", fontFamily: "Inter, system-ui, sans-serif" }}>Live</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-px" style={{ background: "rgba(0,0,0,0.04)" }}>
                                {[
                                    { label: "Budget restant", value: "€48 200", delta: "-12%", color: "#10B981" },
                                    { label: "Voyages ce mois", value: "143", delta: "+8", color: "#6366F1" },
                                    { label: "Économies", value: "-30%", delta: "vs N-1", color: "#059669" },
                                ].map((m, i) => (
                                    <div key={i} className="px-4 py-4" style={{ background: "rgba(255,255,255,0.95)" }}>
                                        <p className="text-xs mb-1" style={{ color: "rgba(0,0,0,0.5)", fontFamily: "Inter, system-ui, sans-serif" }}>{m.label}</p>
                                        <p className="text-lg font-black" style={{ color: m.color, fontFamily: "Inter, system-ui, sans-serif" }}>{m.value}</p>
                                        <p className="text-xs mt-0.5" style={{ color: "rgba(0,0,0,0.4)", fontFamily: "Inter, system-ui, sans-serif" }}>{m.delta}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="px-5 py-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.6)", fontFamily: "Inter, system-ui, sans-serif" }}>Dépenses / mois</p>
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)", color: "#059669", fontFamily: "Inter, system-ui, sans-serif" }}>↓ En baisse</span>
                                </div>
                                <div className="flex items-end gap-1.5 h-14">
                                    {[72, 88, 55, 95, 78, 62, 70, 48, 82, 58, 90, 44].map((h, i) => (
                                        <div key={i} className="flex-1 rounded-sm transition-all duration-700"
                                             style={{ height: `${h}%`, background: i === 11 ? "#10B981" : i === 3 ? "rgba(239,68,68,0.7)" : "rgba(99,102,241,0.5)", opacity: unlocked ? 1 : 0, transitionDelay: `${i * 60 + 400}ms` }} />
                                    ))}
                                </div>
                                <div className="flex justify-between mt-1">
                                    {["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"].map((m, i) => (
                                        <span key={i} className="flex-1 text-center" style={{ fontSize: "8px", color: "rgba(0,0,0,0.35)", fontFamily: "Inter, system-ui, sans-serif" }}>{m}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="px-5 pb-5">
                                <p className="text-xs font-semibold mb-2" style={{ color: "rgba(0,0,0,0.5)", fontFamily: "Inter, system-ui, sans-serif" }}>Approbations récentes</p>
                                <div className="flex flex-col gap-2">
                                    {[
                                        { name: "K. Mensah", dest: "Lagos → Abidjan", status: "✓ Approuvé", color: "#10B981" },
                                        { name: "A. Touré", dest: "Dakar → Paris", status: "⏳ En cours", color: "#F59E0B" },
                                        { name: "F. Diop", dest: "Douala → Nairobi", status: "✓ Approuvé", color: "#10B981" },
                                    ].map((r, i) => (
                                        <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)" }}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(99,102,241,0.15)", color: "#6366F1", fontFamily: "Inter, system-ui, sans-serif" }}>{r.name[0]}</div>
                                                <div>
                                                    <p className="text-xs font-medium" style={{ color: "#1a1a2e", fontFamily: "Inter, system-ui, sans-serif" }}>{r.name}</p>
                                                    <p className="text-xs" style={{ color: "rgba(0,0,0,0.5)", fontFamily: "Inter, system-ui, sans-serif" }}>{r.dest}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-semibold" style={{ color: r.color, fontFamily: "Inter, system-ui, sans-serif" }}>{r.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex -space-x-2">
                                {["AD","FB","KA","AK"].map((init, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2" style={{ background: ["#6366F1","#10B981","#F59E0B","#8B5CF6"][i], borderColor: "#FFFFFF", fontFamily: "Inter, system-ui, sans-serif" }}>{init}</div>
                                ))}
                            </div>
                            <p className="text-xs" style={{ color: "rgba(0,0,0,0.5)", fontFamily: "Inter, system-ui, sans-serif" }}><span style={{ color: "#1a1a2e", fontWeight: 600 }}>500+</span> entreprises font confiance</p>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full animate-bounce" style={{ animationDuration: "3.2s", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                                <span className="text-base font-black" style={{ color: "#10B981" }}>-30%</span>
                                <span className="text-xs" style={{ color: "#059669", fontFamily: "Inter, system-ui, sans-serif" }}>coûts voyage</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MISSION / PAIN POINTS — Bento Grid ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function PainPointCard({ children, className = "", style = {}, delay = 0 }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; delay?: number; }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref as React.RefObject<HTMLElement | null>);
    return (
        <div ref={ref} className={`rounded-2xl overflow-hidden transition-all duration-700 ${className}`}
             style={{ ...style, opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(28px)", transitionDelay: `${delay}ms` }}>
            {children}
        </div>
    );
}

function MissionSection() {
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const headerInView = useInView(headerRef as React.RefObject<HTMLElement | null>);

    const budgetData = [42, 58, 71, 65, 89, 94, 103, 98, 112];
    const [barH, setBarH] = useState(budgetData.map(() => 0));
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInView = useInView(chartRef as React.RefObject<HTMLElement | null>);
    useEffect(() => {
        if (!chartInView) return;
        const t = setTimeout(() => setBarH(budgetData), 200);
        return () => clearTimeout(t);
    }, [chartInView]);

    const [docCount, setDocCount] = useState(0);
    const docRef = useRef<HTMLDivElement>(null);
    const docInView = useInView(docRef as React.RefObject<HTMLElement | null>);
    useEffect(() => {
        if (!docInView) return;
        let count = 0;
        const interval = setInterval(() => { count += 7; setDocCount(Math.min(count, 247)); if (count >= 247) clearInterval(interval); }, 30);
        return () => clearInterval(interval);
    }, [docInView]);

    return (
        <section className="py-20 md:py-28" style={{ background: "#FFFFFF" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div ref={headerRef} className="text-center mb-16 transition-all duration-700" style={{ opacity: headerInView ? 1 : 0, transform: headerInView ? "translateY(0)" : "translateY(24px)" }}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontFamily: "Inter, system-ui, sans-serif" }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#EF4444" }} />
                        <span className="text-xs font-semibold" style={{ color: "#DC2626" }}>Les défis que vous vivez chaque jour</span>
                    </div>
                    <h2 style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 52px)", color: "#1a1a2e", lineHeight: "1.1" }}>
                        Reconnaissez-vous<br />
                        <span style={{ background: "linear-gradient(90deg, #EF4444, #F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ces situations ?</span>
                    </h2>
                    <p className="mt-5 max-w-2xl mx-auto" style={{ color: "rgba(0,0,0,0.6)", fontSize: "17px", lineHeight: "1.7", fontFamily: "Inter, system-ui, sans-serif" }}>
                        Chaque jour, les équipes RH et financières africaines perdent des heures précieuses à gérer manuellement ce que notre plateforme automatise en quelques clics.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
                    <PainPointCard delay={0} className="lg:col-span-2" style={{ background: "white", border: `1px solid ${hoveredCard === 0 ? "rgba(239,68,68,0.4)" : "rgba(0,0,0,0.08)"}`, boxShadow: hoveredCard === 0 ? "0 0 40px rgba(239,68,68,0.08), inset 0 0 40px rgba(239,68,68,0.02)" : "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.3s ease" }}>
                        <div ref={chartRef} className="p-7" onMouseEnter={() => setHoveredCard(0)} onMouseLeave={() => setHoveredCard(null)}>
                            <div className="flex items-start justify-between mb-6">
                                <div><div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(239,68,68,0.1)" }}><svg className="w-5 h-5" fill="none" stroke="#EF4444" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></div><p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#EF4444", fontFamily: "Inter, system-ui, sans-serif" }}>Point de douleur #1</p><h3 className="text-xl font-bold" style={{ color: "#1a1a2e", fontFamily: "Inter, system-ui, sans-serif" }}>Budgets voyage incontrôlés</h3><p className="text-sm mt-1" style={{ color: "rgba(0,0,0,0.55)", fontFamily: "Inter, system-ui, sans-serif" }}>Sans visibilité en temps réel, chaque déplacement coûte plus que prévu</p></div>
                                <div className="text-right"><p className="text-3xl font-black" style={{ color: "#EF4444", fontFamily: "Inter, system-ui, sans-serif" }}>+67%</p><p className="text-xs" style={{ color: "rgba(239,68,68,0.7)", fontFamily: "Inter, system-ui, sans-serif" }}>dépassement moyen</p></div>
                            </div>
                            <div className="flex items-end gap-2 h-24 mb-3">{barH.map((h, i) => (<div key={i} className="flex-1 rounded-t transition-all duration-700 relative" style={{ height: `${(h / 112) * 100}%`, background: i >= 6 ? "rgba(239,68,68,0.8)" : "rgba(239,68,68,0.4)", transitionDelay: `${i * 80}ms` }}>{i === 8 && (<div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap" style={{ color: "#EF4444", fontFamily: "Inter, system-ui, sans-serif" }}>+103k€</div>)}</div>))}</div>
                            <div className="flex items-center gap-2"><div className="flex-1 h-px" style={{ background: "rgba(239,68,68,0.2)" }} /><p className="text-xs" style={{ color: "rgba(239,68,68,0.6)", fontFamily: "Inter, system-ui, sans-serif" }}>Tendance sur 9 mois</p><div className="flex-1 h-px" style={{ background: "rgba(239,68,68,0.2)" }} /></div>
                            <div className="mt-5 flex flex-wrap gap-2">{["Billet Air France 2 340€", "Hôtel sans bon", "Note de frais perdue", "Double facturation", "Dépassement Q3"].map((tag, i) => (<span key={i} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "rgba(239,68,68,0.8)", fontFamily: "Inter, system-ui, sans-serif" }}>{tag}</span>))}</div>
                        </div>
                    </PainPointCard>

                    <PainPointCard delay={100} style={{ background: "white", border: `1px solid ${hoveredCard === 1 ? "rgba(245,158,11,0.4)" : "rgba(0,0,0,0.08)"}`, boxShadow: hoveredCard === 1 ? "0 0 40px rgba(245,158,11,0.08)" : "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.3s ease" }}>
                        <div ref={docRef} className="p-7 h-full flex flex-col" onMouseEnter={() => setHoveredCard(1)} onMouseLeave={() => setHoveredCard(null)}>
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(245,158,11,0.1)" }}><svg className="w-5 h-5" fill="none" stroke="#F59E0B" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#F59E0B", fontFamily: "Inter, system-ui, sans-serif" }}>Point de douleur #2</p>
                            <h3 className="text-xl font-bold mb-2" style={{ color: "#1a1a2e", fontFamily: "Inter, system-ui, sans-serif" }}>Chaos administratif CSE</h3>
                            <p className="text-sm mb-6" style={{ color: "rgba(0,0,0,0.55)", fontFamily: "Inter, system-ui, sans-serif" }}>Des centaines de dossiers salariés à gérer manuellement, sans système unifié</p>
                            <div className="rounded-xl p-5 text-center mt-auto" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)" }}><p className="text-4xl font-black mb-1" style={{ color: "#F59E0B", fontFamily: "Inter, system-ui, sans-serif" }}>{docCount}</p><p className="text-xs" style={{ color: "rgba(245,158,11,0.7)", fontFamily: "Inter, system-ui, sans-serif" }}>dossiers en attente de traitement</p><div className="mt-3 flex items-center justify-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: "#F59E0B" }} /><span className="text-xs" style={{ color: "rgba(245,158,11,0.6)", fontFamily: "Inter, system-ui, sans-serif" }}>Mise à jour en temps réel</span></div></div>
                            <div className="mt-5 flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(245,158,11,0.03)", border: "1px dashed rgba(245,158,11,0.15)" }}><div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: "rgba(245,158,11,0.1)" }}>😩</div><div><p className="text-xs font-semibold" style={{ color: "#1a1a2e", fontFamily: "Inter, system-ui, sans-serif" }}>Kofi, RH Manager, Accra</p><p className="text-xs" style={{ color: "rgba(245,158,11,0.8)", fontFamily: "Inter, system-ui, sans-serif" }}>"Je passe 3h/jour à trier des emails de remboursement."</p></div></div>
                        </div>
                    </PainPointCard>

                    <PainPointCard delay={200} style={{ background: "white", border: `1px solid ${hoveredCard === 2 ? "rgba(139,92,246,0.4)" : "rgba(0,0,0,0.08)"}`, boxShadow: hoveredCard === 2 ? "0 0 40px rgba(139,92,246,0.08)" : "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.3s ease" }}>
                        <div className="p-7 flex flex-col h-full" onMouseEnter={() => setHoveredCard(2)} onMouseLeave={() => setHoveredCard(null)}>
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(139,92,246,0.1)" }}><svg className="w-5 h-5" fill="none" stroke="#8B5CF6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#8B5CF6", fontFamily: "Inter, system-ui, sans-serif" }}>Point de douleur #3</p>
                            <h3 className="text-xl font-bold mb-2" style={{ color: "#1a1a2e", fontFamily: "Inter, system-ui, sans-serif" }}>Friction réglementaire</h3>
                            <p className="text-sm mb-6" style={{ color: "rgba(0,0,0,0.55)", fontFamily: "Inter, system-ui, sans-serif" }}>Naviguer entre les réglementations de 54 pays africains manuellement</p>
                            <div className="flex flex-col gap-2 mt-auto"><p className="text-xs font-semibold mb-1" style={{ color: "rgba(139,92,246,0.8)", fontFamily: "Inter, system-ui, sans-serif" }}>Sans AfrikVoyage :</p>{["Visa Éthiopie — expiré !", "Assurance Sénégal — manquante", "Conformité fiscale — non vérifiée"].map((item, i) => (<div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}><span className="text-sm">⚠️</span><span className="text-xs" style={{ color: "#DC2626", fontFamily: "Inter, system-ui, sans-serif" }}>{item}</span></div>))}</div>
                        </div>
                    </PainPointCard>

                    <PainPointCard delay={300} className="md:col-span-2 lg:col-span-2" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(99,102,241,0.05) 100%)", border: "1px solid rgba(16,185,129,0.15)" }}>
                        <div className="p-7"><div className="flex items-center gap-4 mb-6"><div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: "rgba(16,185,129,0.1)" }}>✨</div><div><p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#10B981", fontFamily: "Inter, system-ui, sans-serif" }}>La transformation</p><h3 className="text-xl font-bold" style={{ color: "#1a1a2e", fontFamily: "Inter, system-ui, sans-serif" }}>AfrikVoyage & AfrikCSE changent tout</h3></div></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[
                            { before: "Budget incontrôlé", after: "Prédictif & automatisé", icon: "📊" },
                            { before: "247 dossiers en attente", after: "Zéro backlog RH", icon: "✅" },
                            { before: "Conformité manuelle", after: "Bouclier automatique", icon: "🛡️" },
                        ].map((item, i) => (<div key={i} className="flex flex-col gap-3"><div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}><span className="text-xs line-through" style={{ color: "rgba(239,68,68,0.7)", fontFamily: "Inter, system-ui, sans-serif" }}>{item.before}</span></div><div className="flex items-center justify-center"><span className="text-lg">{item.icon}</span></div><div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}><span className="text-xs font-semibold" style={{ color: "#059669", fontFamily: "Inter, system-ui, sans-serif" }}>{item.after}</span></div></div>))}</div>
                        <div className="mt-6 flex flex-col sm:flex-row items-center gap-4"><Link href="#" className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)", boxShadow: "0 0 20px rgba(99,102,241,0.3)", fontFamily: "Inter, system-ui, sans-serif" }}>Découvrir la solution<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></Link><p className="text-xs" style={{ color: "rgba(0,0,0,0.5)", fontFamily: "Inter, system-ui, sans-serif" }}>Déploiement en 48h · Sans infrastructure supplémentaire</p></div></div>
                    </PainPointCard>

                    <PainPointCard delay={400} style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                        <div className="p-7 flex flex-col h-full"><div className="text-3xl mb-4">💬</div><p className="text-base font-medium leading-relaxed mb-6 flex-1" style={{ color: "#1a1a2e", fontFamily: "Inter, system-ui, sans-serif" }}>&ldquo;Avant AfrikVoyage, je passais deux jours par semaine à valider des notes de frais. Maintenant, c&apos;est <span style={{ color: "#10B981" }}>automatique et traçable.</span>&rdquo;</p><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #6366F1, #10B981)" }}>AM</div><div><p className="text-xs font-semibold" style={{ color: "#1a1a2e", fontFamily: "Inter, system-ui, sans-serif" }}>Ama Mensah</p><p className="text-xs" style={{ color: "rgba(0,0,0,0.5)", fontFamily: "Inter, system-ui, sans-serif" }}>DRH · Groupe Sonatel, Dakar</p></div></div></div>
                    </PainPointCard>
                </div>
            </div>
        </section>
    );
}

// ─── STATS BANNER DYNAMIQUE ────────────────────────────────────────────────────
function StatsBanner() {
    const [animatedValues, setAnimatedValues] = useState({ entreprises: 0, pays: 0, voyages: 0, satisfaction: 0 });
    const [satisfactionHistory] = useState([78, 82, 85, 88, 91, 93, 95, 96.2, 97.5, 98.2, 98.8, 99.1]);
    const [barHeights, setBarHeights] = useState(satisfactionHistory.map(() => 0));
    const statsRef = useRef<HTMLDivElement>(null);
    const statsInView = useInView(statsRef as React.RefObject<HTMLElement | null>);
    
    useEffect(() => {
        if (!statsInView) return;
        const duration = 2000;
        const startTime = Date.now();
        const targetValues = { entreprises: 500, pays: 15, voyages: 50000, satisfaction: 99.1 };
        const animateValues = () => {
            const now = Date.now();
            const progress = Math.min(1, (now - startTime) / duration);
            setAnimatedValues({
                entreprises: Math.floor(progress * targetValues.entreprises),
                pays: Math.floor(progress * targetValues.pays),
                voyages: Math.floor(progress * targetValues.voyages),
                satisfaction: Number((progress * targetValues.satisfaction).toFixed(1)),
            });
            if (progress < 1) requestAnimationFrame(animateValues);
        };
        requestAnimationFrame(animateValues);
        const t = setTimeout(() => setBarHeights(satisfactionHistory.map(v => v / 100 * 80)), 300);
        return () => clearTimeout(t);
    }, [statsInView, satisfactionHistory]);

    return (
        <section ref={statsRef} className="py-20" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)" }}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>Notre Impact en Chiffres</h2><p className="text-slate-400 text-lg" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>Des résultats concrets pour nos clients</p></div>
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10"><div className="text-4xl font-black mb-2" style={{ color: "#818CF8" }}>{animatedValues.entreprises}+</div><div className="text-sm text-slate-400 font-medium">Entreprises clientes</div><div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-1000" style={{ width: "85%", background: "linear-gradient(90deg, #6366F1, #818CF8)" }} /></div><p className="text-xs text-slate-500 mt-2">+45% en 2024</p></div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10"><div className="text-4xl font-black mb-2" style={{ color: "#34D399" }}>{animatedValues.pays}</div><div className="text-sm text-slate-400 font-medium">Pays couverts</div><div className="mt-4 flex justify-center gap-1">{["SN","CI","CM","NG","KE","MA","TN","EG","ZA","GH","BJ","TG","ML","BF","NE"].slice(0, animatedValues.pays).map((c, i) => (<span key={i} className="text-xs text-emerald-400">●</span>))}</div></div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10"><div className="text-4xl font-black mb-2" style={{ color: "#FBBF24" }}>{Math.floor(animatedValues.voyages / 1000)}K+</div><div className="text-sm text-slate-400 font-medium">Voyages gérés</div><div className="mt-4 flex items-center justify-center gap-1"><svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3.5l1.5 4.5h4.5l-3.5 2.5 1.5 4.5-3.5-2.5-3.5 2.5 1.5-4.5-3.5-2.5h4.5z"/></svg><span className="text-xs text-amber-400">+127% vs N-1</span></div></div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10"><div className="text-4xl font-black mb-2" style={{ color: "#10B981" }}>{animatedValues.satisfaction}%</div><div className="text-sm text-slate-400 font-medium">Satisfaction client</div><div className="mt-4 flex items-center justify-center gap-0.5">{[...Array(5)].map((_, i) => (<svg key={i} className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>))}</div></div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-6"><div><h3 className="text-white font-bold text-lg" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>Taux de satisfaction client</h3><p className="text-slate-400 text-xs mt-1">Évolution mensuelle 2024</p></div><div className="flex items-center gap-4"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: "#10B981" }} /><span className="text-xs text-slate-400">Satisfaction</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: "#F59E0B" }} /><span className="text-xs text-slate-400">Objectif</span></div></div></div>
                        <div className="relative h-48 mb-4"><div className="absolute left-0 right-0 bottom-0 h-px bg-white/10" /><div className="absolute left-0 top-0 bottom-0 w-px bg-white/10" /><div className="absolute left-0 right-0 border-t border-dashed border-amber-500/50" style={{ bottom: "78%" }}><span className="absolute -top-4 right-0 text-xs text-amber-400">Objectif 99%</span></div><div className="flex items-end justify-between h-full pt-6">{satisfactionHistory.map((value, i) => (<div key={i} className="flex-1 flex flex-col items-center gap-1"><div className="w-full px-1"><div className="bg-linear-to-t from-emerald-500 to-emerald-400 rounded-t transition-all duration-700" style={{ height: `${barHeights[i]}px`, maxHeight: "140px", transitionDelay: `${i * 50}ms` }} /></div><span className="text-[10px] text-slate-500 rotate-45 origin-left translate-y-2">{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span></div>))}</div></div>
                        <div className="mt-8 pt-4 border-t border-white/10"><div className="flex items-center justify-between"><div><p className="text-2xl font-bold text-white">+21.1%</p><p className="text-xs text-slate-500">de progression en 12 mois</p></div><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10B981" }} /><span className="text-xs text-emerald-400">Tendance positive</span></div></div><svg className="w-full h-12 mt-3" viewBox="0 0 300 40" preserveAspectRatio="none"><polyline points="0,30 25,28 50,26 75,24 100,20 125,18 150,15 175,12 200,9 225,6 250,4 275,2 300,1" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={statsInView ? 1 : 0} style={{ transition: "opacity 1s ease-out" }} /><polyline points="0,32 25,31 50,30 75,29 100,28 125,27 150,26 175,24 200,22 225,19 250,16 275,13 300,10" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4,4" strokeLinecap="round" opacity={statsInView ? 0.6 : 0} style={{ transition: "opacity 1s ease-out 0.3s" }} /></svg><div className="flex justify-between mt-1"><span className="text-[10px] text-slate-600">Jan 2024</span><span className="text-[10px] text-slate-600">Déc 2024</span></div></div>
                    </div>
                </div>
                
            </div>
        </section>
    );
}

function VisionSection() {
    return (
        <div className="w-full font-sans antialiased">
            <section className="relative py-20 md:py-28 overflow-hidden border-b border-slate-800" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" }}>
                <div className="absolute inset-0 pointer-events-none z-0"><div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-20 blur-[130px]" style={{ background: "#6366F1" }} /><div className="absolute bottom-10 -right-32 w-112.5 h-112.5 rounded-full opacity-15 blur-[150px]" style={{ background: "#10B981" }} /></div>
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
                    <div className="mb-16 text-center max-w-3xl mx-auto"><span className="text-xs font-bold uppercase tracking-widest text-[#6366F1] bg-[#6366F1]/10 px-3 py-1 rounded-full border border-[#6366F1]/20">Notre Vision</span><h2 className="mt-4 mb-4 text-4xl font-black text-white tracking-tight sm:text-5xl">Le Pivot de la <span className="text-transparent bg-clip-text bg-linear-to-r select-none from-[#6366F1] to-emerald-400">Transformation Digitale</span></h2><p className="text-lg leading-relaxed text-slate-300 font-medium">Devenir la plateforme de référence pour la gestion d&apos;entreprise en Afrique, tout en unifiant déplacements professionnels et avantages sociaux à l&apos;international.</p></div>
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-3 auto-rows-fr">
                        {visionCards.map((card, idx) => (
                            <div key={idx} className={`${card.gridClass} group relative flex flex-col justify-between rounded-2xl border border-white/10 p-8 transition-all duration-300 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-[#6366F1]/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.25)]`}>
                                <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                <div><div className="flex items-center justify-between mb-6"><div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-3xl shadow-inner transition-transform duration-300 group-hover:scale-110">{card.icon}</div>{card.badge && (<span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${card.badge.color}`}>{card.badge.text}</span>)}</div><span className={`text-xs font-bold uppercase tracking-wider ${card.type === 'voyage' ? 'text-emerald-400' : card.type === 'cse' ? 'text-[#6366F1]' : 'text-slate-400'}`}>{card.subtitle}</span><h3 className="mt-1 mb-3 text-2xl font-bold text-white tracking-tight">{card.title}</h3><p className="text-sm leading-relaxed text-slate-300 font-normal">{card.description}</p></div>
                                <div className="mt-6 flex justify-end"><span className="text-xs font-bold text-slate-500 group-hover:text-white transition-colors duration-300 flex items-center gap-1">En savoir plus <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span></span></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-slate-50 py-20 md:py-28 relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="mb-16 text-center max-w-2xl mx-auto"><span className="text-xs font-bold uppercase tracking-widest text-[#6366F1] bg-[#6366F1]/10 px-3 py-1 rounded-full">Nos Valeurs Fondamentales</span><h2 className="mt-4 mb-4 text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">Les principes qui guident chacune de nos actions</h2></div>
                    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {valueCards.map((card, idx) => (
                            <div key={card.title} className="group relative flex flex-col justify-between rounded-2xl bg-white p-8 shadow-[0_4px_20px_rgba(15,23,42,0.02)] border border-slate-100 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(15,23,42,0.06)] hover:-translate-y-1.5">
                                <div><div className="flex items-start justify-between mb-6"><div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-[#6366F1] text-2xl transition-colors duration-300 group-hover:bg-[#6366F1] group-hover:text-white">{card.icon}</div>{card.roiBadge && (<div className="flex flex-col items-end border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-xl shadow-sm"><span className="text-base font-black text-emerald-600 leading-none">{card.roiBadge.text}</span><span className="text-[10px] font-bold text-emerald-700/80 uppercase mt-0.5 tracking-wider">{card.roiBadge.sub}</span></div>)}</div><h3 className="mb-3 text-xl font-bold text-slate-900 group-hover:text-[#6366F1] transition-colors duration-200">{card.title}</h3><p className="mb-6 text-sm leading-relaxed text-slate-500 font-medium">{card.description}</p><ul className="space-y-3 pt-4 border-t border-slate-50">{card.points.map((pt) => (<li key={pt} className="flex items-start gap-2.5 text-sm text-slate-600 font-medium"><span className="text-[#6366F1] font-bold select-none mt-0.5">→</span><span>{pt}</span></li>))}</ul></div>
                                <div className="mt-8 pt-3 flex items-center gap-2 border-t border-slate-100"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span><span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Système Conforme & Actif</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── TEAM SECTION — Transparence totale et animations ────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function TeamSection() {
    const [hoveredMember, setHoveredMember] = useState<number | null>(null);
    const sectionRef = useRef<HTMLDivElement>(null);
    const inView = useInView(sectionRef as React.RefObject<HTMLElement | null>);
    const [animatedCounters, setAnimatedCounters] = useState({ experience: 0, clients: 0, countries: 0 });

    useEffect(() => {
        if (!inView) return;
        const duration = 1500;
        const startTime = Date.now();
        const targets = { experience: 45, clients: 500, countries: 15 };
        const animate = () => {
            const now = Date.now();
            const progress = Math.min(1, (now - startTime) / duration);
            setAnimatedCounters({
                experience: Math.floor(progress * targets.experience),
                clients: Math.floor(progress * targets.clients),
                countries: Math.floor(progress * targets.countries),
            });
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [inView]);

    return (
        <section ref={sectionRef} className="py-20 md:py-28 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)" }}>
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-[100px]" style={{ background: "#6366F1" }} />
                <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full blur-[100px]" style={{ background: "#10B981" }} />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
                <div className="text-center mb-12 transition-all duration-700" style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(30px)" }}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#6366F1" }} />
                        <span className="text-xs font-semibold" style={{ color: "#6366F1" }}>Transparence Totale</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                        Une équipe <span className="text-transparent bg-clip-text bg-linear-to-r from-[#6366F1] to-emerald-500">passionnée</span>
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                        Des experts venus des 4 coins de l&apos;Afrique, unis par une vision commune de transformer la gestion d&apos;entreprise.
                    </p>
                </div>

                {/* Cartes membres */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-16">
                    {teamMembers.map((member, idx) => (
                        <div
                            key={member.name}
                            className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl cursor-pointer"
                            style={{
                                transform: !inView ? "translateY(40px)" : hoveredMember === idx ? "translateY(-8px)" : "translateY(0)",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                opacity: inView ? 1 : 0,
                                transitionDelay: `${idx * 100}ms`
                            }}
                            onMouseEnter={() => setHoveredMember(idx)}
                            onMouseLeave={() => setHoveredMember(null)}
                        >
                            <div className="absolute inset-0 bg-linear-to-br from-[#6366F1]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            <div className="relative p-6 text-center">
                                <div className="relative mb-5 inline-block">
                                    <div className={`w-28 h-28 rounded-full bg-linear-to-br ${member.color} flex items-center justify-center text-white text-3xl font-bold shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl mx-auto`}>
                                        {member.initials}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-400 border-3 border-white flex items-center justify-center text-white text-xs font-bold shadow-md">
                                        {member.title[0]}
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md">
                                        <svg className="w-5 h-5 text-[#6366F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-[#6366F1] transition-colors">{member.name}</h3>
                                <p className="text-sm font-semibold text-emerald-600 mb-3">{member.role}</p>
                                <p className="text-sm text-slate-500 leading-relaxed">{member.description}</p>

                                {/* Réseaux sociaux */}
                                <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-slate-100">
                                    <a href={member.linkedin} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 transition-all duration-300 hover:bg-[#6366F1] hover:text-white hover:scale-110">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                                    </a>
                                    <a href={`mailto:${member.email}`} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 transition-all duration-300 hover:bg-emerald-500 hover:text-white hover:scale-110">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </a>
                                </div>
                            </div>

                            {/* Barre de progression de l'expertise */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-[#6366F1] to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                        </div>
                    ))}
                </div>

                {/* Statistiques d'équipe */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="text-4xl font-black text-[#6366F1] mb-2">{animatedCounters.experience}+</div>
                        <p className="text-sm font-semibold text-slate-700">Années d&apos;expertise cumulées</p>
                        <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-linear-to-r from-[#6366F1] to-emerald-500 transition-all duration-1000" style={{ width: `${(animatedCounters.experience / 50) * 100}%` }} /></div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="text-4xl font-black text-emerald-500 mb-2">{animatedCounters.clients}+</div>
                        <p className="text-sm font-semibold text-slate-700">Entreprises accompagnées</p>
                        <div className="mt-3 flex items-center justify-center gap-1 text-emerald-500">{[...Array(5)].map((_, i) => (<svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>))}</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="text-4xl font-black text-amber-500 mb-2">{animatedCounters.countries}</div>
                        <p className="text-sm font-semibold text-slate-700">Pays représentés</p>
                        <div className="mt-3 flex justify-center gap-1 flex-wrap">{["🇸🇳","🇨🇮","🇲🇦","🇹🇳","🇫🇷","🇨🇦","🇺🇸","🇦🇪"].slice(0, animatedCounters.countries).map((flag, i) => (<span key={i} className="text-lg transition-all duration-300 hover:scale-125 cursor-pointer">{flag}</span>))}</div>
                    </div>
                </div>

                {/* CTA Rejoindre */}
                <div className="text-center mt-12 transition-all duration-700" style={{ opacity: inView ? 1 : 0, transitionDelay: "400ms" }}>
                    <button className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-[#6366F1] to-emerald-500 px-8 py-4 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-0.5">
                        Rejoindre Notre Équipe
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </button>
                    <p className="text-xs text-slate-400 mt-3">Postulez dès maintenant et participez à l&apos;aventure AfrikVoyage × AfrikCSE</p>
                </div>
            </div>
        </section>
    );
}

export default function AboutPage() {
    return (
        <main className="min-h-screen font-sans antialiased">
        <HeroSection />
        <MissionSection />
        {/* <StatsBanner /> */}
        <VisionSection />
        <TeamSection />
        </main>
    );
}
