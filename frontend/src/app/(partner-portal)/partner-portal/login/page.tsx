"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { partnerAuthService } from "@/services/partner/partner-portal.service";
import { getErrorMessage } from "@/lib/errors";

const schema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(1, "Mot de passe requis"),
});

type FormData = z.infer<typeof schema>;

export default function PartnerLoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: FormData): Promise<void> => {
        setLoading(true);
        try {
            const { user } = await partnerAuthService.login(data.email, data.password);
            toast.success(`Bienvenue, ${user.firstName} !`);
            window.location.href = "/partner-portal/dashboard";
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur de connexion"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F8FA] flex items-center justify-center px-6 py-12 font-sans antialiased">
            <div className="w-full max-w-sm mx-auto space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="flex flex-col items-center text-center">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold mb-4">
                        P
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-800">Portail partenaire</h1>
                    <p className="text-sm text-slate-500 mt-1.5">Connectez-vous à votre espace établissement.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Adresse email
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                {...register("email")}
                                type="email"
                                placeholder="contact@etablissement.com"
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 text-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                                    errors.email
                                        ? "border-red-300 focus:ring-red-500/10 focus:border-red-500"
                                        : "border-slate-200 focus:ring-blue-600/10 focus:border-blue-600"
                                }`}
                            />
                        </div>
                        {errors.email && <p className="text-xs font-medium text-red-500 pl-1">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                {...register("password")}
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-slate-50/50 text-sm outline-none transition-all focus:bg-white focus:ring-4 ${
                                    errors.password
                                        ? "border-red-300 focus:ring-red-500/10 focus:border-red-500"
                                        : "border-slate-200 focus:ring-blue-600/10 focus:border-blue-600"
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs font-medium text-red-500 pl-1">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-95 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Connexion...
                            </>
                        ) : (
                            <>
                                <span>Accéder au portail</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500">
                    Vous n&apos;êtes pas un partenaire ?{" "}
                    <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                        Retour à la connexion
                    </Link>
                </p>
            </div>
        </div>
    );
}
