"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import api from "@/lib/api";

const schema = z.object({
    password: z
        .string()
        .min(8, "Minimum 8 caractères")
        .regex(/[A-Z]/, "Au moins une majuscule")
        .regex(/[0-9]/, "Au moins un chiffre"),
    confirmPassword: z.string(),
    }).refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
    });

type FormData = z.infer<typeof schema>;

// Règles mot de passe
const RULES = [
    { label: "8 caractères minimum", test: (v: string) => v.length >= 8 },
    { label: "Une majuscule", test: (v: string) => /[A-Z]/.test(v) },
    { label: "Un chiffre", test: (v: string) => /[0-9]/.test(v) },
];

function ActivateContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm]   = useState(false);
    const [loading, setLoading]           = useState(false);
    const [done, setDone]                 = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const password = watch("password", "");

    useEffect(() => {
        if (!token) {
        toast.error("Lien d'activation invalide");
        router.push("/login");
        }
    }, [token, router]);

    const onSubmit = async (data: FormData): Promise<void> => {
        if (!token) return;
        setLoading(true);
        try {
        await api.post("/auth/activate", { token, password: data.password });
        setDone(true);
        } catch (err: any) {
        toast.error(err.response?.data?.message || "Lien invalide ou expiré");
        } finally {
        setLoading(false);
        }
    };

    // ── Succès ──
    if (done) {
        return (
        <div className="text-center space-y-4 py-4">
            <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "#f0fdf4" }}
            >
            <CheckCircle size={36} style={{ color: "#10b981" }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
            Compte activé !
            </h2>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Votre mot de passe a été défini. Vous pouvez maintenant vous connecter
            et accéder à votre espace entreprise.
            </p>
            <button
            onClick={() => router.push("/login")}
            className="w-full py-2.5 rounded-lg text-white text-sm font-semibold mt-2"
            style={{ background: "var(--color-primary)" }}
            >
            Se connecter
            </button>
        </div>
        );
    }

    return (
        <>
        <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
            Activer votre compte
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
            Définissez un mot de passe sécurisé pour accéder à votre espace entreprise.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Mot de passe */}
            <div>
            <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text)" }}>
                Nouveau mot de passe
            </label>
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

            {/* Indicateurs de force */}
            {password && (
                <div className="mt-2 space-y-1">
                {RULES.map((rule) => (
                    <div key={rule.label} className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                        background: rule.test(password) ? "#10b981" : "#d1d5db",
                        }}
                    />
                    <span
                        className="text-xs"
                        style={{
                        color: rule.test(password) ? "#10b981" : "var(--color-muted)",
                        }}
                    >
                        {rule.label}
                    </span>
                    </div>
                ))}
                </div>
            )}
            </div>

            {/* Confirmation */}
            <div>
            <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text)" }}>
                Confirmer le mot de passe
            </label>
            <div className="relative">
                <input
                {...register("confirmPassword")}
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none pr-10"
                style={{
                    borderColor: errors.confirmPassword ? "#ef4444" : "var(--color-border)",
                    background: "var(--color-bg)",
                    color: "var(--color-text)",
                }}
                />
                <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-muted)" }}
                >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            {errors.confirmPassword && (
                <p className="text-xs mt-1 text-red-500">{errors.confirmPassword.message}</p>
            )}
            </div>

            <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
            style={{ background: "var(--color-primary)" }}
            >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Activer mon compte
            </button>
        </form>
        </>
    );
}

export default function ActivatePage() {
    return (
        <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--color-bg)" }}
        >
        <div className="w-full max-w-md">
            {/* Logo */}
            <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
                <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ background: "var(--color-primary)" }}
                >
                A
                </div>
                <span className="font-bold" style={{ color: "var(--color-primary)" }}>
                AfrikCSE & AfrikVoyage
                </span>
            </div>
            </div>

            <div
            className="rounded-2xl border p-8 shadow-sm"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
            {/* useSearchParams requiert Suspense en Next.js */}
            <Suspense fallback={<div className="text-center text-sm text-gray-400">Chargement...</div>}>
                <ActivateContent />
            </Suspense>
            </div>
        </div>
        </div>
    );
}