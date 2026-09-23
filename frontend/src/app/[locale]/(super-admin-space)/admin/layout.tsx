"use client";

import { useState, useEffect, useLayoutEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Building2, ClipboardCheck, Settings, MessageSquare, ChevronLeft, ChevronRight, ChevronDown, LogOut, Menu, Sun, Moon, Bell, LayoutTemplate, Logs, ShieldCheck, Handshake, DollarSign, Headphones, BarChart3, Code2, Globe, Plane, ShoppingBag, PackageCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { useTheme } from "@/hooks/useTheme";
import { adminService } from "@/services/admin/admin.service";
import { partnersService } from "@/services/admin/partners.service";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"admin.layout">>;

type NavItem = {
    href: string;
    label: string;
    icon: LucideIcon;
    badge?: "orgs" | "offers";
};

type NavGroup = {
    id: string;
    label: string;
    icon: LucideIcon;
    items: NavItem[];
};

const getNavGroups = (t: Translator): NavGroup[] => ([
    {
        id: "overview",
        label: t("overview"),
        icon: LayoutDashboard,
        items: [
            { href: "/admin/dashboard", label: t("dashboard"), icon: LayoutDashboard },
            { href: "/admin/reporting", label: t("reporting"), icon: BarChart3 },
        ],
    },
    {
        id: "users",
        label: t("usersOrganizations"),
        icon: Building2,
        items: [
            { href: "/admin/companies", label: t("companies"), icon: Building2 },
            { href: "/admin/validations", label: t("validations"), icon: ClipboardCheck, badge: "orgs" },
            { href: "/admin/access", label: t("manageAccess"), icon: ShieldCheck },
        ],
    },
    {
        id: "partners",
        label: t("partnershipsMarketplace"),
        icon: Handshake,
        items: [
            { href: "/admin/partners", label: t("partners"), icon: Handshake },
            { href: "/admin/partners/offers", label: t("partnerOffers"), icon: PackageCheck, badge: "offers" },
            { href: "/admin/commissions", label: t("commissions"), icon: DollarSign },
        ],
    },
    {
        id: "catalog",
        label: t("catalogOrders"),
        icon: Plane,
        items: [
            { href: "/admin/travel-catalog", label: t("travelCatalog"), icon: Plane },
            { href: "/admin/orders", label: t("orders"), icon: ShoppingBag },
        ],
    },
    {
        id: "billing",
        label: t("billingSubscriptions"),
        icon: LayoutTemplate,
        items: [
            { href: "/admin/plans", label: t("managePlans"), icon: LayoutTemplate },
        ],
    },
    {
        id: "activity",
        label: t("activityAlerts"),
        icon: Logs,
        items: [
            { href: "/admin/logs", label: t("logHistory"), icon: Logs },
            { href: "/admin/notifications/logs", label: t("notifLogs"), icon: Logs },
            { href: "/admin/notifications/templates", label: t("notifTemplates"), icon: Bell },
        ],
    },
    {
        id: "support",
        label: t("supportCommunication"),
        icon: Headphones,
        items: [
            { href: "/admin/messages", label: t("messaging"), icon: MessageSquare },
            { href: "/admin/service-client", label: t("customerService"), icon: Headphones },
        ],
    },
    {
        id: "system",
        label: t("systemConfiguration"),
        icon: Settings,
        items: [
            { href: "/admin/settings", label: t("settings"), icon: Settings },
            { href: "/admin/countries", label: t("countriesCurrencies"), icon: Globe },
            { href: "/admin/developer", label: t("developerApi"), icon: Code2 },
        ],
    },
]);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const t = useTranslations("admin.layout");
    const NAV_GROUPS = useMemo(() => getNavGroups(t), [t]);
    // Liste à plat, dérivée des groupes — sert au calcul de la route active
    // et au titre de la page dans le header.
    const ALL_NAV_ITEMS = useMemo(() => NAV_GROUPS.flatMap((g) => g.items), [NAV_GROUPS]);
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

    // Nombre d'offres partenaires en attente de revue — même logique de badge.
    const [pendingOffersCount, setPendingOffersCount] = useState(0);
    useEffect(() => {
        const loadPendingOffers = () => {
            partnersService
                .getPendingOffers()
                .then((offers) => setPendingOffersCount(offers.length))
                .catch(() => {});
        };
        loadPendingOffers();
        const interval = setInterval(loadPendingOffers, 60000);
        return () => clearInterval(interval);
    }, []);
    const badgeCounts = { orgs: pendingCount, offers: pendingOffersCount };

    // Route la plus spécifique qui correspond au pathname courant (ex:
    // /admin/partners/offers ne doit pas aussi surligner /admin/partners).
    const bestMatch = ALL_NAV_ITEMS
        .map((n) => n.href)
        .filter((h) => pathname.startsWith(h))
        .sort((a, b) => b.length - a.length)[0];

    // Groupe accordéon actuellement déplié — un seul à la fois. Resynchronisé
    // sur le groupe contenant la route active à chaque navigation (clic
    // sidebar, recherche globale, URL directe...), mais laissé libre ensuite
    // pour que l'utilisateur puisse replier/déplier manuellement.
    const [openGroup, setOpenGroup] = useState<string | null>(
        () => NAV_GROUPS.find((g) => g.items.some((it) => pathname.startsWith(it.href)))?.id ?? null
    );
    const [syncedMatch, setSyncedMatch] = useState(bestMatch);
    if (bestMatch !== syncedMatch) {
        setSyncedMatch(bestMatch);
        const activeGroup = NAV_GROUPS.find((g) => g.items.some((it) => it.href === bestMatch));
        if (activeGroup) setOpenGroup(activeGroup.id);
    }

    const { user, loading } = useRouteGuard("super-admin");

    if (loading || !user) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
                {t("checkingAccess")}
            </div>
        );
    }

    return (
        <div
        className={cn(
            "flex h-screen overflow-hidden",
            darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"
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
            "fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-64 transition-transform duration-300 ease-in-out",
            "lg:translate-x-0 lg:transition-[width] lg:duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            sidebarOpen ? "lg:w-56" : "lg:w-16",
            darkMode
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-gray-200"
            )}
        >
            {/* Logo + toggle */}
            <div className="flex items-center h-16 px-3 gap-2"
            style={{ borderColor: darkMode ? "#374151" : "#e5e7eb" }}>
            {sidebarOpen ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                <Image src="/logo/logo_waxeho.png" alt={t("waxeho")} width={40} height={40} className="w-10 h-10 rounded-lg shrink-0 object-contain" />
                <span className="font-display font-bold text-sm truncate"
                    style={{ color: "var(--color-primary)" }}>
                    {t("afrikWorkspace")}
                </span>
                </div>
            ) : (
                <div className="flex-1 flex justify-center">
                <Image src="/logo/logo_waxeho.png" alt={t("waxeho")} width={40} height={40} className="w-10 h-10 rounded-lg object-contain" />
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

            {/* Navigation — groupes accordéon */}
            <nav className="flex-1 py-4 space-y-2 px-2 overflow-y-auto">
            {NAV_GROUPS.map((group) => {
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
                    title={group.label}
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
                        {group.items.map(({ href, label, icon: Icon, badge }) => {
                        const active = href === bestMatch;
                        return (
                            <button
                            key={href}
                            onClick={() => {
                                router.push(href);
                                if (window.innerWidth < 1024) setSidebarOpen(false);
                            }}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all relative",
                                active
                                ? "text-white"
                                : darkMode
                                ? "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )}
                            style={active ? { background: "var(--color-primary)" } : {}}
                            title={label}
                            >
                            <Icon size={16} className="shrink-0" />
                            <span className="truncate">{label}</span>
                            {badge && badgeCounts[badge] > 0 && (
                                <span
                                className="ml-auto text-white text-xs rounded-full px-1.5 py-0.5 font-bold"
                                style={{ background: "#ef4444" }}
                                >
                                {badgeCounts[badge]}
                                </span>
                            )}
                            </button>
                        );
                        })}
                    </div>
                    )}
                </div>
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
                    {t("superAdministrator")}
                    </p>
                </div>
                <button onClick={logout} title={t("logOut")}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    style={{ color: "#9ca3af" }}>
                    <LogOut size={15} />
                </button>
                </div>
            ) : (
                <button onClick={logout} title={t("logOut")}
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
            "h-16 flex items-center justify-between px-6 shrink-0",
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
                {[...ALL_NAV_ITEMS].sort((a, b) => b.href.length - a.href.length).find((n) => pathname.startsWith(n.href))?.label || t("admin")}
                </p>
            </div>

            {/* Barre de recherche globale */}
            <div className="hidden sm:flex items-center flex-1 max-w-md mx-4">
                <GlobalSearch scope="admin" darkMode={darkMode} placeholder={t("searchCompaniesUsers")} />
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

                {/* Langue */}
                <LanguageSwitcher compact />

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
            darkMode ? "bg-gray-900" : "bg-[#ff660005]"
            )}>
            {children}
            </main>
        </div>
        </div>
    );
}