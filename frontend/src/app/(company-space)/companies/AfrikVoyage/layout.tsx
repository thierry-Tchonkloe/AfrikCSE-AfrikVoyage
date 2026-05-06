"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard, Plane, FileText, BarChart2,
    Bell, Settings, ChevronLeft, ChevronRight,
    LogOut, Menu, Moon, Sun, Gift, ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV_ITEMS = [
    { href: "/companies/AfrikVoyage/dashboard",    label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/companies/AfrikVoyage/reservations", label: "Réservations",    icon: Plane },
    { href: "/companies/AfrikVoyage/frais",        label: "Notes de frais",  icon: FileText },
    { href: "/companies/AfrikVoyage/reporting",    label: "Reporting",       icon: BarChart2 },
    { href: "/companies/AfrikVoyage/settings",     label: "Paramètres",      icon: Settings },
];

export default function AfrikVoyageLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const router   = useRouter();
    const pathname = usePathname();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [darkMode, setDarkMode]       = useState(false);

    // Couleur primaire spécifique AfrikVoyage
    const PRIMARY = "#f59e0b"; // amber
    const TEXT_ON_PRIMARY = "#fff";

    useEffect(() => {
        if (window.innerWidth < 1024) setSidebarOpen(false);
        const fn = () => { if (window.innerWidth < 1024) setSidebarOpen(false); };
        window.addEventListener("resize", fn);
        return () => window.removeEventListener("resize", fn);
    }, []);

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
    }, [darkMode]);

    if (loading || !user) return null;

    const hasCSE = user.organization?.hasCSE ?? false;

    const handleSwitchToCSE = () => {
        if (hasCSE) {
        router.push("/companies/AfrikCSE/dashboard");
        } else {
        toast.info("Le module AfrikCSE n'est pas encore activé pour votre organisation.");
        router.push("/hub");
        }
    };

    return (
        <div className={cn(
        "flex h-screen overflow-hidden",
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
        )}>
        {sidebarOpen && (
            <div className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside className={cn(
            "fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 border-r",
            sidebarOpen ? "w-56" : "w-16",
            darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}>
            {/* Logo */}
            <div className="flex items-center h-16 px-3 border-b gap-2"
            style={{ borderColor: darkMode ? "#374151" : "#e5e7eb" }}>
            {sidebarOpen ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: PRIMARY }}
                >
                    <Plane size={16} style={{ color: TEXT_ON_PRIMARY }} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: PRIMARY }}>
                    AfrikVoyage
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                    {user.organization?.name ?? ""}
                    </p>
                </div>
                </div>
            ) : (
                <div className="flex-1 flex justify-center">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: PRIMARY }}
                >
                    <Plane size={16} style={{ color: TEXT_ON_PRIMARY }} />
                </div>
                </div>
            )}
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 rounded-lg hover:bg-gray-100 shrink-0 text-gray-500">
                {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                <button key={href} onClick={() => router.push(href)}
                    className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active ? "text-white" : darkMode
                        ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"
                    )}
                    style={active ? { background: PRIMARY } : {}}
                    title={!sidebarOpen ? label : undefined}>
                    <Icon size={17} className="shrink-0" />
                    {sidebarOpen && <span className="truncate">{label}</span>}
                </button>
                );
            })}
            </nav>

            {/* ── Bouton switch module ── */}
            <div className={cn("px-2 pb-2",
            sidebarOpen ? "" : "flex justify-center")}>
            <button
                onClick={handleSwitchToCSE}
                title="Accéder à AfrikCSE"
                className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border",
                sidebarOpen ? "w-full" : "w-10 h-10 justify-center p-0",
                hasCSE
                    ? "border-teal-200 text-teal-700 hover:bg-teal-50"
                    : "border-gray-200 text-gray-400 hover:bg-gray-50"
                )}
            >
                <Gift size={16} className="shrink-0" />
                {sidebarOpen && (
                <span className="flex-1 text-left">
                    {hasCSE ? "AfrikCSE" : "AfrikCSE 🔒"}
                </span>
                )}
                {sidebarOpen && hasCSE && <ArrowLeftRight size={13} />}
            </button>
            </div>

            {/* User */}
            <div className={cn("p-3 border-t",
            darkMode ? "border-gray-700" : "border-gray-200")}>
            {sidebarOpen ? (
                <div className="flex items-center gap-2">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: PRIMARY }}
                >
                    {user.firstName?.[0] ?? "A"}{user.lastName?.[0] ?? ""}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">
                    {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs truncate text-gray-400">
                    {user.role.replace("_", " ")}
                    </p>
                </div>
                <button onClick={logout} title="Déconnexion"
                    className="p-1 rounded hover:bg-gray-100 text-gray-400">
                    <LogOut size={14} />
                </button>
                </div>
            ) : (
                <button onClick={logout}
                className="w-full flex justify-center p-1.5 rounded text-gray-400">
                <LogOut size={16} />
                </button>
            )}
            </div>
        </aside>

        {/* ── Zone principale ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <header className={cn(
            "h-16 flex items-center justify-between px-6 border-b shrink-0",
            darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
            )}>
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}>
                <Menu size={20} />
            </button>

            <p className="hidden lg:block text-sm font-semibold text-gray-700">
                {NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.label ?? "AfrikVoyage"}
            </p>

            <div className="flex items-center gap-2 ml-auto">
                {/* Switch rapide navbar */}
                <button
                onClick={handleSwitchToCSE}
                className={cn(
                    "hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium",
                    hasCSE
                    ? "border-teal-300 text-teal-700 hover:bg-teal-50"
                    : "border-gray-200 text-gray-400"
                )}
                >
                <Gift size={13} />
                {hasCSE ? "AfrikCSE" : "AfrikCSE 🔒"}
                </button>

                <button
                onClick={() => router.push("/hub")}
                className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                <ArrowLeftRight size={13} /> Hub
                </button>

                <button onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
                </button>

                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <Bell size={17} />
                </button>
            </div>
            </header>

            <main className={cn("flex-1 overflow-y-auto p-6",
            darkMode ? "bg-gray-900" : "bg-gray-50")}>
            {children}
            </main>
        </div>
        </div>
    );
}