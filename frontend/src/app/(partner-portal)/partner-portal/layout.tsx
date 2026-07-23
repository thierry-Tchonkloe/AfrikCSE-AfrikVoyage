"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useLayoutEffect } from "react";
import {
    LayoutDashboard, CalendarCheck, Layers, Users,
    MapPin, Building2, ChevronLeft, ChevronRight, LogOut, Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";

const NAV_ITEMS = [
    { href: "/partner-portal/dashboard",  label: "Tableau de bord",  icon: LayoutDashboard },
    { href: "/partner-portal/bookings",   label: "Réservations",     icon: CalendarCheck },
    { href: "/partner-portal/offers",     label: "Offres",           icon: Layers },
    { href: "/partner-portal/locations",  label: "Établissements",   icon: MapPin },
    { href: "/partner-portal/staff",      label: "Équipe",           icon: Users },
    { href: "/partner-portal/profile",    label: "Profil",           icon: Building2 },
];

export default function PartnerPortalLayout({ children }: { children: React.ReactNode }) {
    const pathname        = usePathname();
    const router          = useRouter();
    const [open, setOpen] = useState(true);
    const { user, loading, logout } = usePartnerAuth();

    useLayoutEffect(() => {
        const apply = () => setOpen(window.innerWidth >= 1024);
        apply();
        window.addEventListener("resize", apply);
        return () => window.removeEventListener("resize", apply);
    }, []);

    // Redirige si pas de session partenaire valide — dans un effect, jamais pendant
    // le rendu (un router.replace() synchrone en plein render déclenche l'avertissement
    // React "Cannot update a component while rendering a different component").
    useEffect(() => {
        if (!loading && !user) {
        router.replace("/partner-portal/login");
        }
    }, [loading, user, router]);

    if (loading || !user) return (
        <div className="flex h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
            Vérification…
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
            {open && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

            <aside
                className={cn(
                    "fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:transition-[width]",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
                style={{ width: open ? "220px" : "64px", background: "#1e293b" }}
            >
                {/* Logo */}
                <div className="flex items-center h-16 px-3 gap-2 border-b border-white/10">
                    {open ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">P</div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">Portail</p>
                                <p className="text-xs text-white/60 truncate">{user.partnerName}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex justify-center">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">P</div>
                        </div>
                    )}
                    <button onClick={() => setOpen((v) => !v)} className="p-1 rounded hover:bg-white/10 text-white/60 shrink-0">
                        {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                        const active = pathname.startsWith(href);
                        return (
                            <button
                                key={href}
                                onClick={() => { router.push(href); if (window.innerWidth < 1024) setOpen(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                                style={active ? { background: "#2563eb", color: "white", fontWeight: 600 } : { color: "rgba(255,255,255,0.6)" }}
                                title={!open ? label : undefined}
                            >
                                <Icon size={17} className="shrink-0" />
                                {open && <span className="truncate text-xs">{label}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* User */}
                <div className="p-3 border-t border-white/10">
                    {open ? (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {user.firstName[0]}{user.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-white/50 truncate">{user.role}</p>
                            </div>
                            <button onClick={logout} className="p-1 rounded hover:bg-white/10 text-white/50">
                                <LogOut size={14} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={logout} className="w-full flex justify-center p-1.5 rounded hover:bg-white/10 text-white/40">
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 flex items-center justify-between px-6 border-b bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shrink-0">
                    <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setOpen(true)}>
                        <Menu size={20} />
                    </button>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.label ?? "Portail partenaire"}
                    </p>
                    <div />
                </header>
                <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
                    {children}
                </main>
            </div>
        </div>
    );
}
