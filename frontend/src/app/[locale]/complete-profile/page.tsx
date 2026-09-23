"use client";

import { useState, useEffect } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ChevronRight, SkipForward } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/errors";
import { DEPARTMENTS } from "@/lib/departments";
import { useTranslations } from "next-intl";
import { useOptionLabel } from "@/hooks/useOptionLabel";

const schema = z.object({
    jobTitle: z.string().optional(),
    department: z.string().optional(),
    phone: z.string().optional(),
    costCenter: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CompleteProfilePage() {
    const optionLabel = useOptionLabel();
    const tr = useTranslations("pages.completeProfile");
    const t = useTranslations("pages.completeProfile");
    const router = useRouter();
    const { user, loading, reload } = useAuth();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.push("/login");
        // Si le profil est déjà complété, redirige vers le hub
        if (!loading && user?.profileCompleted) router.push("/hub");
    }, [user, loading, router]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: FormData): Promise<void> => {
        setSubmitting(true);
        try {
        await authService.completeProfile(data);
        toast.success(t("profileCompleted"));
        await reload();
        router.push("/hub");
        } catch (err) {
        toast.error(getErrorMessage(err, t("errorWhileUpdating")));
        } finally {
        setSubmitting(false);
        }
    };

    const skipForNow = async (): Promise<void> => {
        // Marque comme complété avec des données vides
        try {
        await authService.completeProfile({});
        await reload();
        } finally {
        router.push("/hub");
        }
    };

    if (loading || !user) return null;

    return (
        <div
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ background: "var(--color-bg)" }}
        >
        <div className="w-full max-w-lg">
            {/* Logo */}
            <div className="flex justify-center mb-8">
            <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                style={{ background: "var(--color-primary)" }}
            >
                A
            </div>
            </div>

            {/* Stepper visuel (4 étapes, étape 2 active) */}
            <div className="flex items-center justify-center gap-0 mb-8 max-w-sm mx-auto">
            {[tr("personalInformation"), t("roleOrganization"), t("preferences"), t("accessOverview")].map(
                (label, i) => (
                <div key={label} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{
                        background: i === 0
                            ? "var(--color-primary)"
                            : i < 2
                            ? "var(--color-primary)"
                            : "var(--color-border)",
                        color: i < 2 ? "white" : "var(--color-muted)",
                        }}
                    >
                        {i === 0 ? "✓" : i + 1}
                    </div>
                    <span
                        className="text-xs mt-1 text-center hidden sm:block w-20"
                        style={{
                        color: i === 1 ? "var(--color-primary)" : "var(--color-muted)",
                        fontSize: "10px",
                        }}
                    >
                        {label}
                    </span>
                    </div>
                    {i < 3 && (
                    <div
                        className="h-0.5 flex-1 mx-1 -mt-4"
                        style={{
                        background: i < 1 ? "var(--color-primary)" : "var(--color-border)",
                        }}
                    />
                    )}
                </div>
                )
            )}
            </div>

            {/* Card */}
            <div
            className="rounded-2xl border p-8 shadow-sm"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
            <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
                {t("completeProfile")}
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                {t("informationHelpsUs")}
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Poste */}
                <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
                    {t("jobTitle")}
                </label>
                <input
                    {...register("jobTitle")}
                    placeholder={t("eGSeniorSales")}
                    className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
                    style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-bg)",
                    color: "var(--color-text)",
                    }}
                />
                </div>

                {/* Département */}
                <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
                    {t("department")}
                </label>
                <select
                    {...register("department")}
                    className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
                    style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-bg)",
                    color: "var(--color-text)",
                    }}
                >
                    <option value="">{t("selectDepartment")}</option>
                    {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{optionLabel(d)}</option>
                    ))}
                </select>
                </div>

                {/* Téléphone */}
                <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
                    {t("businessPhone")}
                </label>
                <input
                    {...register("phone")}
                    placeholder={t("text229XxXxXx")}
                    className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
                    style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-bg)",
                    color: "var(--color-text)",
                    }}
                />
                </div>

                {/* Centre de coût */}
                <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
                    {t.rich("costCenterOptionalExpense", { span1: (chunks) => <span style={{ color: "var(--color-muted)", fontWeight: 400 }}>{chunks}</span> })}
                </label>
                <input
                    {...register("costCenter")}
                    placeholder={t("eGCcMkt")}
                    className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
                    style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-bg)",
                    color: "var(--color-text)",
                    }}
                />
                </div>

                {/* Info box */}
                <div
                className="flex gap-3 p-4 rounded-xl text-sm"
                style={{
                    background: "var(--color-primary-light)",
                    color: "var(--color-primary)",
                }}
                >
                <span className="shrink-0">{t("text")}</span>
                <div>
                    <p className="font-medium">{t("whyInformation")}</p>
                    <p className="text-xs mt-0.5" style={{ opacity: 0.8 }}>
                    {t("departmentPositionLetUs")}
                    </p>
                </div>
                </div>

                {/* Boutons */}
                <div className="flex justify-between items-center pt-2">
                <button
                    type="button"
                    onClick={skipForNow}
                    className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border"
                    style={{ color: "var(--color-muted)", borderColor: "var(--color-border)" }}
                >
                    <SkipForward size={14} /> {t("skipNow")}
                </button>

                <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 text-sm px-6 py-2.5 rounded-lg text-white font-semibold disabled:opacity-70"
                    style={{ background: "var(--color-primary)" }}
                >
                    {submitting && <Loader2 size={15} className="animate-spin" />}
                    {t("continue")} <ChevronRight size={15} />
                </button>
                </div>
            </form>
            </div>

            <p className="text-center text-xs mt-4" style={{ color: "var(--color-muted)" }}>
            {t("needHelp")}{" "}
            <Link href="/support" className="underline" style={{ color: "var(--color-primary)" }}>
                {t("contactSupport")}
            </Link>
            </p>
        </div>
        </div>
  );
}