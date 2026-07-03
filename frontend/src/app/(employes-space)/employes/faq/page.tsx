"use client";

import { useEffect, useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Search, Loader2 } from "lucide-react";
import { faqService } from "@/services/employes/faq.service";
import { FaqEntry } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

export default function FaqEmployeePage() {
    const [entries, setEntries]       = useState<FaqEntry[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [expanded, setExpanded]     = useState<string | null>(null);
    const [search, setSearch]         = useState("");
    const [loading, setLoading]       = useState(true);
    const [voting, setVoting]         = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [faqData, cats] = await Promise.all([
                faqService.getPublished(activeCategory ?? undefined),
                faqService.getCategories(),
            ]);
            setEntries(faqData);
            setCategories(cats);
        } catch {
            toast.error("Erreur lors du chargement de la FAQ");
        } finally {
            setLoading(false);
        }
    }, [activeCategory]);

    useEffect(() => { load(); }, [load]);

    const handleVote = async (id: string, helpful: boolean) => {
        setVoting(id);
        try {
            await faqService.vote(id, helpful);
            toast.success(helpful ? "Marqué comme utile" : "Merci pour votre retour");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors du vote"));
        } finally {
            setVoting(null);
        }
    };

    const filtered = entries.filter((e) =>
        !search ||
        e.question.toLowerCase().includes(search.toLowerCase()) ||
        e.answer.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5 max-w-3xl mx-auto">
            {/* En-tête */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Foire aux questions</h1>
                <p className="text-sm text-gray-500">Trouvez rapidement les réponses à vos questions</p>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher dans la FAQ…"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white"
                />
            </div>

            {/* Filtres par catégorie */}
            {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setActiveCategory(null)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                        style={!activeCategory
                            ? { background: "var(--color-primary)", color: "white" }
                            : { background: "#f3f4f6", color: "#6b7280" }}
                    >
                        Toutes
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                            style={activeCategory === cat
                                ? { background: "var(--color-primary)", color: "white" }
                                : { background: "#f3f4f6", color: "#6b7280" }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Liste FAQ */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">
                    {search ? "Aucun résultat pour votre recherche." : "Aucune question publiée pour le moment."}
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((entry) => {
                        const isOpen = expanded === entry.id;
                        return (
                            <div key={entry.id}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() => setExpanded(isOpen ? null : entry.id)}
                                    className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {entry.category && (
                                            <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
                                                {entry.category}
                                            </span>
                                        )}
                                        <span className="text-sm font-medium text-gray-900">{entry.question}</span>
                                    </div>
                                    {isOpen
                                        ? <ChevronUp size={16} className="shrink-0 text-gray-400" />
                                        : <ChevronDown size={16} className="shrink-0 text-gray-400" />}
                                </button>

                                {isOpen && (
                                    <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
                                        <p className="text-sm text-gray-700 leading-relaxed pt-4 whitespace-pre-line">
                                            {entry.answer}
                                        </p>
                                        <div className="flex items-center gap-3 pt-1">
                                            <span className="text-xs text-gray-400">Cette réponse vous a-t-elle aidé ?</span>
                                            <button
                                                onClick={() => handleVote(entry.id, true)}
                                                disabled={voting === entry.id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-colors disabled:opacity-50"
                                            >
                                                {voting === entry.id
                                                    ? <Loader2 size={12} className="animate-spin" />
                                                    : <ThumbsUp size={12} />}
                                                Oui
                                            </button>
                                            <button
                                                onClick={() => handleVote(entry.id, false)}
                                                disabled={voting === entry.id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors disabled:opacity-50"
                                            >
                                                {voting === entry.id
                                                    ? <Loader2 size={12} className="animate-spin" />
                                                    : <ThumbsDown size={12} />}
                                                Non
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
