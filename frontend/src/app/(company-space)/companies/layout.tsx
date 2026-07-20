"use client";

import { useState, useLayoutEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Users, Settings, ChevronLeft, ChevronRight, Bell, LogOut, Menu, Moon, Sun, Wallet, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { useTheme } from "@/hooks/useTheme";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { NotificationBell } from "@/components/shared/NotificationBell";

// Navigation dynamique selon les modules activés et le pathname
function useNavItems(hasCSE: boolean, hasVoyage: boolean, pathname: string) {
    // ── Détecte quel module est actif ──
    const isInCSE = pathname.startsWith("/companies/AfrikCSE");
    const isInVoyage = pathname.startsWith("/companies/AfrikVoyage");
    
    // ── Basique : dashboard + org-wide items ──
    const items = [
        { href: "/companies/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    ];

    // ── Ajoute nav items du module si actif ──
    if (isInCSE && hasCSE) {
        items.push(
            { href: "/companies/AfrikCSE/dashboard", label: "AfrikCSE", icon: Users },
            { href: "/companies/AfrikCSE/avantages", label: "Approbations", icon: Users },
            { href: "/companies/AfrikCSE/employes", label: "Employés", icon: Users },
            { href: "/companies/AfrikCSE/catalogue", label: "Catalogue", icon: LayoutDashboard },
            { href: "/companies/AfrikCSE/budget", label: "Subventions", icon: Users },
            { href: "/companies/AfrikCSE/subventions", label: "Règles subsides", icon: Percent },
            { href: "/companies/AfrikCSE/rapport", label: "Rapport", icon: LayoutDashboard },
            { href: "/companies/AfrikCSE/faq",       label: "FAQ",           icon: Users },
            { href: "/companies/AfrikCSE/wallet",    label: "Wallets",       icon: Wallet },
            { href: "/companies/AfrikCSE/cashback",     label: "Cashback",     icon: Percent },
            { href: "/companies/AfrikCSE/commissions", label: "Commissions", icon: Percent },
            { href: "/companies/AfrikCSE/messages",  label: "Messagerie",    icon: Users },
            { href: "/companies/AfrikCSE/settings", label: "Paramètres", icon: Settings },
        );
    } else if (isInVoyage && hasVoyage) {
        items.push(
            { href: "/companies/AfrikVoyage/dashboard",   label: "AfrikVoyage",   icon: Users },
            { href: "/companies/AfrikVoyage/approbations", label: "Approbations",  icon: Users },
            { href: "/companies/AfrikVoyage/reservations", label: "Réservations",  icon: Users },
            { href: "/companies/AfrikVoyage/frais",       label: "Notes de frais", icon: Users },
            { href: "/companies/AfrikVoyage/politiques",  label: "Politiques",     icon: Users },
            { href: "/companies/AfrikVoyage/reporting",   label: "Duty of Care",   icon: Users },
            { href: "/companies/AfrikVoyage/settings",    label: "Paramètres",     icon: Settings },
        );
    } else {
        // ── Affiche les modules comme liens de navigation ──
        items.push(
            { href: "/companies/users", label: "Utilisateurs", icon: Users },
            { href: "/companies/settings", label: "Paramètres", icon: Settings },
            { href: "/companies/billing", label: "Billing", icon: Bell },
            { href: "/companies/notifications", label: "Notifications", icon: Bell },
            { href: "/companies/integrations", label: "Intégrations", icon: Users },
        );
        if (hasCSE) items.splice(1, 0, {
            href: "/companies/AfrikCSE/dashboard",
            label: "AfrikCSE",
            icon: Users,
        });
        if (hasVoyage) items.splice(hasCSE ? 2 : 1, 0, {
            href: "/companies/AfrikVoyage/dashboard",
            label: "AfrikVoyage",
            icon: Users,
        });
    }

    return items;
}

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
    // const { user, loading, logout } = useAuth();
    const { logout } = useAuth();
    const router  = useRouter();
    const pathname = usePathname();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { darkMode, setDarkMode } = useTheme();


    // Liste des dossiers à exclure du style de ce layout
    const excludedFolders = ["/companies/AfrikCSE", "/companies/AfrikVoyage"];

    // Vérifie si le chemin actuel commence par l'un des dossiers exclus
    const isExcluded = excludedFolders.some((folder) => pathname.startsWith(folder));


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
    //     if (!loading && user?.role === "SUPER_ADMIN") router.push("/admin/dashboard");
    // }, [user, loading, router]);

    // const { user, loading } = useRouteGuard("company");

    const { user, loading } = useRouteGuard("company");

    const navItems = useNavItems(
        user?.organization?.hasCSE ?? false,
        user?.organization?.hasVoyage ?? false,
        pathname
    );

    if (loading || !user) return null;

    return (
        <div className={cn("flex h-screen overflow-hidden",
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900")}>

        {/* Overlay mobile */}
        {sidebarOpen && (
            <div className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar — masquée hors écran sur mobile, accessible uniquement via le
            bouton "menu" du header ; toujours visible et repliable sur desktop */}
        <aside className={cn(
            "fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-64 transition-transform duration-300 ease-in-out border-r",
            "lg:translate-x-0 lg:transition-[width] lg:duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            sidebarOpen ? "lg:w-56" : "lg:w-16",
            darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}>
            {/* Logo */}
            <div className="flex items-center h-16 px-3 border-b gap-2"
            style={{ borderColor: darkMode ? "#374151" : "#e5e7eb" }}>
            {sidebarOpen && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                {user.organization?.logoUrl ? (
                    <img
                        src={user.organization.logoUrl}
                        alt={user.organization?.name ?? "Logo"}
                        className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                ) : (
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: "var(--color-primary)" }}
                    >
                        {user.organization?.name?.[0] ?? "A"}
                    </div>
                )}
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
                <button key={href} onClick={() => {
                    router.push(href);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
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

            <div className="hidden lg:block shrink-0">
                <p className="text-sm font-semibold">
                {navItems.find((n) => pathname.startsWith(n.href))?.label || "Espace entreprise"}
                </p>
            </div>

            {/* Barre de recherche globale */}
            <div className="hidden sm:flex items-center flex-1 max-w-md mx-4">
                <GlobalSearch scope="company" darkMode={darkMode} placeholder="Rechercher employés, voyages, frais..." />
            </div>

            <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <NotificationBell darkMode={darkMode} notificationsHref="/companies/notifications" />
                <button
                onClick={() => router.push("/hub")}
                className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:bg-gray-50"
                style={{ color: "var(--color-primary)", borderColor: "var(--color-primary)" }}
                >
                Changer de module
                </button>
            </div>
            </header>

            {isExcluded ? (
                    <main className={cn("flex-1 min-h-0 overflow-y-auto", darkMode ? "bg-gray-900" : "bg-gray-50")}>
                        {children}
                    </main>
                ) : (
                    <main className={cn("flex-1 min-h-0 overflow-y-auto p-6", darkMode ? "bg-gray-900" : "bg-gray-50")}>
                        {children}
                    </main>
                )
            }
        </div>
        </div>
    );
}