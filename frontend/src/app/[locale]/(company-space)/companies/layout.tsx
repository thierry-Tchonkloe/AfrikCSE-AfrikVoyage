"use client";

import { useState, useLayoutEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard, Users, Settings, ChevronLeft, ChevronRight, ChevronDown,
    Bell, LogOut, Menu, Moon, Sun, Wallet, Percent, ClipboardCheck, ShoppingBag,
    DollarSign, BarChart3, HelpCircle, MessageSquare, Calendar, Receipt, ShieldCheck,
    Plug, Plane, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { useTheme } from "@/hooks/useTheme";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"company.layout">>;

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { id: string; label: string; icon: LucideIcon; items: NavItem[] };

// Lien racine toujours visible, en dehors des accordéons de module.
const getHomeItem = (t: Translator): NavItem => ({ href: "/companies/dashboard", label: t("dashboard"), icon: LayoutDashboard });

// Navigation groupée par module : un groupe accordéon par module actif de
// l'organisation (AfrikCSE, AfrikVoyage), plus un groupe "Organisation" pour
// les réglages transverses. Ne dépend que des modules souscrits, pas du
// pathname — le groupe correspondant à la page courante s'ouvre seul.
function buildNavGroups(t: Translator, hasCSE: boolean, hasVoyage: boolean): NavGroup[] {
    const groups: NavGroup[] = [];

    if (hasCSE) {
        groups.push({
            id: "cse",
            label: "AfrikCSE",
            icon: Users,
            items: [
                { href: "/companies/AfrikCSE/dashboard", label: t("dashboard"), icon: LayoutDashboard },
                { href: "/companies/AfrikCSE/avantages", label: t("approvals"), icon: ClipboardCheck },
                { href: "/companies/AfrikCSE/employes", label: t("employees"), icon: Users },
                { href: "/companies/AfrikCSE/catalogue", label: t("catalog"), icon: ShoppingBag },
                { href: "/companies/AfrikCSE/budget", label: t("subsidies"), icon: DollarSign },
                { href: "/companies/AfrikCSE/subventions", label: t("subsidyRules"), icon: Percent },
                { href: "/companies/AfrikCSE/rapport", label: t("report"), icon: BarChart3 },
                { href: "/companies/AfrikCSE/faq", label: t("faq"), icon: HelpCircle },
                { href: "/companies/AfrikCSE/wallet", label: t("wallets"), icon: Wallet },
                { href: "/companies/AfrikCSE/cashback", label: t("cashback"), icon: Percent },
                { href: "/companies/AfrikCSE/commissions", label: t("commissions"), icon: DollarSign },
                { href: "/companies/AfrikCSE/messages", label: t("messaging"), icon: MessageSquare },
                { href: "/companies/AfrikCSE/settings", label: t("settings"), icon: Settings },
            ],
        });
    }

    if (hasVoyage) {
        groups.push({
            id: "voyage",
            label: "AfrikVoyage",
            icon: Plane,
            items: [
                { href: "/companies/AfrikVoyage/dashboard", label: t("dashboard"), icon: LayoutDashboard },
                { href: "/companies/AfrikVoyage/approbations", label: t("approvals"), icon: ClipboardCheck },
                { href: "/companies/AfrikVoyage/reservations", label: t("bookings"), icon: Calendar },
                { href: "/companies/AfrikVoyage/frais", label: t("expenseReports"), icon: Receipt },
                { href: "/companies/AfrikVoyage/politiques", label: t("policies"), icon: ShieldCheck },
                { href: "/companies/AfrikVoyage/reporting", label: t("dutyOfCare"), icon: BarChart3 },
                { href: "/companies/AfrikVoyage/settings", label: t("settings"), icon: Settings },
            ],
        });
    }

    groups.push({
        id: "org",
        label: t("organization"),
        icon: Settings,
        items: [
            { href: "/companies/users", label: t("users"), icon: Users },
            { href: "/companies/settings", label: t("settings"), icon: Settings },
            { href: "/companies/billing", label: t("billing"), icon: Wallet },
            { href: "/companies/notifications", label: t("notifications"), icon: Bell },
            { href: "/companies/integrations", label: t("integrations"), icon: Plug },
        ],
    });

    return groups;
}

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
    const t = useTranslations("company.layout");
    const HOME_ITEM = useMemo(() => getHomeItem(t), [t]);
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

    const navGroups = buildNavGroups(
        t,
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
            {sidebarOpen ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                <Image src="/logo/logo_waxeho.png" alt={t("waxeho")} width={40} height={40} className="w-10 h-10 rounded-lg shrink-0 object-contain" />
                <div className="min-w-0">
                    <p className="text-base font-display font-bold truncate" style={{ color: "var(--color-primary)" }}>{t("afrikWorkspace")}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t("companySpace")}</p>
                </div>
                </div>
            ) : (
                <div className="flex-1 flex justify-center">
                <Image src="/logo/logo_waxeho.png" alt={t("waxeho")} width={40} height={40} className="w-10 h-10 rounded-lg object-contain" />
                </div>
            )}
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
            </div>

            {/* Nav — accueil fixe + groupes accordéon par module */}
            <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
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
                    homeActive ? "text-white" : darkMode
                        ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"
                    )}
                    style={homeActive ? { background: "var(--color-primary)" } : {}}
                    title={!sidebarOpen ? HOME_ITEM.label : undefined}>
                    <HomeIcon size={18} className="shrink-0" />
                    {sidebarOpen && <span className="truncate">{HOME_ITEM.label}</span>}
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
                        ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"
                    )}
                    title={!sidebarOpen ? group.label : undefined}
                    >
                    <GroupIcon size={18} className="shrink-0" />
                    {sidebarOpen && <span className="flex-1 text-left truncate">{group.label}</span>}
                    {sidebarOpen && (
                        <ChevronDown
                        size={16}
                        className={cn("shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
                        />
                    )}
                    </button>

                    {isOpen && (
                    <div
                        className="mt-1 ml-4 pl-3 border-l space-y-1"
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
                                ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"
                            )}
                            style={active ? { background: "var(--color-primary)" } : {}}
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

            {/* User bas sidebar */}
            <div className={cn("p-3 border-t",
            darkMode ? "border-gray-700" : "border-gray-200")}>
            {sidebarOpen ? (
                <div className="flex items-center gap-2">
                <button
                    onClick={() => router.push("/companies/settings")}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left rounded-lg hover:bg-gray-100 p-1 -m-1 transition-colors"
                >
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
                </button>
                <button onClick={logout} title={t("logOut")}
                    className="p-1 rounded hover:bg-gray-100 shrink-0"
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
                {[...allNavItems].sort((a, b) => b.href.length - a.href.length).find((n) => pathname.startsWith(n.href))?.label || t("companySpace")}
                </p>
            </div>

            {/* Barre de recherche globale */}
            <div className="hidden sm:flex items-center flex-1 max-w-md mx-4">
                <GlobalSearch scope="company" darkMode={darkMode} placeholder={t("searchEmployeesTripsExpenses")} />
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
                {t("switchModule")}
                </button>

                {/* Identité de l'organisation connectée */}
                <div className={cn(
                    "flex items-center gap-2 pl-2 border-l min-w-0",
                    darkMode ? "border-gray-700" : "border-gray-200"
                )}>
                <span className="hidden sm:block text-sm font-medium truncate max-w-40" style={{ color: darkMode ? "#e5e7eb" : "#374151" }}>
                    {user.organization?.name ?? t("organization")}
                </span>
                {user.organization?.logoUrl ? (
                    <Image src={user.organization.logoUrl} alt={user.organization?.name ?? t("logo")} width={28} height={28} className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "var(--color-primary)" }}>
                        {user.organization?.name?.[0] ?? "A"}
                    </div>
                )}
                </div>
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