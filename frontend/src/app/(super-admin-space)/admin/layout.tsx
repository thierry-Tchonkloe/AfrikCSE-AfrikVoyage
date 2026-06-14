"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard,
    Building2,
    ClipboardCheck,
    Settings,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Menu,
    Sun,
    Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { useTheme } from "@/hooks/useTheme";
import { adminService } from "@/services/admin/admin.service";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { NotificationBell } from "@/components/shared/NotificationBell";

const NAV_ITEMS = [
    { href: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/admin/companies", label: "Entreprises", icon: Building2 },
    { href: "/admin/validations", label: "Validations", icon: ClipboardCheck, badge: true },
    { href: "/admin/settings", label: "Paramètres", icon: Settings },
    { href: "/admin/messages", label: "Messagerie", icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // sidebar ouverte par défaut sur grand écran, fermée sur petit
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { darkMode, setDarkMode } = useTheme();
    const [pendingCount, setPendingCount] = useState(0);

    // useLayoutEffect (et non useEffect) pour fixer l'état AVANT le premier paint :
    // évite qu'un panneau plein écran apparaisse brièvement sur mobile au chargement.
    useLayoutEffect(() => {
        // Sur mobile/tablette, la sidebar est repliée hors écran par défaut et ne
        // devient accessible que via le petit bouton "menu" (cf. header). Sur grand
        // écran, elle reste visible et ouverte par défaut.
        const applyFromViewport = () => setSidebarOpen(window.innerWidth >= 1024);
        applyFromViewport();

        window.addEventListener("resize", applyFromViewport);
        return () => window.removeEventListener("resize", applyFromViewport);
    }, []);

    // Nombre d'entreprises en attente de validation — alimente le badge
    // de la sidebar et la cloche de notifications, rafraîchi toutes les 60s.
    useEffect(() => {
        const loadPendingCount = () => {
            adminService
                .getOrganizations({ status: "PENDING", limit: 1 })
                .then((res) => setPendingCount(res.total ?? 0))
                .catch(() => {});
        };
        loadPendingCount();
        const interval = setInterval(loadPendingCount, 60000);
        return () => clearInterval(interval);
    }, []);

    const { user, loading } = useRouteGuard("super-admin");

    if (loading || !user) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
                Vérification de l&apos;accès…
            </div>
        );
    }

    return (
        <div
        className={cn(
            "flex h-screen overflow-hidden",
            darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
        )}
        >
        {/* ── Overlay mobile ── */}
        {sidebarOpen && (
            <div
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            />
        )}

        {/* ── Sidebar ──
            Mobile (< lg) : entièrement masquée hors écran (off-canvas) et accessible
            uniquement via le petit bouton "menu" du header — comportement standard.
            Desktop (>= lg) : toujours visible, largeur repliable icône/texte. */}
        <aside
            className={cn(
            "fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-64 transition-transform duration-300 ease-in-out border-r",
            "lg:translate-x-0 lg:transition-[width] lg:duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            sidebarOpen ? "lg:w-56" : "lg:w-16",
            darkMode
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-gray-200"
            )}
        >
            {/* Logo + toggle */}
            <div className="flex items-center h-16 px-3 border-b gap-2"
            style={{ borderColor: darkMode ? "#374151" : "#e5e7eb" }}>
            {sidebarOpen && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: "var(--color-primary)" }}
                >
                    A
                </div>
                <span className="font-bold text-sm truncate"
                    style={{ color: "var(--color-primary)" }}>
                    AfrikCSE & AfrikVoyage
                </span>
                </div>
            )}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
            >
                {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
            {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
                const active = pathname.startsWith(href);
                return (
                <button
                    key={href}
                    onClick={() => {
                        router.push(href);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                    active
                        ? "text-white"
                        : darkMode
                        ? "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                    style={active ? { background: "var(--color-primary)" } : {}}
                    title={!sidebarOpen ? label : undefined}
                >
                    <Icon size={18} className="shrink-0" />
                    {sidebarOpen && <span className="truncate">{label}</span>}
                    {/* Badge demandes en attente */}
                    {badge && pendingCount > 0 && (
                    <span
                        className={cn(
                        "text-white text-xs rounded-full px-1.5 py-0.5 font-bold",
                        sidebarOpen ? "ml-auto" : "absolute top-1 right-1 w-4 h-4 flex items-center justify-center p-0"
                        )}
                        style={{ background: "#ef4444" }}
                    >
                        {pendingCount}
                    </span>
                    )}
                </button>
                );
            })}
            </nav>

            {/* User info bas de sidebar */}
            <div className={cn(
            "p-3 border-t",
            darkMode ? "border-gray-700" : "border-gray-200"
            )}>
            {sidebarOpen ? (
                <div className="flex items-center gap-2">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: "var(--color-primary)" }}
                >
                    {user.firstName?.[0] ?? "A"}{user.lastName?.[0] ?? ""}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">
                    {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#9ca3af" }}>
                    Super Administrateur
                    </p>
                </div>
                <button onClick={logout} title="Déconnexion"
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    style={{ color: "#9ca3af" }}>
                    <LogOut size={15} />
                </button>
                </div>
            ) : (
                <button onClick={logout} title="Déconnexion"
                className="w-full flex justify-center p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                style={{ color: "#9ca3af" }}>
                <LogOut size={16} />
                </button>
            )}
            </div>
        </aside>

        {/* ── Zone principale ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Navbar */}
            <header className={cn(
            "h-16 flex items-center justify-between px-6 border-b shrink-0",
            darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
            )}>
            {/* Bouton menu mobile */}
            <button
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}
            >
                <Menu size={20} />
            </button>

            {/* Titre de la page courant */}
            <div className="hidden lg:block shrink-0">
                <p className="text-sm font-semibold">
                {NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.label || "Admin"}
                </p>
            </div>

            {/* Barre de recherche globale */}
            <div className="hidden sm:flex items-center flex-1 max-w-md mx-4">
                <GlobalSearch scope="admin" darkMode={darkMode} placeholder="Rechercher entreprises, utilisateurs..." />
            </div>

            {/* Actions navbar */}
            <div className="flex items-center gap-2 ml-auto">
                {/* Dark mode toggle */}
                <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Notifications */}
                <NotificationBell darkMode={darkMode} notificationsHref="/admin/notifications" />

                {/* Avatar */}
                <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                style={{ background: "var(--color-primary)" }}
                onClick={() => router.push("/admin/settings")}
                >
                {user.firstName?.[0] ?? "A"}{user.lastName?.[0] ?? ""}
                </div>
            </div>
            </header>

            {/* Contenu scrollable */}
            <main className={cn(
            "flex-1 overflow-y-auto p-4 md:p-6",
            darkMode ? "bg-gray-900" : "bg-gray-50"
            )}>
            {children}
            </main>
        </div>
        </div>
    );
}