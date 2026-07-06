"use client";

import { useState, useLayoutEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard, Plane, FileText, Calendar,
    Gift, MessageSquare, CalendarDays, User, Settings,
    ChevronLeft, ChevronRight, LogOut, Menu,
    Mail, Sun, Moon, LifeBuoy, Bell, FileClock, Users, Ticket, Trophy,
    HelpCircle, Images, Wallet, CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { useTheme } from "@/hooks/useTheme";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { UserAvatar } from "@/components/employes/UserAvatar";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

// Navigation principale employé
const NAV_ITEMS = [
    { href: "/employes/dashboard",      label: "Dashboard",            icon: LayoutDashboard },
    { href: "/employes/voyages",        label: "Mes voyages",          icon: Plane },
    { href: "/employes/notes-de-frais", label: "Notes de frais",       icon: FileText },
    { href: "/employes/reserver",       label: "Réservez votre voyage", icon: Calendar },
    { href: "/employes/avantages",      label: "Mes avantages",        icon: Gift },
    { href: "/employes/famille",        label: "Ma famille",           icon: Users },
    { href: "/employes/tickets",        label: "Mes tickets",          icon: Ticket },
    { href: "/employes/voyages/groupe", label: "Voyages de groupe",    icon: Users },
    { href: "/employes/recompenses",    label: "Récompenses",          icon: Trophy },
    { href: "/employes/communication",  label: "Communication CSE",    icon: MessageSquare },
    { href: "/employes/evenements",          label: "Calendrier des Évènements", icon: CalendarDays },
    { href: "/employes/evenements/galerie", label: "Galerie photos",           icon: Images },
    { href: "/employes/wallet",             label: "Mon wallet",               icon: Wallet },
    { href: "/employes/reservations",       label: "Mes réservations",         icon: CalendarCheck },
    { href: "/employes/faq",                label: "FAQ",                      icon: HelpCircle },
    { href: "/employes/support",            label: "Support",                  icon: LifeBuoy },
    { href: "/employes/notifications", label: "Notifications",       icon: Bell, badge: true },
    { href: "/employes/mes-demandes", label: "Mes demandes", icon: FileClock },
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
    const { darkMode, setDarkMode } = useTheme();

    // useLayoutEffect (et non useEffect) pour fixer l'état AVANT le premier paint :
    // évite qu'un panneau plein écran apparaisse brièvement sur mobile au chargement.
    // Sur mobile/tablette, la sidebar est repliée hors écran par défaut et n'est
    // accessible que via le petit bouton "menu" du header ; sur grand écran elle
    // reste visible et ouverte par défaut.
    useLayoutEffect(() => {
        const applyFromViewport = () => setSidebarOpen(window.innerWidth >= 1024);
        applyFromViewport();
        window.addEventListener("resize", applyFromViewport);
        return () => window.removeEventListener("resize", applyFromViewport);
    }, []);

    // useEffect(() => {
    //     if (!loading && !user) router.push("/login");
    // }, [user, loading, router]);

    const { user, loading } = useRouteGuard("employee");

    if (loading || !user) return null;

    // Couleurs pilotées par le système de thémisation dynamique (cf. useTheme/theme.ts) :
    // sidebar sur la teinte "brand-dark", accent et états actifs sur la couleur primaire.
    const SIDEBAR_BG  = "var(--color-brand-dark)";
    const SIDEBAR_ACTIVE = "var(--color-primary)";
    const ACCENT = "var(--color-primary)";

    return (
        <div className={cn(
            "flex h-screen overflow-hidden",
            darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
        )}>
        {/* Overlay mobile */}
        {sidebarOpen && (
            <div className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── masquée hors écran sur mobile, accessible uniquement via
            le bouton "menu" du header ; toujours visible et repliable sur desktop */}
        <aside
            className={cn(
            "fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:transition-[width]",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
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
                    onClick={() => {
                        router.push(href);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
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
                    onClick={() => {
                        router.push(href);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
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
                <UserAvatar
                    avatar={user.avatar}
                    firstName={user.firstName}
                    lastName={user.lastName}
                    background={ACCENT}
                    className="w-8 h-8 text-xs"
                />
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
            <header className={cn(
                "h-16 flex items-center justify-between px-6 border-b shrink-0",
                darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
            )}>
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setSidebarOpen(true)}>
                <Menu size={20} />
            </button>

            {/* Barre de recherche globale */}
            <div className="hidden sm:flex items-center flex-1 max-w-md mx-4">
                <GlobalSearch scope="employee" darkMode={darkMode} placeholder="Rechercher voyages, frais, avantages..." />
            </div>

            {/* Actions droite */}
            <div className="flex items-center gap-2 ml-auto">
                {/* Dark mode toggle */}
                <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <LanguageSwitcher compact />
                <NotificationBell darkMode={darkMode} notificationsHref="/employes/notifications" />
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                <Mail size={18} />
                </button>
                <div className={cn(
                    "flex items-center gap-2 pl-2 border-l",
                    darkMode ? "border-gray-700" : "border-gray-200"
                )}>
                <UserAvatar
                    avatar={user.avatar}
                    firstName={user.firstName}
                    lastName={user.lastName}
                    background={ACCENT}
                    className="w-8 h-8 text-xs cursor-pointer"
                    onClick={() => router.push("/employes/profile")}
                />
                <div className="hidden sm:block">
                    <p className="text-xs font-semibold">
                    {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                    {user.role.replace("_", " ")}
                    </p>
                </div>
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