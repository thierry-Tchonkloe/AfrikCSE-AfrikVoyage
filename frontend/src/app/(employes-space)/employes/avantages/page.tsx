"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";

interface CatalogItem {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    category: string;
    subsidyPct: number;
    employeePrice: number;
    companyPrice: number;
}

// Catégories avec icônes
const CATEGORY_TABS = [
    { id: "all",               label: "All Categories",      icon: "🏷️" },
    { id: "Sports et bien-être", label: "Sports et bien-être", icon: "🏋️" },
    { id: "Restauration",      label: "Restauration",        icon: "🍽️" },
    { id: "Education",         label: "Education",           icon: "🎓" },
    { id: "Culture et événements", label: "Culture et événements", icon: "🎭" },
    { id: "Santé et soins",    label: "Santé et soins",      icon: "💊" },
];

const SORT_OPTIONS = ["Popularité", "Prix croissant", "Subvention"];

// Mock catalogue riche
const MOCK_CATALOG: CatalogItem[] = [
    {
        id: "1", title: "Abonnement à la salle de sport",
        description: "Annual gym membership at premium fitness centers nationwide",
        imageUrl: null, category: "Sports et bien-être",
        subsidyPct: 80, employeePrice: 120, companyPrice: 480,
    },
    {
        id: "2", title: "Tickets restaurant",
        description: "Monthly meal vouchers valid at 5,000+ restaurants",
        imageUrl: null, category: "Restauration",
        subsidyPct: 50, employeePrice: 75, companyPrice: 75,
    },
    {
        id: "3", title: "Cours en ligne",
        description: "Access to professional development courses and certifications",
        imageUrl: null, category: "Education",
        subsidyPct: 100, employeePrice: 0, companyPrice: 500,
    },
    {
        id: "4", title: "Billets pour l'événement",
        description: "Concerts, theater, sports events and cultural activities",
        imageUrl: null, category: "Culture et événements",
        subsidyPct: 40, employeePrice: 40, companyPrice: 60,
    },
    {
        id: "5", title: "Soins dentaires",
        description: "Comprehensive dental coverage including preventive care",
        imageUrl: null, category: "Santé et soins",
        subsidyPct: 70, employeePrice: 90, companyPrice: 210,
    },
    {
        id: "6", title: "Pass de transport",
        description: "Monthly public transportation pass for all zones",
        imageUrl: null, category: "Sports et bien-être",
        subsidyPct: 75, employeePrice: 20, companyPrice: 60,
    },
    {
        id: "7", title: "Soutien à la garde d'enfants",
        description: "Subsidized childcare services and daycare facilities",
        imageUrl: null, category: "Santé et soins",
        subsidyPct: 65, employeePrice: 175, companyPrice: 325,
    },
    {
        id: "8", title: "Bien-être et spa",
        description: "Relaxation treatments and wellness services",
        imageUrl: null, category: "Sports et bien-être",
        subsidyPct: 55, employeePrice: 45, companyPrice: 55,
    },
    {
        id: "9", title: "Espaces de coworking",
        description: "Access to premium coworking spaces nationwide",
        imageUrl: null, category: "Education",
        subsidyPct: 60, employeePrice: 25, companyPrice: 225,
    },
];

// Couleurs par catégorie
const CATEGORY_COLORS: Record<string, string> = {
    "Sports et bien-être": "#10b981",
    "Restauration":         "#f59e0b",
    "Education":            "#3b82f6",
    "Culture et événements":"#8b5cf6",
    "Santé et soins":       "#ef4444",
};

// Emojis de remplacement pour les images
const CATEGORY_EMOJIS: Record<string, string> = {
    "Sports et bien-être": "🏋️",
    "Restauration":         "🍽️",
    "Education":            "🎓",
    "Culture et événements":"🎭",
    "Santé et soins":       "💊",
};

