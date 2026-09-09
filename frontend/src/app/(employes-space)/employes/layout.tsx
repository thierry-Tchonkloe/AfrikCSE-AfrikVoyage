"use client";

import { useState, useLayoutEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard, Plane, FileText, Calendar,
    Gift, MessageSquare, CalendarDays, User, Settings,
    ChevronLeft, ChevronRight, ChevronDown, LogOut, Menu,
    Mail, Sun, Moon, LifeBuoy, Bell, FileClock, Users, Ticket, Trophy,
    HelpCircle, Images, Wallet, CalendarCheck, PiggyBank, CreditCard,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { useTheme } from "@/hooks/useTheme";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { UserAvatar } from "@/components/employes/UserAvatar";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { id: string; label: string; icon: LucideIcon; items: NavItem[] };

// Lien racine toujours visible, en dehors des accordéons de module.
const HOME_ITEM: NavItem = { href: "/employes/dashboard", label: "Dashboard", icon: LayoutDashboard };

// Navigation groupée par module — mêmes groupes que l'espace entreprise
// (AfrikCSE / AfrikVoyage), plus un groupe transverse Général & Support.
// Un module n'apparaît que si l'organisation y a souscrit.
function buildNavGroups(hasCSE: boolean, hasVoyage: boolean): NavGroup[] {
    const groups: NavGroup[] = [];

    if (hasVoyage) {
        groups.push({
            id: "voyage",
            label: "AfrikVoyage",
            icon: Plane,
            items: [
                { href: "/employes/voyages", label: "Mes voyages", icon: Plane },
                { href: "/employes/reserver", label: "Réservez votre voyage", icon: Calendar },
                { href: "/employes/voyages/groupe", label: "Voyages de groupe", icon: Users },
                { href: "/employes/reservations", label: "Mes réservations", icon: CalendarCheck },
                { href: "/employes/notes-de-frais", label: "Notes de frais", icon: FileText },
            ],
        });
    }

    if (hasCSE) {
        groups.push({
            id: "cse",
            label: "AfrikCSE",
            icon: Users,
            items: [
                { href: "/employes/avantages", label: "Mes avantages", icon: Gift },
                { href: "/employes/famille", label: "Ma famille", icon: Users },
                { href: "/employes/tickets", label: "Mes tickets", icon: Ticket },
                { href: "/employes/recompenses", label: "Récompenses", icon: Trophy },
                { href: "/employes/communication", label: "Communication CSE", icon: MessageSquare },
                { href: "/employes/evenements", label: "Calendrier des Évènements", icon: CalendarDays },
                { href: "/employes/evenements/galerie", label: "Galerie photos", icon: Images },
                { href: "/employes/wallet", label: "Mon wallet", icon: Wallet },
                { href: "/employes/economies", label: "Mes économies", icon: PiggyBank },
                { href: "/employes/carte-membre", label: "Carte membre", icon: CreditCard },
            ],
        });
    }

    groups.push({
        id: "support",
        label: "Général & Support",
        icon: LifeBuoy,
        items: [
            { href: "/employes/mes-demandes", label: "Mes demandes", icon: FileClock },
            { href: "/employes/notifications", label: "Notifications", icon: Bell },
            { href: "/employes/faq", label: "FAQ", icon: HelpCircle },
            { href: "/employes/support", label: "Support", icon: LifeBuoy },
        ],
    });

    return groups;
}

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

    const navGroups = buildNavGroups(
        user?.organization?.hasCSE ?? false,
        user?.organization?.hasVoyage ?? false
    );
    const allNavItems = [HOME_ITEM, ...navGroups.flatMap((g) => g.items)];

    // Route la plus spécifique qui correspond au pathname courant.
    const bestMatch = allNavItems
        .map((n) => n.href)
        .filter((h) => pathname.startsWith(h))
        .sort((a, b) => b.length - a.length)[0];

    // Groupe accordéon actuellement déplié — un seul à la fois, resynchronisé
    // sur le module de la route active à chaque navigation, mais laissé
    // libre ensuite pour que l'utilisateur puisse replier/déplier manuellement.
    const [openGroup, setOpenGroup] = useState<string | null>(
        () => navGroups.find((g) => g.items.some((it) => pathname.startsWith(it.href)))?.id ?? null
    );
    const [syncedMatch, setSyncedMatch] = useState(bestMatch);
    if (bestMatch !== syncedMatch) {
        setSyncedMatch(bestMatch);
        const activeGroup = navGroups.find((g) => g.items.some((it) => it.href === bestMatch));
        if (activeGroup) setOpenGroup(activeGroup.id);
    }

    if (loading || !user) return null;

    // Même design que l'espace Super Admin (cf. admin/layout.tsx) : sidebar
    // claire/sombre selon le mode, la couleur primaire ne sert que d'accent
    // (logo, état actif, avatar) — pas de bloc de fond coloré à part.
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
            "fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:transition-[width] border-r",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
            )}
            style={{ width: sidebarOpen ? "220px" : "64px" }}
        >
            {/* Logo */}
            <div className="flex items-center h-16 px-3 gap-2 border-b border-gray-200 dark:border-gray-700">
            {sidebarOpen ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                <Image src="/logo/logo_waxeho.png" alt="Waxeho" width={40} height={40} className="w-10 h-10 rounded-lg shrink-0 object-contain" />
                <div className="min-w-0">
                    <p className="text-base font-display font-bold truncate" style={{ color: ACCENT }}>Afrik-workspace</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Espace employé</p>
                </div>
                </div>
            ) : (
                <div className="flex-1 flex justify-center">
                <Image src="/logo/logo_waxeho.png" alt="Waxeho" width={40} height={40} className="w-10 h-10 rounded-lg object-contain" />
                </div>
            )}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0"
            >
                {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
            </div>

            {/* Nav principale — accueil fixe + groupes accordéon par module */}
            <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
            {(() => {
                const homeActive = HOME_ITEM.href === bestMatch;
                const HomeIcon = HOME_ITEM.icon;
                return (
                <button onClick={() => {
                    router.push(HOME_ITEM.href);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                    className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    homeActive
                        ? "text-white"
                        : darkMode
                        ? "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                    style={homeActive ? { background: ACCENT } : {}}
                    title={!sidebarOpen ? HOME_ITEM.label : undefined}>
                    <HomeIcon size={17} className="shrink-0" />
                    {sidebarOpen && <span className="truncate text-sm">{HOME_ITEM.label}</span>}
                </button>
                );
            })()}

            {navGroups.map((group) => {
                const GroupIcon = group.icon;
                const groupActive = group.items.some((it) => it.href === bestMatch);
                const isOpen = sidebarOpen && openGroup === group.id;
                return (
                <div key={group.id}>
                    <button
                    onClick={() => {
                        if (!sidebarOpen) {
                            setSidebarOpen(true);
                            setOpenGroup(group.id);
                            return;
                        }
                        setOpenGroup(openGroup === group.id ? null : group.id);
                    }}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        groupActive
                        ? darkMode
                            ? "bg-gray-800 text-white"
                            : "bg-gray-100 text-gray-900"
                        : darkMode
                        ? "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                    title={!sidebarOpen ? group.label : undefined}
                    >
                    <GroupIcon size={17} className="shrink-0" />
                    {sidebarOpen && <span className="flex-1 text-left truncate text-sm">{group.label}</span>}
                    {sidebarOpen && (
                        <ChevronDown
                        size={16}
                        className={cn("shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
                        />
                    )}
                    </button>

                    {isOpen && (
                    <div
                        className="mt-0.5 ml-4 pl-3 border-l space-y-0.5"
                        style={{ borderColor: darkMode ? "#374151" : "#e5e7eb" }}
                    >
                        {group.items.map(({ href, label, icon: Icon }) => {
                        const active = href === bestMatch;
                        return (
                            <button
                            key={href}
                            onClick={() => {
                                router.push(href);
                                if (window.innerWidth < 1024) setSidebarOpen(false);
                            }}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                                active
                                ? "text-white"
                                : darkMode
                                ? "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )}
                            style={active ? { background: ACCENT } : {}}
                            >
                            <Icon size={16} className="shrink-0" />
                            <span className="truncate">{label}</span>
                            </button>
                        );
                        })}
                    </div>
                    )}
                </div>
                );
            })}
            </nav>

            {/* Séparateur */}
            <div className="border-t border-gray-200 dark:border-gray-700 mx-3" />

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
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        active
                        ? "text-white"
                        : darkMode
                        ? "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                    style={active ? { background: ACCENT } : {}}
                    title={!sidebarOpen ? label : undefined}
                >
                    <Icon size={17} className="shrink-0" />
                    {sidebarOpen && <span className="truncate text-sm">{label}</span>}
                </button>
                );
            })}
            </nav>

            {/* User bas de sidebar */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            {sidebarOpen ? (
                <div className="flex items-center gap-2">
                <button
                    onClick={() => router.push("/employes/profile")}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 p-1 -m-1 transition-colors"
                >
                    <UserAvatar
                        avatar={user.avatar}
                        firstName={user.firstName}
                        lastName={user.lastName}
                        background={ACCENT}
                        className="w-8 h-8 text-xs shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">
                        {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.role.replace("_", " ")}
                        </p>
                    </div>
                </button>
                <button onClick={logout} title="Déconnexion"
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 shrink-0">
                    <LogOut size={14} />
                </button>
                </div>
            ) : (
                <button onClick={logout} title="Déconnexion"
                className="w-full flex justify-center p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
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
                {/* Identité de l'organisation connectée */}
                <div className={cn(
                    "flex items-center gap-2 pl-2 border-l min-w-0",
                    darkMode ? "border-gray-700" : "border-gray-200"
                )}>
                <span className="hidden sm:block text-sm font-medium truncate max-w-40" style={{ color: darkMode ? "#e5e7eb" : "#374151" }}>
                    {user.organization?.name ?? "Organisation"}
                </span>
                {user.organization?.logoUrl ? (
                    <Image src={user.organization.logoUrl} alt={user.organization?.name ?? "Logo"} width={28} height={28} className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: ACCENT }}>
                        {user.organization?.name?.[0] ?? "A"}
                    </div>
                )}
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