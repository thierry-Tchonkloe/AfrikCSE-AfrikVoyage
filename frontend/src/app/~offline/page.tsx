import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
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
                    style={{ background: "#fef3c7", color: "#d97706" }}
                >
                    <WifiOff size={32} />
                </div>

                <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                    Vous êtes hors ligne
                </h1>
                <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
                    Cette page n&apos;est pas disponible sans connexion internet. Vérifiez votre connexion et réessayez.
                </p>

                <h2 className="text-base font-semibold mb-1" style={{ color: "var(--color-text)" }}>
                    You are offline
                </h2>
                <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                    This page isn&apos;t available without an internet connection. Check your connection and try again.
                </p>

                <Link
                    href="/"
                    className="block py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--color-primary)" }}
                >
                    Réessayer / Retry
                </Link>
            </div>
        </div>
    );
}
