"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";

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
    } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { rememberMe: false }, });

    const onSubmit = async (data: FormData): Promise<void> => {
        setLoading(true);
        try {
        const result = await authService.login(data.email, data.password);
        setAuthData(result.accessToken, result.refreshToken, result.user);

        toast.success(`Bienvenue, ${result.user.firstName} !`);

        // Redirection selon l'état du profil
        if (!result.user.profileCompleted) {
            router.push("/complete-profile");
        } else {
            router.push("/hub");
        }
        } catch (err: any) {
        const message =
            err.response?.data?.message || "Erreur de connexion";
        toast.error(message);
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" style={{ background: "var(--color-bg)" }}>
        {/* ── Panneau gauche : formulaire ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
            {/* Logo */}
            <div className="mb-8 flex flex-col items-center gap-3">
            <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                style={{ background: "var(--color-primary)" }}
            >
                A
            </div>
            <div className="text-center">
                <h1 className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
                AfrikCSE & AfrikVoyage
                </h1>
                <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                Enterprise Travel & Benefits Platform
                </p>
            </div>
            </div>

            {/* Card formulaire */}
            <div
            className="w-full max-w-md rounded-2xl p-8 shadow-sm border"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
            <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
                Bienvenue
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                Connectez-vous à votre espace
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
                    Adresse email
                </label>
                <input
                    {...register("email")}
                    type="email"
                    placeholder="vous@entreprise.com"
                    className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                    style={{
                    borderColor: errors.email ? "#ef4444" : "var(--color-border)",
                    background: "var(--color-bg)",
                    color: "var(--color-text)",
                    }}
                />
                {errors.email && (
                    <p className="text-xs mt-1 text-red-500">{errors.email.message}</p>
                )}
                </div>

                {/* Mot de passe */}
                <div>
                <div className="flex justify-between items-center mb-1.5">
                    <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                    Mot de passe
                    </label>
                    <a
                        href="/forgot-password"
                        className="text-xs hover:underline"
                        style={{ color: "var(--color-primary)" }}
                    >
                        Mot de passe oublié ?
                    </a>
                </div>
                <div className="relative">
                    <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none pr-10"
                    style={{
                        borderColor: errors.password ? "#ef4444" : "var(--color-border)",
                        background: "var(--color-bg)",
                        color: "var(--color-text)",
                    }}
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--color-muted)" }}
                    >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {errors.password && (
                    <p className="text-xs mt-1 text-red-500">{errors.password.message}</p>
                )}
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2">
                <input
                    {...register("rememberMe")}
                    type="checkbox"
                    id="rememberMe"
                    className="w-4 h-4 rounded"
                    style={{ accentColor: "var(--color-primary)" }}
                />
                <label htmlFor="rememberMe" className="text-sm" style={{ color: "var(--color-muted)" }}>
                    Se souvenir de moi
                </label>
                </div>

                {/* Submit */}
                <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
                style={{ background: "var(--color-primary)" }}
                >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Se connecter
                </button>
            </form>

            <p className="text-center text-xs mt-6" style={{ color: "var(--color-muted)" }}>
                Pas encore de compte ?{" "}
                <a href="/register" className="font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
                Créer un compte entreprise
                </a>
            </p>
            </div>
        </div>

        {/* ── Panneau droit : features (masqué sur mobile) ── */}
        <div
            className="hidden lg:flex flex-col justify-center px-12 py-12 w-96"
            style={{ background: "var(--color-primary-light)" }}
        >
            <div className="space-y-6">
            {[
                {
                title: "Gestion des voyages",
                desc: "Réservations, notes de frais et politiques de déplacement",
                icon: "✈",
                },
                {
                title: "Avantages salariés",
                desc: "CSE, billetterie, subventions et offres partenaires",
                icon: "👥",
                },
                {
                title: "Reporting avancé",
                desc: "Tableaux de bord en temps réel et analyses détaillées",
                icon: "📊",
                },
            ].map((feature) => (
                <div
                key={feature.title}
                className="flex gap-4 p-4 rounded-xl border"
                style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                <span className="text-2xl">{feature.icon}</span>
                <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                    {feature.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                    {feature.desc}
                    </p>
                </div>
                </div>
            ))}

            <div className="flex gap-8 pt-4">
                {[
                { value: "500+", label: "Entreprises" },
                { value: "50K+", label: "Employés", color: "var(--color-primary)" },
                ].map((stat) => (
                <div key={stat.label}>
                    <p className="text-2xl font-bold" style={{ color: stat.color || "var(--color-text)" }}>
                    {stat.value}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                    {stat.label}
                    </p>
                </div>
                ))}
            </div>
            </div>
        </div>
        </div>
    );
}