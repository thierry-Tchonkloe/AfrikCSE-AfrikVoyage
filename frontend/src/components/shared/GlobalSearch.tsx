"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Plane, FileText, Gift, CalendarDays, User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchService, SearchResultItem, SearchScope } from "@/services/search.service";

const TYPE_META: Record<SearchResultItem["type"], { label: string; icon: typeof Search }> = {
    travel:       { label: "Voyage",       icon: Plane },
    expense:      { label: "Note de frais", icon: FileText },
    benefit:      { label: "Avantage",     icon: Gift },
    event:        { label: "Événement",    icon: CalendarDays },
    employee:     { label: "Employé",      icon: User },
    organization: { label: "Organisation", icon: Building2 },
};

export function GlobalSearch({
    scope,
    darkMode = false,
    placeholder = "Rechercher...",
    className,
}: {
    scope: SearchScope;
    darkMode?: boolean;
    placeholder?: string;
    className?: string;
}) {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // Raccourci clavier Ctrl+K / Cmd+K pour focus la barre de recherche
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === "Escape") {
                inputRef.current?.blur();
                setOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Ferme le dropdown au clic extérieur
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Recherche avec debounce
    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) return;

        setLoading(true);
        const timer = setTimeout(() => {
            searchService.search(q, scope)
                .then((data) => setResults(data))
                .catch(() => setResults([]))
                .finally(() => setLoading(false));
        }, 300);

        return () => clearTimeout(timer);
    }, [query, scope]);

    const handleSelect = (item: SearchResultItem) => {
        setOpen(false);
        setQuery("");
        setResults([]);
        router.push(item.url);
    };

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className={cn(
                        "w-full pl-9 pr-12 py-2 border rounded-xl text-sm outline-none",
                        darkMode
                            ? "bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
                            : "bg-gray-50 border-gray-200"
                    )}
                />
                <kbd className={cn(
                    "hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center px-1.5 py-0.5 rounded text-[10px] font-medium border",
                    darkMode ? "border-gray-700 text-gray-500" : "border-gray-200 text-gray-400"
                )}>
                    Ctrl+K
                </kbd>
            </div>

            {open && query.trim().length >= 2 && (
                <div className={cn(
                    "absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-lg z-50 max-h-96 overflow-y-auto",
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                )}>
                    {loading ? (
                        <div className={cn("flex items-center justify-center gap-2 py-6 text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>
                            <Loader2 size={14} className="animate-spin" /> Recherche...
                        </div>
                    ) : results.length === 0 ? (
                        <div className={cn("py-6 text-center text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>
                            Aucun résultat pour « {query} »
                        </div>
                    ) : (
                        <ul className="py-2">
                            {results.map((item) => {
                                const { label, icon: Icon } = TYPE_META[item.type];
                                return (
                                    <li key={`${item.type}-${item.id}`}>
                                        <button
                                            onClick={() => handleSelect(item)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                                                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                                            )}
                                        >
                                            <span className={cn(
                                                "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                                                darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-500"
                                            )}>
                                                <Icon size={15} />
                                            </span>
                                            <span className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{item.title}</p>
                                                {item.subtitle && (
                                                    <p className={cn("text-xs truncate", darkMode ? "text-gray-400" : "text-gray-500")}>
                                                        {item.subtitle}
                                                    </p>
                                                )}
                                            </span>
                                            <span className={cn("text-[10px] uppercase font-semibold tracking-wide shrink-0", darkMode ? "text-gray-500" : "text-gray-400")}>
                                                {label}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
