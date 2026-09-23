"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";


type Translator = ReturnType<typeof useTranslations<"authPages.forgotPassword">>;

const getSchema = (tr: Translator) => (z.object({
    email: z.string().email(tr("invalidEmail")),
}));

type FormData = z.infer<ReturnType<typeof getSchema>>;

export default function ForgotPasswordPage() {
    const tr = useTranslations("authPages.forgotPassword");
    const schema = useMemo(() => getSchema(tr), [tr]);
    const t = useTranslations("authPages.forgotPassword");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData): Promise<void> => {
        setLoading(true);
        try {
        await authService.forgotPassword(data.email);
        setSent(true);
        } catch {
        toast.error(t("errorOccurred"));
        } finally {
        setLoading(false);
        }
    };

    return (
        <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--color-bg)" }}
        >
        <div className="w-full max-w-md">
            <div className="flex justify-center mb-8">
            <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold"
                style={{ background: "var(--color-primary)" }}
            >
                A
            </div>
            </div>

            <div
            className="rounded-2xl border p-8 shadow-sm"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
            {!sent ? (
                <>
                <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
                    {t("forgotPassword")}
                </h1>
                <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                    {t("enterEmailIfAccount")}
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
                        {t("emailAddress")}
                    </label>
                    <input
                        {...register("email")}
                        type="email"
                        placeholder={tr("emailPlaceholderVous")}
                        className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
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

                    <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ background: "var(--color-primary)" }}
                    >
                    {loading && <Loader2 size={15} className="animate-spin" />}
                    {t("sendLink")}
                    </button>
                </form>
                </>
            ) : (
                /* État : email envoyé */
                <div className="text-center py-4">
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "var(--color-primary-light)" }}
                >
                    <Mail size={32} style={{ color: "var(--color-primary)" }} />
                </div>
                <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text)" }}>
                    {t("checkInbox")}
                </h2>
                <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                    {t("ifEmailRegisteredReset")}
                </p>
                </div>
            )}

            <div className="mt-6 text-center">
                <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-sm hover:underline"
                style={{ color: "var(--color-muted)" }}
                >
                <ArrowLeft size={14} /> {t("backLogin")}
                </Link>
            </div>
            </div>
        </div>
        </div>
    );
}