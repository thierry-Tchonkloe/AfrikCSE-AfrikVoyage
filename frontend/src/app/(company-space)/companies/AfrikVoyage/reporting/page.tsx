"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Plane, AlertTriangle, CheckCircle, MapPin, Calendar, Receipt, LayoutDashboard, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { voyageService } from "@/services/companies/voyage.service";

interface TravelRequestItem {
    id: string;
    destination: string;
    departureDate: string;
    returnDate: string;
    status: string;
    requestedBy: {
        firstName: string;
        lastName: string;
        email: string;
        department?: string | null;
        jobTitle?: string | null;
    };
}

interface TravelStats {
    total: number;
    pending: number;
    approved: number;
    totalCost: number;
    co2Emissions: number;
}

function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function initials(firstName: string, lastName: string) {
    return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function Skeleton() {
    return (
        <div className="space-y-5">
        <div className="space-y-2">
            <div className="h-5 w-72 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-96 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
        </div>
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
    );
}

export default function ReportingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [travels, setTravels] = useState<TravelRequestItem[]>([]);
    const [stats, setStats] = useState<TravelStats | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const [approvedRes, inProgressRes, statsRes] = await Promise.allSettled([
                    voyageService.getTravels({ status: "APPROVED", limit: 100 }),
                    voyageService.getTravels({ status: "IN_PROGRESS", limit: 100 }),
                    voyageService.getTravelStats(),
                ]);
                const all: TravelRequestItem[] = [];
                if (approvedRes.status === "fulfilled") all.push(...(approvedRes.value?.data ?? []));
                if (inProgressRes.status === "fulfilled") all.push(...(inProgressRes.value?.data ?? []));
                setTravels(all);
                if (statsRes.status === "fulfilled") setStats(statsRes.value);
            } catch {
                toast.error("Erreur lors du chargement des données de voyage");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <Skeleton />;

    const now = Date.now();
    const in7Days = now + 7 * 24 * 60 * 60 * 1000;
    const in48h = now + 48 * 60 * 60 * 1000;

    const travelingNow = travels.filter((t) => {
        const dep = new Date(t.departureDate).getTime();
        const ret = new Date(t.returnDate).getTime();
        return dep <= now && now <= ret;
    });

    const upcomingDepartures = travels.filter((t) => {
        const dep = new Date(t.departureDate).getTime();
        return dep > now && dep <= in7Days;
    });

    const upcomingReturns = travels.filter((t) => {
        const ret = new Date(t.returnDate).getTime();
        return ret >= now && ret <= in7Days;
    });

    const departuresIn48h = upcomingDepartures.filter((t) => new Date(t.departureDate).getTime() <= in48h);
    const returnsIn48h = travelingNow.filter((t) => new Date(t.returnDate).getTime() <= in48h);

    const filteredTravelers = travelingNow.filter((t) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const name = `${t.requestedBy.firstName} ${t.requestedBy.lastName}`.toLowerCase();
        return name.includes(q) || t.destination.toLowerCase().includes(q);
    });

    const STATS = [
        { label: "Employés en déplacement", value: travelingNow.length, sub: "Actuellement en voyage", icon: Plane, color: "#3b82f6", bg: "#eff6ff" },
        { label: "Départs sous 7 jours", value: upcomingDepartures.length, sub: "Voyages approuvés à venir", icon: Calendar, color: "#8b5cf6", bg: "#f5f3ff" },
        { label: "Retours sous 7 jours", value: upcomingReturns.length, sub: "Fin de mission prévue", icon: CheckCircle, color: "#10b981", bg: "#f0fdf4" },
        { label: "Demandes en attente", value: stats?.pending ?? 0, sub: (stats?.pending ?? 0) > 0 ? "Nécessite une validation" : "Aucune en attente", icon: AlertTriangle, color: "#f59e0b", bg: "#fffbeb" },
    ];

    const alerts: { title: string; desc: string; color: string; bg: string; icon: typeof Plane; href?: string }[] = [];
    if ((stats?.pending ?? 0) > 0) {
        alerts.push({
            title: `${stats!.pending} demande(s) de voyage en attente`,
            desc: "Ces demandes nécessitent une validation avant le départ.",
            color: "#f59e0b", bg: "#fffbeb", icon: AlertTriangle,
            href: "/companies/AfrikVoyage/approbations",
        });
    }
    if (departuresIn48h.length > 0) {
        alerts.push({
            title: `${departuresIn48h.length} départ(s) prévu(s) dans les 48h`,
            desc: "Vérifiez que ces collaborateurs ont reçu leurs documents de voyage.",
            color: "#3b82f6", bg: "#eff6ff", icon: Plane,
            href: "/companies/AfrikVoyage/reservations",
        });
    }
    if (returnsIn48h.length > 0) {
        alerts.push({
            title: `${returnsIn48h.length} retour(s) de mission dans les 48h`,
            desc: "Pensez à planifier le point de suivi post-mission.",
            color: "#10b981", bg: "#f0fdf4", icon: CheckCircle,
            href: "/companies/AfrikVoyage/reservations",
        });
    }
    if (alerts.length === 0) {
        alerts.push({
            title: "Aucune alerte active",
            desc: "Tous les voyages en cours sont sous contrôle.",
            color: "#10b981", bg: "#f0fdf4", icon: CheckCircle,
        });
    }

    const QUICK_ACTIONS = [
        { label: "Approbations", href: "/companies/AfrikVoyage/approbations", icon: CheckCircle },
        { label: "Réservations", href: "/companies/AfrikVoyage/reservations", icon: Plane },
        { label: "Notes de frais", href: "/companies/AfrikVoyage/frais", icon: Receipt },
        { label: "Tableau de bord", href: "/companies/AfrikVoyage/dashboard", icon: LayoutDashboard },
    ];

    return (
        <div className="space-y-5">
        {/* En-tête */}
        <div>
            <h1 className="text-xl font-bold text-gray-900">Surveillance du devoir de diligence</h1>
            <p className="text-sm text-gray-500">
            Suivi en temps réel des employés actuellement en déplacement professionnel
            </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map((s) => (
            <div key={s.label}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: s.bg }}>
                <s.icon size={20} style={{ color: s.color }} />
                </div>
                <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xs mt-0.5" style={{ color: s.color }}>{s.sub}</p>
                </div>
            </div>
            ))}
        </div>

        {/* Alertes + Actions rapides */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Alertes & rappels</h3>
            <div className="space-y-3">
                {alerts.map((alert, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ background: alert.bg }}>
                    <div className="flex items-start gap-2">
                    <alert.icon size={14} style={{ color: alert.color }} className="shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-xs font-semibold" style={{ color: alert.color }}>{alert.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{alert.desc}</p>
                        {alert.href && (
                        <div className="flex justify-end mt-2">
                            <button
                            onClick={() => router.push(alert.href!)}
                            className="text-xs px-2 py-1 rounded font-medium text-white"
                            style={{ background: alert.color }}
                            >
                            Voir
                            </button>
                        </div>
                        )}
                    </div>
                    </div>
                </div>
                ))}
            </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Actions rapides</h3>
            <div className="space-y-2">
                {QUICK_ACTIONS.map((action) => (
                <button
                    key={action.label}
                    onClick={() => router.push(action.href)}
                    className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium"
                >
                    <span className="flex items-center gap-2">
                    <action.icon size={15} style={{ color: "#0f766e" }} />
                    {action.label}
                    </span>
                    <ArrowRight size={14} className="text-gray-400" />
                </button>
                ))}
            </div>
            </div>
        </div>

        {/* Employés en déplacement */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-semibold text-gray-900">Employés actuellement en déplacement</h3>
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un employé ou une destination..."
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none"
            />
            </div>
            {filteredTravelers.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">
                Aucun employé en déplacement actuellement
            </p>
            ) : (
            <div className="overflow-x-auto">
                <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-100">
                    {["Employé", "Destination", "Période", "Statut", "Action"].map((h) => (
                        <th key={h} className="text-left text-xs text-gray-500 font-medium pb-2">{h}</th>
                    ))}
                    </tr>
                </thead>
                <tbody>
                    {filteredTravelers.map((t) => {
                    const days = daysUntil(t.returnDate);
                    let statusLabel = `Retour le ${formatDate(t.returnDate)}`;
                    let statusColor = "#10b981";
                    if (days < 0) { statusLabel = "Retour en retard"; statusColor = "#ef4444"; }
                    else if (days === 0) { statusLabel = "Retour aujourd'hui"; statusColor = "#f59e0b"; }
                    else if (days <= 2) { statusLabel = `Retour dans ${days} j`; statusColor = "#f59e0b"; }

                    return (
                        <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5">
                            <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">
                                {initials(t.requestedBy.firstName, t.requestedBy.lastName)}
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-900">
                                {t.requestedBy.firstName} {t.requestedBy.lastName}
                                </p>
                                <p className="text-xs text-gray-400">
                                {t.requestedBy.jobTitle || t.requestedBy.department || "—"}
                                </p>
                            </div>
                            </div>
                        </td>
                        <td className="py-2.5">
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin size={11} />
                            {t.destination}
                            </div>
                        </td>
                        <td className="py-2.5 text-xs text-gray-600">
                            {formatDate(t.departureDate)} → {formatDate(t.returnDate)}
                        </td>
                        <td className="py-2.5">
                            <span className="text-xs font-medium" style={{ color: statusColor }}>
                            {statusLabel}
                            </span>
                        </td>
                        <td className="py-2.5">
                            <button
                            onClick={() => router.push("/companies/AfrikVoyage/reservations")}
                            className="text-xs font-medium hover:underline"
                            style={{ color: "#0f766e" }}
                            >
                            Voir
                            </button>
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>
            )}
        </div>
        </div>
    );
}
