"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Settings, ChevronRight, Users, Plane } from "lucide-react";

export default function HubPage() {
    const router = useRouter();
    const { user, loading, logout } = useAuth();

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    if (loading || !user) return null;

    const modules = [
        {
        id: "cse",
        title: "AfrikCSE",
        desc: "Gérez les avantages salariés, subventions, billetterie et communication CSE de votre entreprise.",
        features: ["Avantages & dotations", "Billetterie & offres partenaires", "Budgets & conformité"],
        icon: <Users size={28} />,
        active: user.organization?.hasCSE,
        href: "/companies/AfrikCSE",
        color: "var(--color-primary)",
        lightColor: "var(--color-primary-light)",
        },
        {
        id: "voyage",
        title: "AfrikVoyage",
        desc: "Gérez les voyages d'affaires, notes de frais et politiques de déplacement de votre organisation.",
        features: ["Réservations & notes de frais", "Politiques voyages", "Reporting & conformité"],
        icon: <Plane size={28} />,
        active: user.organization?.hasVoyage,
        href: "/companies/AfrikVoyage",
        color: "#f59e0b",
        lightColor: "#fffbeb",
        },
    ];

    return (
        <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        {/* ── Header ── */}
        <header
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
            <div className="flex items-center gap-2">
            <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ background: "var(--color-primary)" }}
            >
                A
            </div>
            <span className="font-bold" style={{ color: "var(--color-text)" }}>
                Afrik Platform
            </span>
            </div>

            <div className="flex items-center gap-3">
            <div className="text-right">
                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                {user.firstName} {user.lastName}
                </p>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                {user.role.replace("_", " ")}
                </p>
            </div>
            <button
                onClick={() => router.push("/settings")}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: "var(--color-muted)" }}
            >
                <Settings size={18} />
            </button>
            </div>
        </header>

        {/* ── Contenu ── */}
        <main className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center mb-10">
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                Bienvenue sur Afrik Platform
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--color-muted)" }}>
                Choisissez le module que vous souhaitez utiliser
            </p>
            </div>

            {/* ── Cartes modules ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {modules.map((mod) => (
                <div
                key={mod.id}
                className="rounded-2xl border p-6 flex flex-col"
                style={{
                    background: "var(--color-card)",
                    borderColor: "var(--color-border)",
                    opacity: mod.active ? 1 : 0.85,
                }}
                >
                {/* Icône */}
                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{
                    background: mod.lightColor,
                    color: mod.active ? mod.color : "var(--color-muted)",
                    }}
                >
                    {mod.icon}
                </div>

                <h2 className="text-lg font-bold mb-1" style={{ color: "var(--color-text)" }}>
                    {mod.title}
                </h2>
                <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
                    {mod.desc}
                </p>

                <ul className="space-y-1.5 mb-6 flex-1">
                    {mod.features.map((f) => (
                    <li
                        key={f}
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "var(--color-muted)" }}
                    >
                        <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: mod.active ? mod.color : "var(--color-border)" }}
                        />
                        {f}
                    </li>
                    ))}
                </ul>

                {mod.active ? (
                    <button
                    onClick={() => router.push(mod.href)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                    style={{ background: mod.color }}
                    >
                    Accéder à {mod.title} <ChevronRight size={16} />
                    </button>
                ) : (
                    <div>
                    <button
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                        style={{ background: mod.color }}
                        disabled
                    >
                        Demander l&#39activation 🔒
                    </button>
                    <p className="text-xs text-center mt-2" style={{ color: "var(--color-muted)" }}>
                        Ce module n&#39est pas encore activé pour votre entreprise.
                    </p>
                    </div>
                )}
                </div>
            ))}
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
                { value: "2,450", label: "Collaborateurs actifs", color: "var(--color-primary)" },
                { value: "98%", label: "Taux de satisfaction", color: "var(--color-text)" },
                { value: "€2.5M", label: "Économies réalisées", color: "var(--color-secondary)" },
            ].map((stat) => (
                <div
                key={stat.label}
                className="rounded-xl border p-4 text-center"
                style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                <p className="text-2xl font-bold" style={{ color: stat.color }}>
                    {stat.value}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                    {stat.label}
                </p>
                </div>
            ))}
            </div>
        </main>

        {/* ── Footer ── */}
        <footer
            className="border-t px-6 py-4 flex justify-between items-center"
            style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
        >
            <div className="flex gap-6 text-xs">
            <a href="/settings" className="hover:underline">Paramètres du compte</a>
            <a href="/support" className="hover:underline">Support</a>
            <a href="/docs" className="hover:underline">Documentation</a>
            </div>
            <div className="flex items-center gap-4">
            <span className="text-xs">© 2024 Afrik Platform</span>
            <button
                onClick={logout}
                className="flex items-center gap-1.5 text-xs hover:underline"
            >
                <LogOut size={14} /> Déconnexion
            </button>
            </div>
        </footer>
        </div>
    );
}