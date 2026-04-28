"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {LayoutDashboard, Users, Settings, ChevronLeft, ChevronRight, Bell, LogOut, Menu, Moon, Sun,} from "lucide-react";
import { cn } from "@/lib/utils";

// Navigation dynamique selon les modules activés
function useNavItems(hasCSE: boolean, hasVoyage: boolean) {
    const items = [
        { href: "/companies/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
        { href: "/companies/users", label: "Utilisateurs", icon: Users },
        { href: "/companies/settings", label: "Paramètres", icon: Settings },
    ];

    if (hasCSE) items.splice(1, 0, {
        href: "/companies/AfrikCSE",
        label: "AfrikCSE",
        icon: Users, // remplacer par icône dédiée
    });

    if (hasVoyage) items.splice(hasCSE ? 2 : 1, 0, {
        href: "/companies/AfrikVoyage",
        label: "AfrikVoyage",
        icon: LayoutDashboard,
    });

    return items;
}

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const router  = useRouter();
    const pathname = usePathname();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [darkMode, setDarkMode]       = useState(false);

    const navItems = useNavItems(
        user?.organization?.hasCSE ?? false,
        user?.organization?.hasVoyage ?? false
    );

    useEffect(() => {
        if (window.innerWidth < 1024) setSidebarOpen(false);
        const fn = () => { if (window.innerWidth < 1024) setSidebarOpen(false); };
        window.addEventListener("resize", fn);
        return () => window.removeEventListener("resize", fn);
    }, []);

    useEffect(() => {
        if (!loading && !user) router.push("/login");
        if (!loading && user?.role === "SUPER_ADMIN") router.push("/admin/dashboard");
    }, [user, loading, router]);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
    }, [darkMode]);

    if (loading || !user) return null;

    return (
        <div className={cn("flex h-screen overflow-hidden",
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900")}>

        {/* Overlay mobile */}
        {sidebarOpen && (
            <div className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={cn(
            "fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 border-r",
            sidebarOpen ? "w-56" : "w-16",
            darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}>
            {/* Logo */}
            <div className="flex items-center h-16 px-3 border-b gap-2"
            style={{ borderColor: darkMode ? "#374151" : "#e5e7eb" }}>
            {sidebarOpen && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: "var(--color-primary)" }}
                >
                    {user.organization?.name?.[0] ?? "A"}
                </div>
                <span className="font-semibold text-sm truncate"
                    style={{ color: "var(--color-text)" }}>
                    {user.organization?.name ?? "Entreprise"}
                </span>
                </div>
            )}
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
            {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                <button key={href} onClick={() => router.push(href)}
                    className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active ? "text-white" : darkMode
                        ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"
                    )}
                    style={active ? { background: "var(--color-primary)" } : {}}
                    title={!sidebarOpen ? label : undefined}>
                    <Icon size={18} className="shrink-0" />
                    {sidebarOpen && <span className="truncate">{label}</span>}
                </button>
                );
            })}
            </nav>

            {/* User bas sidebar */}
            <div className={cn("p-3 border-t",
            darkMode ? "border-gray-700" : "border-gray-200")}>
            {sidebarOpen ? (
                <div className="flex items-center gap-2">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: "var(--color-primary)" }}
                >
                    {user.firstName[0]}{user.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">
                    {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#9ca3af" }}>
                    {user.role.replace("_", " ")}
                    </p>
                </div>
                <button onClick={logout} title="Déconnexion"
                    className="p-1 rounded hover:bg-gray-100"
                    style={{ color: "#9ca3af" }}>
                    <LogOut size={15} />
                </button>
                </div>
            ) : (
                <button onClick={logout}
                className="w-full flex justify-center p-1.5 rounded"
                style={{ color: "#9ca3af" }}>
                <LogOut size={16} />
                </button>
            )}
            </div>
        </aside>

        {/* Zone principale */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Navbar */}
            <header className={cn(
            "h-16 flex items-center justify-between px-6 border-b shrink-0",
            darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
            )}>
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}>
                <Menu size={20} />
            </button>

            <div className="hidden lg:block">
                <p className="text-sm font-semibold">
                {navItems.find((n) => pathname.startsWith(n.href))?.label || "Espace entreprise"}
                </p>
            </div>

            <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100"
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                <Bell size={18} />
                </button>
                <button
                onClick={() => router.push("/hub")}
                className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:bg-gray-50"
                style={{ color: "var(--color-primary)", borderColor: "var(--color-primary)" }}
                >
                Changer de module
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