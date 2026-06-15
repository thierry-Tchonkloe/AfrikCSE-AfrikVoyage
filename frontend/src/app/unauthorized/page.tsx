"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDefaultRoute } from "@/lib/roles";

export default function UnauthorizedPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const targetHref = user
        ? getDefaultRoute(user.role, user.organization?.isHost ?? false)
        : "/login";

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: "var(--color-bg)" }}
        >
            <div
                className="max-w-md w-full text-center rounded-2xl border p-8"
                style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
                <div
                    className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "#fee2e2", color: "#dc2626" }}
                >
                    <ShieldAlert size={32} />
                </div>

                <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                    Accès non autorisé
                </h1>
                <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                    Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
                    Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez votre administrateur.
                </p>

                <button
                    onClick={() => router.push(targetHref)}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ background: "var(--color-primary)" }}
                >
                    {loading ? "Chargement..." : "Retour à mon espace"}
                </button>
            </div>
        </div>
    );
}
