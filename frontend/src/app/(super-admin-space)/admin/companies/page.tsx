"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Eye, Pencil, Pause, Play, Trash2, Download, ChevronLeft, ChevronRight,} from "lucide-react";
import { adminService } from "@/services/admin/admin.service";
import { toast } from "sonner";

interface Org {
    id: string;
    name: string;
    businessEmail: string;
    country: string;
    status: string;
    hasCSE: boolean;
    hasVoyage: boolean;
    createdAt: string;
    _count: { users: number };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING:   { label: "En attente", color: "#f59e0b" },
    ACTIVE:    { label: "Active",     color: "#10b981" },
    SUSPENDED: { label: "Suspendue",  color: "#ef4444" },
    REJECTED:  { label: "Refusée",    color: "#6b7280" },
};

const COUNTRY_FLAGS: Record<string, string> = {
    BJ: "🇧🇯", SN: "🇸🇳", CI: "🇨🇮", ML: "🇲🇱",
    BF: "🇧🇫", TG: "🇹🇬", GH: "🇬🇭", NG: "🇳🇬",
    CM: "🇨🇲", FR: "🇫🇷", MA: "🇲🇦",
};

export default function CompaniesPage() {
    const router = useRouter();

    const [orgs, setOrgs]         = useState<Org[]>([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState("");
    const [status, setStatus]     = useState("");
    const [module, setModule]     = useState("");
    const [page, setPage]         = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal]       = useState(0);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const res = await adminService.getOrganizations({
            page, limit: 10, search, status, module,
        });
        setOrgs(res.data);
        console.log(orgs);
        setTotalPages(res.totalPages);
        setTotal(res.total);
        } catch {
        toast.error("Erreur chargement entreprises");
        } finally {
        setLoading(false);
        }
    }, [page, search, status, module]);

    useEffect(() => { load(); }, [load]);

    // Réinitialise la page quand les filtres changent
    useEffect(() => { setPage(1); }, [search, status, module]);

    const handleSuspend = async (id: string, currentStatus: string) => {
        try {
        if (currentStatus === "SUSPENDED") {
            // Réactiver — appel à un endpoint à ajouter plus tard
            toast.info("Fonctionnalité de réactivation à venir");
        } else {
            await adminService.suspendOrganization(id);
            toast.success("Organisation suspendue");
            load();
        }
        } catch {
        toast.error("Erreur");
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
        await adminService.deleteOrganization(deleteId);
        toast.success("Organisation désactivée");
        setDeleteId(null);
        load();
        } catch {
        toast.error("Erreur suppression");
        }
    };

    return (
        <div className="space-y-5">
        {/* ── En-tête ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Gestion des entreprises</h1>
            <p className="text-sm text-gray-500">
                Gérez et administrez toutes les entreprises clientes
            </p>
            </div>
            <div className="flex gap-2">
            <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                onClick={() => toast.info("Export à venir")}
            >
                <Download size={15} /> Exporter
            </button>
            <button
                onClick={() => router.push("/admin/companies/new")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: "var(--color-primary)" }}
            >
                <Plus size={15} /> Ajouter une entreprise
            </button>
            </div>
        </div>

        {/* ── Filtres ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une entreprise..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"
                />
            </div>
            <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-600"
            >
                <option value="">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspendue</option>
                <option value="REJECTED">Refusée</option>
            </select>
            <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-600"
            >
                <option value="">Tous les modules</option>
                <option value="CSE">AfrikCSE</option>
                <option value="VOYAGE">AfrikVoyage</option>
            </select>
            </div>
        </div>

        {/* ── Tableau ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                    {["Entreprise", "Pays", "Modules", "Statut", "Date d'inscription", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">
                        {h}
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {loading ? (
                    [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                        <td colSpan={6} className="px-5 py-4">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                    </tr>
                    ))
                ) : orgs.length === 0 ? (
                    <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                        Aucune entreprise trouvée
                    </td>
                    </tr>
                ) : (
                    orgs.map((org) => {
                    const st = STATUS_CONFIG[org.status] ?? STATUS_CONFIG.PENDING;
                    return (
                        <tr key={org.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        {/* Entreprise */}
                        <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                            <OrgAvatar name={org.name} />
                            <div>
                                <p className="text-sm font-medium text-gray-900">{org.name}</p>
                                <p className="text-xs text-gray-500">{org.businessEmail}</p>
                            </div>
                            </div>
                        </td>
                        {/* Pays */}
                        <td className="px-5 py-3 text-sm text-gray-600">
                            {COUNTRY_FLAGS[org.country] ?? ""} {org.country}
                        </td>
                        {/* Modules */}
                        <td className="px-5 py-3">
                            <div className="flex gap-1.5 flex-wrap">
                            {org.hasCSE && <ModuleBadge label="AfrikCSE" color="#0f766e" />}
                            {org.hasVoyage && <ModuleBadge label="AfrikVoyage" color="#f59e0b" />}
                            {!org.hasCSE && !org.hasVoyage && (
                                <span className="text-xs text-gray-400">—</span>
                            )}
                            </div>
                        </td>
                        {/* Statut */}
                        <td className="px-5 py-3">
                            <span
                            className="text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{ color: st.color, background: st.color + "18" }}
                            >
                            {st.label}
                            </span>
                        </td>
                        {/* Date */}
                        <td className="px-5 py-3 text-xs text-gray-500">
                            {new Date(org.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric", month: "short", year: "numeric",
                            })}
                        </td>
                        {/* Actions */}
                        <td className="px-5 py-3">
                            <div className="flex items-center gap-1">
                            <ActionBtn
                                icon={<Eye size={15} />}
                                title="Voir"
                                onClick={() => router.push(`/admin/companies/${org.id}`)}
                            />
                            <ActionBtn
                                icon={<Pencil size={15} />}
                                title="Modifier"
                                onClick={() => router.push(`/admin/companies/${org.id}`)}
                            />
                            <ActionBtn
                                icon={org.status === "SUSPENDED"
                                ? <Play size={15} />
                                : <Pause size={15} />}
                                title={org.status === "SUSPENDED" ? "Réactiver" : "Suspendre"}
                                onClick={() => handleSuspend(org.id, org.status)}
                            />
                            <ActionBtn
                                icon={<Trash2 size={15} />}
                                title="Supprimer"
                                danger
                                onClick={() => setDeleteId(org.id)}
                            />
                            </div>
                        </td>
                        </tr>
                    );
                    })
                )}
                </tbody>
            </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
                Affichage de {orgs.length} sur {total} entreprises
            </p>
            <div className="flex items-center gap-1">
                <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 text-gray-600"
                >
                <ChevronLeft size={16} />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const p = i + 1;
                return (
                    <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-7 h-7 rounded text-xs font-medium transition-colors"
                    style={
                        page === p
                        ? { background: "var(--color-primary)", color: "white" }
                        : { color: "#6b7280" }
                    }
                    >
                    {p}
                    </button>
                );
                })}
                <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 text-gray-600"
                >
                <ChevronRight size={16} />
                </button>
            </div>
            </div>
        </div>

        {/* ── Modal confirmation suppression ── */}
        {deleteId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                <h3 className="font-bold text-gray-900 mb-2">Confirmer la désactivation</h3>
                <p className="text-sm text-gray-500 mb-5">
                Cette action désactivera l&apos;organisation et tous ses utilisateurs.
                Elle peut être réactivée ultérieurement.
                </p>
                <div className="flex justify-end gap-2">
                <button
                    onClick={() => setDeleteId(null)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                    Annuler
                </button>
                <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-sm rounded-lg text-white bg-red-500 hover:bg-red-600"
                >
                    Désactiver
                </button>
                </div>
            </div>
            </div>
        )}
        </div>
    );
}

// ── Utilitaires ──

function OrgAvatar({ name }: { name: string }) {
    const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#0f766e"];
    const color = colors[name.charCodeAt(0) % colors.length];
    return (
        <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: color }}
        >
            {initials}
        </div>
    );
}

function ModuleBadge({ label, color }: { label: string; color: string }) {
    return (
        <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{ color, background: color + "18" }}
        >
            {label}
        </span>
    );
}

function ActionBtn({icon, title, onClick, danger = false,}: {
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
        title={title}
        onClick={onClick}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        style={{ color: danger ? "#ef4444" : "#6b7280" }}
        >
        {icon}
        </button>
    );
}