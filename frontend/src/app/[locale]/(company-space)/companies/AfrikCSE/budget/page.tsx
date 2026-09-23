"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Loader2, X } from "lucide-react";
import { cseService } from "@/services/companies/cse.service";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";

type Translator = ReturnType<typeof useTranslations<"company.afrikcseBudget">>;

interface Category {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    annualBudget: number;
    perEmployeeLimit: number;
    currency: string;
    isActive: boolean;
    eligibleServices: string[];
    budgetUsed: number;
    _count: { requests: number };
}

const getCatSchema = (t: Translator) => (z.object({
    name:             z.string().min(1, t("nameRequired")),
    description:      z.string().optional(),
    icon:             z.string().optional(),
    annualBudget:     z.number().min(0),
    perEmployeeLimit: z.number().min(0),
    eligibleServices: z.string(), // séparés par virgule
}));

type CatForm = z.infer<ReturnType<typeof getCatSchema>>;

export default function BudgetPage() {
    const dateLocale = useDateLocale();
    const t = useTranslations("company.afrikcseBudget");
    const catSchema = useMemo(() => getCatSchema(t), [t]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading]       = useState(true);
    const [showAdd, setShowAdd]       = useState(false);
    const [saving, setSaving]         = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } =
        useForm<CatForm>({ resolver: zodResolver(catSchema) });

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const data = await cseService.getCategories();
        setCategories(data);
        } catch { toast.error(t("loadingError")); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const onAddCategory = async (data: CatForm): Promise<void> => {
        setSaving(true);
        try {
        await cseService.createCategory({
            ...data,
            eligibleServices: data.eligibleServices.split(",").map((s) => s.trim()).filter(Boolean),
        });
        toast.success(t("categoryCreated"));
        setShowAdd(false);
        reset();
        load();
        } catch { toast.error(t("creationError")); }
        finally { setSaving(false); }
    };

    const toggleActive = async (cat: Category) => {
        try {
        await cseService.updateCategory(cat.id, { isActive: !cat.isActive });
        toast.success(cat.isActive ? t("categoryDeactivated") : t("categoryActivated"));
        load();
        } catch { toast.error(t("error")); }
    };

    const ICON_MAP: Record<string, string> = {
        sport: "🏋️", education: "🎓", transport: "🚌", child: "👶",
        health: "💊", culture: "🎭", food: "🍽️",
    };

    return (
        <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">{t("subsidyManagement")}</h1>
            <p className="text-sm text-gray-500">
                {t("configureRulesBudgetsCse")}
            </p>
            </div>
            <div className="flex gap-2">
            <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "#0f766e" }}
            >
                <Plus size={15} /> {t("addNewCategory")}
            </button>
            </div>
        </div>

        {/* Grille catégories */}
        {loading ? (
            <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-gray-400" />
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => {
                const pct = cat.annualBudget > 0
                ? Math.min(100, Math.round((cat.budgetUsed / cat.annualBudget) * 100))
                : 0;
                const barColor = pct > 80 ? "#ef4444" : pct > 60 ? "#f59e0b" : "#0f766e";

                return (
                <div key={cat.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">
                        {ICON_MAP[cat.icon ?? ""] ?? "🎁"}
                        </span>
                        <div>
                        <p className="font-semibold text-gray-900">{cat.name}</p>
                        <p className="text-xs text-gray-500">{cat.description}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => toggleActive(cat)}
                        title={cat.isActive ? t("clickDeactivate") : t("clickActivate")}
                        className="text-xs font-medium px-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
                        style={cat.isActive
                        ? { color: "#0f766e", background: "#f0fdf4" }
                        : { color: "#9ca3af", background: "#f9fafb" }}
                    >
                        {cat.isActive ? t("active") : t("inactive")}
                    </button>
                    </div>

                    {/* Budget */}
                    <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">{t("annualBudget")}</p>
                        <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(cat.annualBudget, cat.currency, dateLocale)}
                        </span>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">{t("perEmployeeLimit")}</p>
                        <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(cat.perEmployeeLimit, cat.currency, dateLocale)}
                        </span>
                    </div>
                    </div>

                    {/* Services éligibles */}
                    {cat.eligibleServices.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-500 mb-2">{t("eligibleServices")}</p>
                        <div className="space-y-1">
                        {cat.eligibleServices.map((s) => (
                            <div key={s} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm border-2 flex items-center justify-center"
                                style={{ borderColor: "#0f766e", background: "#0f766e" }}>
                                <span className="text-white text-xs leading-none">✓</span>
                            </div>
                            <span className="text-xs text-gray-600">{s}</span>
                            </div>
                        ))}
                        </div>
                    </div>
                    )}

                    {/* Barre utilisation */}
                    <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{t("budgetUsage")}</span>
                        <span className="font-medium text-gray-700">
                        {formatCurrency(cat.budgetUsed, cat.currency, dateLocale)} / {formatCurrency(cat.annualBudget, cat.currency, dateLocale)}
                        </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                    </div>
                </div>
                );
            })}
            </div>
        )}

        {/* Modal ajout catégorie */}
        {showAdd && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">{t("newCategory")}</h3>
                <button onClick={() => setShowAdd(false)} className="text-gray-400">
                    <X size={18} />
                </button>
                </div>
                <form onSubmit={handleSubmit(onAddCategory)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">{t("name")}</label>
                    <input {...register("name")} className={inp} placeholder={t("sportsWellBeing")} />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                    </div>
                    <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">{t("description")}</label>
                    <input {...register("description")} className={inp} placeholder={t("description2")} />
                    </div>
                    <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{t("annualBudget2", { DEFAULT_CURRENCY })}</label>
                    <input {...register("annualBudget", { valueAsNumber: true })}
                        type="number" className={inp} placeholder="50000" />
                    </div>
                    <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{t("limitPerEmployee", { DEFAULT_CURRENCY })}</label>
                    <input {...register("perEmployeeLimit", { valueAsNumber: true })}
                        type="number" className={inp} placeholder="500" />
                    </div>
                    <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t("eligibleServicesComma")}
                    </label>
                    <input {...register("eligibleServices")} className={inp}
                        placeholder={t("gymMembershipsSports")} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAdd(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                    {t("cancel")}
                    </button>
                    <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm disabled:opacity-70"
                    style={{ background: "#0f766e" }}>
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {t("create")}
                    </button>
                </div>
                </form>
            </div>
            </div>
        )}
        </div>
    );
}

const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400";