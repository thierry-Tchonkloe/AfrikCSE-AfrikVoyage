"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, MoreVertical, Loader2, Save, X } from "lucide-react";
import { cseService } from "@/services/companies/cse.service";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface Category {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    annualBudget: number;
    perEmployeeLimit: number;
    isActive: boolean;
    eligibleServices: string[];
    budgetUsed: number;
    _count: { requests: number };
}

const GLOBAL_RULES = [
    { label: "Exercice fiscal",         key: "fiscal",    options: ["2024 (Jan - Dec)", "2025 (Jan - Dec)"] },
    { label: "Approbation requise",     key: "approval",  options: ["Above €200", "Above €500", "Toujours"] },
    { label: "Période de réinitialisation", key: "reset", options: ["Annual", "Quarterly", "Monthly"] },
];

const catSchema = z.object({
    name:             z.string().min(1, "Nom requis"),
    description:      z.string().optional(),
    icon:             z.string().optional(),
    annualBudget:     z.number().min(0),
    perEmployeeLimit: z.number().min(0),
    eligibleServices: z.string(), // séparés par virgule
});

type CatForm = z.infer<typeof catSchema>;

export default function BudgetPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading]       = useState(true);
    const [showAdd, setShowAdd]       = useState(false);
    const [saving, setSaving]         = useState(false);
    const [autoApprove, setAutoApprove] = useState(true);
    const [globalRules, setGlobalRules] = useState<Record<string, string>>({
        fiscal: "2024 (Jan - Dec)",
        approval: "Above €200",
        reset: "Annual",
    });

    const { register, handleSubmit, reset, formState: { errors } } =
        useForm<CatForm>({ resolver: zodResolver(catSchema) });

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const data = await cseService.getCategories();
        setCategories(data);
        } catch { toast.error("Erreur chargement"); }
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
        toast.success("Catégorie créée");
        setShowAdd(false);
        reset();
        load();
        } catch { toast.error("Erreur création"); }
        finally { setSaving(false); }
    };

    const toggleActive = async (cat: Category) => {
        try {
        await cseService.updateCategory(cat.id, { isActive: !cat.isActive });
        toast.success(cat.isActive ? "Catégorie désactivée" : "Catégorie activée");
        load();
        } catch { toast.error("Erreur"); }
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
            <h1 className="text-xl font-bold text-gray-900">Gestion des subventions</h1>
            <p className="text-sm text-gray-500">
                Configurez les règles et les budgets des subventions du CSE
            </p>
            </div>
            <div className="flex gap-2">
            <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "#0f766e" }}
            >
                <Plus size={15} /> Add New Category
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                Export Rules
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
                    <div className="flex items-center gap-2">
                        <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={cat.isActive
                            ? { color: "#0f766e", background: "#f0fdf4" }
                            : { color: "#9ca3af", background: "#f9fafb" }}
                        >
                        {cat.isActive ? "Active" : "Inactive"}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={16} />
                        </button>
                    </div>
                    </div>

                    {/* Budget */}
                    <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Annual Budget</p>
                        <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-gray-900">
                            €{cat.annualBudget.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400">EUR</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Per Employee Limit</p>
                        <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-gray-900">
                            €{cat.perEmployeeLimit.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400">EUR</span>
                        </div>
                    </div>
                    </div>

                    {/* Services éligibles */}
                    {cat.eligibleServices.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-500 mb-2">Eligible Services</p>
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
                        <span className="text-gray-500">Budget Usage</span>
                        <span className="font-medium text-gray-700">
                        €{cat.budgetUsed.toLocaleString()} / €{cat.annualBudget.toLocaleString()}
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

        {/* Règles globales */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 pb-2 border-b border-gray-100">
            Règles et paramètres globaux
            </h3>
            <p className="text-xs text-gray-500">
            Configurez les politiques de subvention à l&#39;échelle de l&#39;entreprise
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {GLOBAL_RULES.map((rule) => (
                <div key={rule.key}>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {rule.label}
                </label>
                <select
                    value={globalRules[rule.key]}
                    onChange={(e) => setGlobalRules({ ...globalRules, [rule.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                >
                    {rule.options.map((o) => <option key={o}>{o}</option>)}
                </select>
                </div>
            ))}
            </div>
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
                <p className="text-sm font-medium text-gray-900">
                Approbation automatique des demandes inférieures au seuil
                </p>
                <p className="text-xs text-gray-500">
                Approuver automatiquement les demandes inférieures au seuil défini
                </p>
            </div>
            <button
                onClick={() => setAutoApprove(!autoApprove)}
                className="relative w-11 h-6 rounded-full transition-colors shrink-0"
                style={{ background: autoApprove ? "#0f766e" : "#d1d5db" }}
            >
                <span
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                style={{ transform: autoApprove ? "translateX(20px)" : "translateX(2px)" }}
                />
            </button>
            </div>
            <div className="flex justify-end gap-2">
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                Cancel
            </button>
            <button
                onClick={() => toast.success("Paramètres enregistrés")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "#f59e0b" }}
            >
                <Save size={14} /> Save All Changes
            </button>
            </div>
        </div>

        {/* Modal ajout catégorie */}
        {showAdd && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Nouvelle catégorie</h3>
                <button onClick={() => setShowAdd(false)} className="text-gray-400">
                    <X size={18} />
                </button>
                </div>
                <form onSubmit={handleSubmit(onAddCategory)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                    <input {...register("name")} className={inp} placeholder="Sports et bien-être" />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                    </div>
                    <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <input {...register("description")} className={inp} placeholder="Description..." />
                    </div>
                    <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Budget annuel (€)</label>
                    <input {...register("annualBudget", { valueAsNumber: true })}
                        type="number" className={inp} placeholder="50000" />
                    </div>
                    <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Limite par employé (€)</label>
                    <input {...register("perEmployeeLimit", { valueAsNumber: true })}
                        type="number" className={inp} placeholder="500" />
                    </div>
                    <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Services éligibles (séparés par virgule)
                    </label>
                    <input {...register("eligibleServices")} className={inp}
                        placeholder="Gym memberships, Sports equipment" />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAdd(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                    Annuler
                    </button>
                    <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm disabled:opacity-70"
                    style={{ background: "#0f766e" }}>
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    Créer
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