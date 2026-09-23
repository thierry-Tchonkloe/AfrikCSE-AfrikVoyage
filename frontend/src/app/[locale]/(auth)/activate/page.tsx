"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"authPages.activate">>;

const getSchema = (t: Translator) => z.object({
    password: z
        .string()
        .min(8, t("minimum8Characters"))
        .regex(/[A-Z]/, t("atLeastOneUppercase"))
        .regex(/[0-9]/, t("atLeastOneDigit")),
    confirmPassword: z.string(),
    }).refine((d) => d.password === d.confirmPassword, {
    message: t("passwordsDoNotMatch"),
    path: ["confirmPassword"],
    });

type FormData = z.infer<ReturnType<typeof getSchema>>;

// Règles mot de passe
const getRules = (t: Translator) => ([
    { label: t("least8Characters"), test: (v: string) => v.length >= 8 },
    { label: t("oneUppercaseLetter"), test: (v: string) => /[A-Z]/.test(v) },
    { label: t("oneDigit"), test: (v: string) => /[0-9]/.test(v) },
]);

function ActivateContent() {
    const t = useTranslations("authPages.activate");
    const RULES = useMemo(() => getRules(t), [t]);
    const schema = useMemo(() => getSchema(t), [t]);
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
        toast.error(t("invalidActivationLink"));
        router.push("/login");
        }
    }, [token, router]);

    const onSubmit = async (data: FormData): Promise<void> => {
        if (!token) return;
        setLoading(true);
        try {
        await api.post("/auth/activate", { token, password: data.password });
        setDone(true);
        } catch (err) {
        toast.error(getErrorMessage(err, t("invalidExpiredLink")));
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
            {t("accountActivated")}
            </h2>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            {t("passwordHasBeenSet")}
            </p>
            <button
            onClick={() => router.push("/login")}
            className="w-full py-2.5 rounded-lg text-white text-sm font-semibold mt-2"
            style={{ background: "var(--color-primary)" }}
            >
            {t("log")}
            </button>
        </div>
        );
    }

    return (
        <>
        <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
            {t("activateAccount")}
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
            {t("setSecurePasswordAccess")}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Mot de passe */}
            <div>
            <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text)" }}>
                {t("newPassword")}
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
                {t("confirmPassword")}
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
            {t("activateMyAccount")}
            </button>
        </form>
        </>
    );
}

export default function ActivatePage() {
    const t = useTranslations("authPages.activate");
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
                {t("afrikcseAfrikvoyage")}
                </span>
            </div>
            </div>

            <div
            className="rounded-2xl border p-8 shadow-sm"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
            {/* useSearchParams requiert Suspense en Next.js */}
            <Suspense fallback={<div className="text-center text-sm text-gray-400">{t("loading")}</div>}>
                <ActivateContent />
            </Suspense>
            </div>
        </div>
        </div>
    );
}