export default function AvantagesPage() {
    const router = useRouter();
    const [items, setItems]         = useState<CatalogItem[]>([]);
    const [loading, setLoading]     = useState(true);
    const [activeCategory, setActiveCategory] = useState("all");
    const [search, setSearch]       = useState("");
    const [sortBy, setSortBy]       = useState("Popularité");
    const [availableBudget]         = useState(2450); // mock

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const data = await employeeService.getCatalog({
            category: activeCategory !== "all" ? activeCategory : "",
            search,
            sortBy,
        });
        setItems(data.length ? data : MOCK_CATALOG);
        } catch {
        setItems(MOCK_CATALOG);
        } finally {
        setLoading(false);
        }
    }, [activeCategory, search, sortBy]);

    useEffect(() => { load(); }, [load]);

    // Filtre local sur mock
    const filtered = MOCK_CATALOG.filter((item) => {
        const matchCat = activeCategory === "all" || item.category === activeCategory;
        const matchSearch = !search ||
        item.title.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    return (
        <div className="space-y-5">
        {/* En-tête */}
        <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Avantages populaires</h1>
            <p className="text-sm text-gray-500">
                Découvrez et utilisez vos avantages sociaux
            </p>
            </div>
            <div className="flex items-center gap-3">
            <div
                className="text-sm font-medium px-3 py-1.5 rounded-lg"
                style={{ background: "#f0fdf4", color: "#0f766e" }}
            >
                Available budget : <strong>€{availableBudget.toLocaleString()}</strong>
            </div>
            <button
                onClick={() => toast.info("Historique des demandes")}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "#0f766e" }}
            >
                Request History
            </button>
            </div>
        </div>

        {/* Barre recherche + tri */}
        <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search benefits, categories, or services..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
            />
            </div>
            <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-gray-500" />
            <span className="text-xs text-gray-500">Trier par :</span>
            <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
            >
                {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
            </div>
        </div>

        {/* Onglets catégories */}
        <div className="flex gap-2 flex-wrap">
            {CATEGORY_TABS.map((cat) => (
            <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={activeCategory === cat.id
                ? { background: "#0f766e", color: "white", borderColor: "#0f766e" }
                : { borderColor: "#e5e7eb", color: "#6b7280", background: "white" }}
            >
                <span>{cat.icon}</span>
                {cat.label}
            </button>
            ))}
        </div>

        {/* Grille catalogue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(loading ? MOCK_CATALOG : filtered).map((item) => {
            const color = CATEGORY_COLORS[item.category] ?? "#0f766e";
            const emoji = CATEGORY_EMOJIS[item.category] ?? "🎁";

            return (
                <div key={item.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                {/* Image / placeholder */}
                <div
                    className="h-36 flex items-center justify-center relative"
                    style={{ background: color + "18" }}
                >
                    <span className="text-5xl">{emoji}</span>
                    {/* Badge subvention */}
                    <span
                    className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full text-white"
                    style={{ background: color }}
                    >
                    {item.subsidyPct}% subsidy
                    </span>
                </div>

                {/* Contenu */}
                <div className="p-4 flex flex-col flex-1">
                    <p className="text-xs font-medium mb-1" style={{ color }}>
                    {emoji} {item.category}
                    </p>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1 flex-1 line-clamp-2">
                    {item.description}
                    </p>

                    {/* Prix */}
                    <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Your contribution</span>
                        <span className="font-semibold text-gray-900">
                        €{item.employeePrice}
                        <span className="text-gray-400 font-normal">/year</span>
                        </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Company pays</span>
                        <span className="font-semibold" style={{ color }}>
                        €{item.companyPrice}
                        </span>
                    </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                    <button
                        onClick={() => router.push(`/employes/avantages/${item.id}`)}
                        className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Voir l&apos;offre
                    </button>
                    <button
                        onClick={() => toast.success(`Avantage "${item.title}" utilisé !`)}
                        className="flex-1 py-2 rounded-lg text-white text-xs font-medium"
                        style={{ background: color }}
                    >
                        Use This Benefit
                    </button>
                    </div>
                </div>
                </div>
            );
            })}
        </div>
        </div>
    );
}