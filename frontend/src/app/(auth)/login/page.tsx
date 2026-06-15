"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, CheckCircle2, Globe, TrendingDown, ArrowRight } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import Image from "next/image";
import { getErrorMessage } from "@/lib/errors";

const schema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(1, "Mot de passe requis"),
    rememberMe: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
    const router = useRouter();
    const { setAuthData } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { rememberMe: false },
    });

    const onSubmit = async (data: FormData): Promise<void> => {
        setLoading(true);
        try {
            const result = await authService.login(data.email, data.password);

            // Stockage du token et de l'utilisateur (logique inchangée)
            setAuthData(result.user);

            if (result.sessionToken && typeof window !== "undefined") {
                const isSecure = window.location.protocol === "https:";
                const sameSite = isSecure ? "None" : "Lax";
                document.cookie = `session=${result.sessionToken}; path=/; max-age=60; SameSite=${sameSite}; ${isSecure ? "Secure;" : ""}`;
            }

            toast.success(`Bienvenue, ${result.user.firstName} !`);

            const { role, organization, profileCompleted } = result.user;
            const isHost = organization?.isHost ?? false;

            if (!profileCompleted) {
                window.location.href = "/complete-profile";
                return;
            }

            let destination: string;

            if (isHost && (role === "SUPER_ADMIN" || role === "MANAGER")) {
                destination = "/admin/dashboard";
            } else if (["ADMIN", "MANAGER", "RH", "FINANCE"].includes(role)) {
                destination = "/companies/dashboard";
            } else if (role === "EMPLOYE") {
                destination = "/employes/dashboard";
            } else {
                destination = "/hub";
            }

            window.location.href = destination;

        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur de connexion"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F8FA] flex font-sans antialiased selection:bg-cyan-500/30 overflow-hidden">
            
            {/* ── SECTION GAUCHE : FORMULAIRE CLAIR & PREMIUM ── */}
            <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24 bg-white relative z-10 shadow-xl border-r border-slate-100">
                <div className="w-full max-w-sm mx-auto space-y-8 animate-fadeIn">
                    
                    {/* Logo & Header */}
                    <div className="flex flex-col items-center text-center">
                        <Link href="/infos" className="flex items-center gap-2.5 group mb-6 self-start sm:self-center">
                            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-500 to-emerald-500 flex items-center justify-center p-[1px] transition-transform duration-300 group-hover:scale-105 shadow-md shadow-cyan-500/10">
                                <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center">
                                    <svg className="w-4 h-4 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-base font-bold tracking-tight text-slate-900 leading-none mb-0.5">
                                    Afrik<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-emerald-500">Workspace</span>
                                </span>
                                <span className="text-[9px] font-black tracking-[0.12em] uppercase leading-none text-slate-400">SaaS Platform</span>
                            </div>
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800 self-start sm:self-center">Content de vous revoir</h1>
                        <p className="text-sm text-slate-500 mt-1.5 self-start sm:self-center">Entrez vos accès pour rejoindre votre espace de travail.</p>
                    </div>

                    {/* Formulaire */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Champ Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Adresse email corporate
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-cyan-600 transition-colors" />
                                </div>
                                <input
                                    {...register("email")}
                                    type="email"
                                    placeholder="nom@entreprise.com"
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 text-sm outline-none transition-all duration-300 focus:bg-white focus:ring-4 ${
                                        errors.email
                                            ? "border-red-300 focus:ring-red-500/10 focus:border-red-500"
                                            : "border-slate-200 focus:ring-cyan-600/10 focus:border-cyan-600"
                                    }`}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs font-medium text-red-500 pl-1">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Champ Mot de passe */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Mot de passe
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-medium text-cyan-600 hover:text-cyan-700 hover:underline transition-colors"
                                >
                                    Oublié ?
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-cyan-600 transition-colors" />
                                </div>
                                <input
                                    {...register("password")}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-slate-50/50 text-sm outline-none transition-all duration-300 focus:bg-white focus:ring-4 ${
                                        errors.password
                                            ? "border-red-300 focus:ring-red-500/10 focus:border-red-500"
                                            : "border-slate-200 focus:ring-cyan-600/10 focus:border-cyan-600"
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs font-medium text-red-500 pl-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Options secondaires */}
                        <div className="flex items-center gap-2 py-0.5">
                            <input
                                {...register("rememberMe")}
                                type="checkbox"
                                id="rememberMe"
                                className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500/20 focus:ring-offset-0 transition-all cursor-pointer"
                            />
                            <label htmlFor="rememberMe" className="text-sm text-slate-500 select-none cursor-pointer hover:text-slate-700 transition-colors">
                                Rester connecté sur cet appareil
                            </label>
                        </div>

                        {/* Bouton de soumission Lumineux Premium */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-500 text-white text-sm font-semibold hover:opacity-95 transition-all duration-300 shadow-lg shadow-cyan-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn transform active:scale-[0.99]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                                    Authentification sécurisée...
                                </>
                            ) : (
                                <>
                                    <span>Accéder au Dashboard</span>
                                    <ArrowRight className="w-4 h-4 text-cyan-100 group-hover/btn:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Lien d'inscription */}
                    <div className="text-center pt-2">
                        <p className="text-sm text-slate-500">
                            Nouveau sur la plateforme ?{" "}
                            <Link href="/register" className="font-semibold text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                                Créer un compte
                            </Link>
                        </p>
                    </div>

                    {/* Securité et Conformité */}
                    <div className="flex items-center justify-center gap-5 pt-6 text-[11px] font-medium text-slate-400 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span>Chiffrement de bout en bout</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                            <span>Conforme RGPD / APDP</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── SECTION DROITE : COULEURS LUMINEUSES & BACKGROUND VOYAGE/HUB ── */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-cyan-500/80 via-indigo-500/5 to-emerald-500/10 overflow-hidden">
                
                {/* Image thématique : Terminal d'affaires lumineux, verrière, voyage business */}
                <Image 
                    src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1474&auto=format&fit=crop" 
                    alt="Corporate Airport Travel Hub"
                    fill
                    priority
                    className="object-cover object-center opacity-70 mix-blend-multiply scale-105 animate-subtleZoom"
                />

                {/* Overlays de lumières claires pour adoucir et donner de l'éclat */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-transparent to-transparent" />

                {/* Contenu textuel et indicateurs de performance (Clairs et contrastés) */}
                <div className="relative z-10 flex flex-col justify-between h-full w-full p-16 text-slate-800">
                    
                    {/* Badge et accroche supérieure */}
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 bg-cyan-50/80 backdrop-blur-md border border-cyan-100/50 rounded-full px-3.5 py-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">Infrastructures & Voyages</span>
                        </div>
                        <h2 className="text-4xl font-black tracking-tight leading-[1.15] max-w-lg text-slate-900">
                            Unifiez vos déplacements professionnels et vos <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600">avantages salariés</span>.
                        </h2>
                        <p className="text-slate-600 max-w-md text-sm leading-relaxed font-medium">
                            Pilotez vos budgets de dépenses, gérez vos réservations de transports complexes et optimisez la satisfaction de vos collaborateurs sur une interface unique.
                        </p>
                    </div>

                    {/* Statistiques claires présentées sous forme de cartes blanches satinées */}
                    <div className="space-y-8">
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-4 shadow-sm transition-all duration-300 hover:translate-y-[-2px] hover:bg-white">
                                <div className="p-2 w-fit bg-cyan-50 rounded-xl mb-3 border border-cyan-100">
                                    <Globe className="w-5 h-5 text-cyan-600" />
                                </div>
                                <div className="text-2xl font-black text-slate-900">54</div>
                                <div className="text-[10px] font-bold tracking-wide uppercase text-slate-500 mt-0.5">Pays Couverts</div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-4 shadow-sm transition-all duration-300 hover:translate-y-[-2px] hover:bg-white">
                                <div className="p-2 w-fit bg-emerald-50 rounded-xl mb-3 border border-emerald-100">
                                    <TrendingDown className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="text-2xl font-black text-slate-900">-30%</div>
                                <div className="text-[10px] font-bold tracking-wide uppercase text-slate-500 mt-0.5">Frais de Voyage</div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-4 shadow-sm transition-all duration-300 hover:translate-y-[-2px] hover:bg-white">
                                <div className="p-2 w-fit bg-indigo-50 rounded-xl mb-3 border border-indigo-100">
                                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="text-2xl font-black text-slate-900">95%</div>
                                <div className="text-[10px] font-bold tracking-wide uppercase text-slate-500 mt-0.5">Satisfaction</div>
                            </div>
                        </div>

                        {/* Preuve sociale intégrée élégamment */}
                        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-100 shadow-md flex flex-col gap-3">
                            <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                                "L'implémentation d'AfrikWorkspace a totalement transformé notre manière de gérer les déplacements régionaux. Nos processus de validation RH et financiers se font désormais en un clic."
                            </p>
                            <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-400 flex items-center justify-center text-white font-black text-xs shadow-sm">
                                    RH
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Direction des Ressources Humaines</p>
                                    <p className="text-[10px] font-semibold text-slate-500">TechAfrik Group</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Styles d'animation globaux */}
            <style jsx global>{`
                @keyframes subtleZoom {
                    from { transform: scale(1.01); }
                    to { transform: scale(1.06); }
                }
                .animate-subtleZoom {
                    animation: subtleZoom 24s ease-in-out infinite alternate;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}