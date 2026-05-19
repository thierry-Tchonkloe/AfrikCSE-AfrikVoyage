"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard, Plane, FileText, Calendar,
    Gift, MessageSquare, CalendarDays, User, Settings,
    ChevronLeft, ChevronRight, Bell, LogOut, Menu,
    Search, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteGuard } from "@/hooks/useRouteGuard";

// Navigation principale employé
const NAV_ITEMS = [
    { href: "/employes/dashboard",      label: "Dashboard",            icon: LayoutDashboard },
    { href: "/employes/voyages",        label: "Mes voyages",          icon: Plane },
    { href: "/employes/notes-de-frais", label: "Notes de frais",       icon: FileText },
    { href: "/employes/reserver",       label: "Réservez votre voyage", icon: Calendar },
    { href: "/employes/avantages",      label: "Mes avantages",        icon: Gift },
    { href: "/employes/communication",  label: "Communication CSE",    icon: MessageSquare },
    { href: "/employes/evenements",     label: "Calendrier des Évènements", icon: CalendarDays },
];

const NAV_BOTTOM = [
    { href: "/employes/profile",    label: "Profile",     icon: User },
    { href: "/employes/parametres", label: "Paramètres",  icon: Settings },
];

export default function EmployeLayout({ children }: { children: React.ReactNode }) {
    // const { user, loading, logout } = useAuth();
    const { logout } = useAuth();
    const router   = useRouter();
    const pathname = usePathname();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [search, setSearch]           = useState("");

    // useEffect(() => {
    //     if (window.innerWidth < 1024) setSidebarOpen(false);
    //     const fn = () => { if (window.innerWidth < 1024) setSidebarOpen(false); };
    //     window.addEventListener("resize", fn);
    //     return () => window.removeEventListener("resize", fn);
    // }, []);

    // useEffect(() => {
    //     if (!loading && !user) router.push("/login");
    // }, [user, loading, router]);

    const { user, loading } = useRouteGuard("employee");

    if (loading || !user) return null;

    // Couleur sidebar : dark (comme maquette)
    const SIDEBAR_BG  = "#0f2137";
    const SIDEBAR_ACTIVE = "#1a3550";
    const ACCENT = "#0f766e";

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Overlay mobile */}
        {sidebarOpen && (
            <div className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside
            className="fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-all duration-300"
            style={{
            width: sidebarOpen ? "220px" : "64px",
            background: SIDEBAR_BG,
            }}
        >
            {/* Logo */}
            <div className="flex items-center h-16 px-3 gap-2 border-b border-white/10">
            {sidebarOpen ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: ACCENT }}
                >
                    A
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">AfrikCSE &</p>
                    <p className="text-xs font-bold text-white truncate">AfrikVoyage</p>
                </div>
                </div>
            ) : (
                <div className="flex-1 flex justify-center">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: ACCENT }}
                >
                    A
                </div>
                </div>
            )}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 rounded hover:bg-white/10 text-white/60 shrink-0"
            >
                {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
            </div>

            {/* Nav principale */}
            <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                <button
                    key={href}
                    onClick={() => router.push(href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                    style={active
                    ? { background: SIDEBAR_ACTIVE, color: "white", fontWeight: 600 }
                    : { color: "rgba(255,255,255,0.6)" }
                    }
                    title={!sidebarOpen ? label : undefined}
                >
                    <Icon size={17} className="shrink-0" />
                    {sidebarOpen && <span className="truncate text-xs">{label}</span>}
                    {/* Indicateur actif */}
                    {active && sidebarOpen && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ background: ACCENT }} />
                    )}
                </button>
                );
            })}
            </nav>

            {/* Séparateur */}
            <div className="border-t border-white/10 mx-3" />

            {/* Nav bas (profile, paramètres) */}
            <nav className="py-3 space-y-0.5 px-2">
            {NAV_BOTTOM.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                <button
                    key={href}
                    onClick={() => router.push(href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                    style={active
                    ? { background: SIDEBAR_ACTIVE, color: "white" }
                    : { color: "rgba(255,255,255,0.5)" }
                    }
                    title={!sidebarOpen ? label : undefined}
                >
                    <Icon size={17} className="shrink-0" />
                    {sidebarOpen && <span className="truncate text-xs">{label}</span>}
                </button>
                );
            })}
            </nav>

            {/* User bas de sidebar */}
            <div className="p-3 border-t border-white/10">
            {sidebarOpen ? (
                <div className="flex items-center gap-2">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: ACCENT }}
                >
                    {user.firstName?.[0] ?? "E"}{user.lastName?.[0] ?? ""}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                    {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {user.role.replace("_", " ")}
                    </p>
                </div>
                <button onClick={logout} title="Déconnexion"
                    className="p-1 rounded hover:bg-white/10"
                    style={{ color: "rgba(255,255,255,0.5)" }}>
                    <LogOut size={14} />
                </button>
                </div>
            ) : (
                <button onClick={logout}
                className="w-full flex justify-center p-1.5 rounded hover:bg-white/10"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                <LogOut size={16} />
                </button>
            )}
            </div>
        </aside>

        {/* ── Zone principale ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Navbar */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white shrink-0">
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}>
                <Menu size={20} />
            </button>

            {/* Barre de recherche globale */}
            <div className="hidden sm:flex items-center flex-1 max-w-md mx-4">
                <div className="relative w-full">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search trips, expenses, benefits..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                />
                </div>
            </div>

            {/* Actions droite */}
            <div className="flex items-center gap-2 ml-auto">
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <Mail size={18} />
                </button>
                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                    style={{ background: ACCENT }}
                    onClick={() => router.push("/employes/profile")}
                >
                    {user.firstName?.[0] ?? "E"}{user.lastName?.[0] ?? ""}
                </div>
                <div className="hidden sm:block">
                    <p className="text-xs font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                    {user.role.replace("_", " ")}
                    </p>
                </div>
                </div>
            </div>
            </header>

            {/* Contenu scrollable */}
            <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {children}
            </main>
        </div>
        </div>
    );
}