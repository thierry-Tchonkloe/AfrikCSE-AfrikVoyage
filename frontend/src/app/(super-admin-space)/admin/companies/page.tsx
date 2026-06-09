// "use client";

// import { useEffect, useState, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import { Plus, Search, Eye, Pencil, Pause, Play, Trash2, Download, ChevronLeft, ChevronRight,} from "lucide-react";
// import { adminService } from "@/services/admin/admin.service";
// import { toast } from "sonner";

// interface Org {
//     id: string;
//     name: string;
//     businessEmail: string;
//     country: string;
//     status: string;
//     hasCSE: boolean;
//     hasVoyage: boolean;
//     createdAt: string;
//     _count: { users: number };
// }

// const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
//     PENDING:   { label: "En attente", color: "#f59e0b" },
//     ACTIVE:    { label: "Active",     color: "#10b981" },
//     SUSPENDED: { label: "Suspendue",  color: "#ef4444" },
//     REJECTED:  { label: "Refusée",    color: "#6b7280" },
// };

// const COUNTRY_FLAGS: Record<string, string> = {
//     BJ: "🇧🇯", SN: "🇸🇳", CI: "🇨🇮", ML: "🇲🇱",
//     BF: "🇧🇫", TG: "🇹🇬", GH: "🇬🇭", NG: "🇳🇬",
//     CM: "🇨🇲", FR: "🇫🇷", MA: "🇲🇦",
// };

// export default function CompaniesPage() {
//     const router = useRouter();

//     const [orgs, setOrgs]         = useState<Org[]>([]);
//     const [loading, setLoading]   = useState(true);
//     const [search, setSearch]     = useState("");
//     const [status, setStatus]     = useState("");
//     const [module, setModule]     = useState("");
//     const [page, setPage]         = useState(1);
//     const [totalPages, setTotalPages] = useState(1);
//     const [total, setTotal]       = useState(0);
//     const [deleteId, setDeleteId] = useState<string | null>(null);

//     const load = useCallback(async () => {
//         setLoading(true);
//         try {
//         const res = await adminService.getOrganizations({
//             page, limit: 10, search, status, module,
//         });
//         setOrgs(res.data);
//         console.log("ceci est la liste des entreprises:", orgs);
//         setTotalPages(res.totalPages);
//         setTotal(res.total);
//         } catch {
//         toast.error("Erreur chargement entreprises");
//         } finally {
//         setLoading(false);
//         }
//     }, [page, search, status, module]);

//     useEffect(() => { load(); }, [load]);

//     // Réinitialise la page quand les filtres changent
//     useEffect(() => { setPage(1); }, [search, status, module]);

//     const handleSuspend = async (id: string, currentStatus: string) => {
//         try {
//         if (currentStatus === "SUSPENDED") {
//             // Réactiver — appel à un endpoint à ajouter plus tard
//             toast.info("Fonctionnalité de réactivation à venir");
//         } else {
//             await adminService.suspendOrganization(id);
//             toast.success("Organisation suspendue");
//             load();
//         }
//         } catch {
//         toast.error("Erreur");
//         }
//     };

//     const handleDelete = async () => {
//         if (!deleteId) return;
//         try {
//         await adminService.deleteOrganization(deleteId);
//         toast.success("Organisation désactivée");
//         setDeleteId(null);
//         load();
//         } catch {
//         toast.error("Erreur suppression");
//         }
//     };

//     return (
//         <div className="space-y-5">
//         {/* ── En-tête ── */}
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//             <div>
//             <h1 className="text-xl font-bold text-gray-900">Gestion des entreprises</h1>
//             <p className="text-sm text-gray-500">
//                 Gérez et administrez toutes les entreprises clientes
//             </p>
//             </div>
//             <div className="flex gap-2">
//             <button
//                 className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50 transition-colors"
//                 onClick={() => toast.info("Export à venir")}
//             >
//                 <Download size={15} /> Exporter
//             </button>
//             <button
//                 onClick={() => router.push("/admin/companies/new")}
//                 className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
//                 style={{ background: "var(--color-primary)" }}
//             >
//                 <Plus size={15} /> Ajouter une entreprise
//             </button>
//             </div>
//         </div>

//         {/* ── Filtres ── */}
//         <div className="bg-white rounded-xl border border-gray-200 p-4">
//             <div className="flex flex-col sm:flex-row gap-3">
//             <div className="relative flex-1">
//                 <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//                 <input
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Rechercher une entreprise..."
//                 className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"
//                 />
//             </div>
//             <select
//                 value={status}
//                 onChange={(e) => setStatus(e.target.value)}
//                 className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-600"
//             >
//                 <option value="">Tous les statuts</option>
//                 <option value="PENDING">En attente</option>
//                 <option value="ACTIVE">Active</option>
//                 <option value="SUSPENDED">Suspendue</option>
//                 <option value="REJECTED">Refusée</option>
//             </select>
//             <select
//                 value={module}
//                 onChange={(e) => setModule(e.target.value)}
//                 className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-600"
//             >
//                 <option value="">Tous les modules</option>
//                 <option value="CSE">AfrikCSE</option>
//                 <option value="VOYAGE">AfrikVoyage</option>
//             </select>
//             </div>
//         </div>

//         {/* ── Tableau ── */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//             <div className="overflow-x-auto">
//             <table className="w-full">
//                 <thead>
//                 <tr className="border-b border-gray-100 bg-gray-50">
//                     {["Entreprise", "Pays", "Modules", "Statut", "Date d'inscription", "Actions"].map((h) => (
//                     <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">
//                         {h}
//                     </th>
//                     ))}
//                 </tr>
//                 </thead>
//                 <tbody>
//                 {loading ? (
//                     [...Array(5)].map((_, i) => (
//                     <tr key={i} className="border-b border-gray-50">
//                         <td colSpan={6} className="px-5 py-4">
//                             <div className="h-4 bg-gray-100 rounded animate-pulse" />
//                         </td>
//                     </tr>
//                     ))
//                 ) : orgs.length === 0 ? (
//                     <tr>
//                     <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
//                         Aucune entreprise trouvée
//                     </td>
//                     </tr>
//                 ) : (
//                     orgs.map((org) => {
//                     const st = STATUS_CONFIG[org.status] ?? STATUS_CONFIG.PENDING;
//                     return (
//                         <tr key={org.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
//                         {/* Entreprise */}
//                         <td className="px-5 py-3">
//                             <div className="flex items-center gap-2.5">
//                             <OrgAvatar name={org.name} />
//                             <div>
//                                 <p className="text-sm font-medium text-gray-900">{org.name}</p>
//                                 <p className="text-xs text-gray-500">{org.businessEmail}</p>
//                             </div>
//                             </div>
//                         </td>
//                         {/* Pays */}
//                         <td className="px-5 py-3 text-sm text-gray-600">
//                             {COUNTRY_FLAGS[org.country] ?? ""} {org.country}
//                         </td>
//                         {/* Modules */}
//                         <td className="px-5 py-3">
//                             <div className="flex gap-1.5 flex-wrap">
//                             {org.hasCSE && <ModuleBadge label="AfrikCSE" color="#0f766e" />}
//                             {org.hasVoyage && <ModuleBadge label="AfrikVoyage" color="#f59e0b" />}
//                             {!org.hasCSE && !org.hasVoyage && (
//                                 <span className="text-xs text-gray-400">—</span>
//                             )}
//                             </div>
//                         </td>
//                         {/* Statut */}
//                         <td className="px-5 py-3">
//                             <span
//                             className="text-xs font-medium px-2.5 py-1 rounded-full"
//                             style={{ color: st.color, background: st.color + "18" }}
//                             >
//                             {st.label}
//                             </span>
//                         </td>
//                         {/* Date */}
//                         <td className="px-5 py-3 text-xs text-gray-500">
//                             {new Date(org.createdAt).toLocaleDateString("fr-FR", {
//                             day: "numeric", month: "short", year: "numeric",
//                             })}
//                         </td>
//                         {/* Actions */}
//                         <td className="px-5 py-3">
//                             <div className="flex items-center gap-1">
//                             <ActionBtn
//                                 icon={<Eye size={15} />}
//                                 title="Voir"
//                                 onClick={() => router.push(`/admin/companies/${org.id}`)}
//                             />
//                             <ActionBtn
//                                 icon={<Pencil size={15} />}
//                                 title="Modifier"
//                                 onClick={() => router.push(`/admin/companies/${org.id}`)}
//                             />
//                             <ActionBtn
//                                 icon={org.status === "SUSPENDED"
//                                 ? <Play size={15} />
//                                 : <Pause size={15} />}
//                                 title={org.status === "SUSPENDED" ? "Réactiver" : "Suspendre"}
//                                 onClick={() => handleSuspend(org.id, org.status)}
//                             />
//                             <ActionBtn
//                                 icon={<Trash2 size={15} />}
//                                 title="Supprimer"
//                                 danger
//                                 onClick={() => setDeleteId(org.id)}
//                             />
//                             </div>
//                         </td>
//                         </tr>
//                     );
//                     })
//                 )}
//                 </tbody>
//             </table>
//             </div>

//             {/* Pagination */}
//             <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
//             <p className="text-xs text-gray-500">
//                 Affichage de {orgs.length} sur {total} entreprises
//             </p>
//             <div className="flex items-center gap-1">
//                 <button
//                 disabled={page <= 1}
//                 onClick={() => setPage(page - 1)}
//                 className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 text-gray-600"
//                 >
//                 <ChevronLeft size={16} />
//                 </button>
//                 {[...Array(Math.min(totalPages, 5))].map((_, i) => {
//                 const p = i + 1;
//                 return (
//                     <button
//                     key={p}
//                     onClick={() => setPage(p)}
//                     className="w-7 h-7 rounded text-xs font-medium transition-colors"
//                     style={
//                         page === p
//                         ? { background: "var(--color-primary)", color: "white" }
//                         : { color: "#6b7280" }
//                     }
//                     >
//                     {p}
//                     </button>
//                 );
//                 })}
//                 <button
//                 disabled={page >= totalPages}
//                 onClick={() => setPage(page + 1)}
//                 className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 text-gray-600"
//                 >
//                 <ChevronRight size={16} />
//                 </button>
//             </div>
//             </div>
//         </div>

//         {/* ── Modal confirmation suppression ── */}
//         {deleteId && (
//             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
//             <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
//                 <h3 className="font-bold text-gray-900 mb-2">Confirmer la désactivation</h3>
//                 <p className="text-sm text-gray-500 mb-5">
//                 Cette action désactivera l&apos;organisation et tous ses utilisateurs.
//                 Elle peut être réactivée ultérieurement.
//                 </p>
//                 <div className="flex justify-end gap-2">
//                 <button
//                     onClick={() => setDeleteId(null)}
//                     className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
//                 >
//                     Annuler
//                 </button>
//                 <button
//                     onClick={handleDelete}
//                     className="px-4 py-2 text-sm rounded-lg text-white bg-red-500 hover:bg-red-600"
//                 >
//                     Désactiver
//                 </button>
//                 </div>
//             </div>
//             </div>
//         )}
//         </div>
//     );
// }

// // ── Utilitaires ──

// function OrgAvatar({ name }: { name: string }) {
//     const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
//     const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#0f766e"];
//     const color = colors[name.charCodeAt(0) % colors.length];
//     return (
//         <div
//             className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
//             style={{ background: color }}
//         >
//             {initials}
//         </div>
//     );
// }

// function ModuleBadge({ label, color }: { label: string; color: string }) {
//     return (
//         <span
//             className="text-xs font-medium px-2 py-0.5 rounded"
//             style={{ color, background: color + "18" }}
//         >
//             {label}
//         </span>
//     );
// }

// function ActionBtn({icon, title, onClick, danger = false,}: {
//     icon: React.ReactNode;
//     title: string;
//     onClick: () => void;
//     danger?: boolean;
// }) {
//     return (
//         <button
//         title={title}
//         onClick={onClick}
//         className="p-1.5 rounded hover:bg-gray-100 transition-colors"
//         style={{ color: danger ? "#ef4444" : "#6b7280" }}
//         >
//         {icon}
//         </button>
//     );
// }















"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Plus, Search, Eye, Pencil, Pause, Play,
    Trash2, Download, ChevronLeft, ChevronRight,
    X, Save, Loader2, Copy, Check,
} from "lucide-react";
import { adminService } from "@/services/admin/admin.service";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────
interface Org {
    id:            string;
    name:          string;
    businessEmail: string;
    country:       string;
    city:          string | null;
    phone:         string | null;
    size:          string | null;
    industry:      string | null;
    plan:          string;
    status:        string;
    hasCSE:        boolean;
    hasVoyage:     boolean;
    createdAt:     string;
    validatedAt:   string | null;
    _count:        { users: number };
    users:         Array<{ firstName: string; lastName: string; email: string }>;
}

// ── Config ─────────────────────────────────────────────────
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

const PLANS   = ["STARTER", "BUSINESS", "ENTERPRISE"];
const COUNTRIES = [
    { code: "BJ", name: "Bénin" }, { code: "SN", name: "Sénégal" },
    { code: "CI", name: "Côte d'Ivoire" }, { code: "ML", name: "Mali" },
    { code: "BF", name: "Burkina Faso" }, { code: "TG", name: "Togo" },
    { code: "GH", name: "Ghana" }, { code: "NG", name: "Nigeria" },
    { code: "CM", name: "Cameroun" }, { code: "MA", name: "Maroc" },
    { code: "FR", name: "France" },
];

// ── Composant principal ────────────────────────────────────
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

    // Modales
    const [viewOrg, setViewOrg]   = useState<Org | null>(null);
    const [editOrg, setEditOrg]   = useState<Org | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [inviteOrg, setInviteOrg] = useState<Org | null>(null);

    // États actions
    const [processing, setProcessing] = useState<string | null>(null);
    const [editForm, setEditForm]     = useState<Partial<Org>>({});
    const [inviteLink, setInviteLink] = useState("");
    const [copied, setCopied]         = useState(false);

    // ── Chargement ──────────────────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        try {
        const res = await adminService.getOrganizations({
            page, limit: 10, search, status, module,
        });
        setOrgs(res.data);
        setTotalPages(res.totalPages);
        setTotal(res.total);
        } catch {
        toast.error("Erreur chargement entreprises");
        } finally {
        setLoading(false);
        }
    }, [page, search, status, module]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [search, status, module]);

    // ── Actions ─────────────────────────────────────────────

    const handleView = async (org: Org) => {
        try {
        // Charge le détail complet
        const full = await adminService.getOrganization(org.id);
        setViewOrg(full);
        } catch {
        setViewOrg(org); // fallback sur les données de liste
        }
    };

    const handleEditOpen = (org: Org) => {
        setEditOrg(org);
        setEditForm({
        name:          org.name,
        businessEmail: org.businessEmail,
        country:       org.country,
        city:          org.city,
        phone:         org.phone,
        size:          org.size,
        industry:      org.industry,
        plan:          org.plan,
        hasCSE:        org.hasCSE,
        hasVoyage:     org.hasVoyage,
        });
    };

    const handleEditSave = async () => {
        if (!editOrg) return;
        setProcessing("edit");
        try {
        await adminService.updateOrganization(editOrg.id, editForm);
        toast.success("Organisation mise à jour");
        setEditOrg(null);
        load();
        } catch {
        toast.error("Erreur mise à jour");
        } finally {
        setProcessing(null);
        }
    };

    const handleSuspend = async (org: Org) => {
        setProcessing(org.id + "-suspend");
        try {
        await adminService.suspendOrganization(org.id);
        toast.success("Organisation suspendue");
        load();
        } catch {
        toast.error("Erreur");
        } finally {
        setProcessing(null);
        }
    };

    const handleReactivate = async (org: Org) => {
        setProcessing(org.id + "-reactivate");
        try {
        await adminService.reactivateOrganization(org.id);
        toast.success("Organisation réactivée !");
        load();
        } catch {
        toast.error("Erreur réactivation");
        } finally {
        setProcessing(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setProcessing("delete");
        try {
        await adminService.deleteOrganization(deleteId);
        toast.success("Organisation désactivée");
        setDeleteId(null);
        load();
        } catch {
        toast.error("Erreur suppression");
        } finally {
        setProcessing(null);
        }
    };

    const handleGenerateInvite = async (org: Org) => {
        setInviteOrg(org);
        setProcessing("invite");
        try {
        const res = await adminService.regenerateInvitation(org.id);
        setInviteLink(res.invitationLink);
        } catch {
        toast.error("Erreur génération lien");
        setInviteOrg(null);
        } finally {
        setProcessing(null);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        toast.success("Lien copié !");
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Rendu ────────────────────────────────────────────────
    return (
        <div className="space-y-5">

        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Gestion des entreprises</h1>
            <p className="text-sm text-gray-500">
                Gérez et administrez toutes les entreprises clientes
            </p>
            </div>
            <div className="flex gap-2">
            <button
                onClick={() => toast.info("Export à venir")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50"
            >
                <Download size={15} /> Exporter
            </button>
            <button
                onClick={() => router.push("/admin/companies/new")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "var(--color-primary)" }}
            >
                <Plus size={15} /> Ajouter une entreprise
            </button>
            </div>
        </div>

        {/* Filtres */}
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
            <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-600">
                <option value="">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspendue</option>
                <option value="REJECTED">Refusée</option>
            </select>
            <select value={module} onChange={(e) => setModule(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-600">
                <option value="">Tous les modules</option>
                <option value="CSE">AfrikCSE</option>
                <option value="VOYAGE">AfrikVoyage</option>
            </select>
            </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                    {["Entreprise", "Pays", "Modules", "Statut", "Date d'inscription", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
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
                    const isSuspending = processing === org.id + "-suspend";
                    const isReactivating = processing === org.id + "-reactivate";

                    return (
                        <tr key={org.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors">

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
                            {/* Voir */}
                            <ActionBtn
                                icon={<Eye size={14} />}
                                title="Voir le détail"
                                onClick={() => handleView(org)}
                            />

                            {/* Modifier */}
                            <ActionBtn
                                icon={<Pencil size={14} />}
                                title="Modifier"
                                onClick={() => handleEditOpen(org)}
                            />

                            {/* Suspendre / Réactiver */}
                            {org.status === "SUSPENDED" ? (
                                <ActionBtn
                                icon={isReactivating
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : <Play size={14} />}
                                title="Réactiver"
                                onClick={() => handleReactivate(org)}
                                color="#10b981"
                                />
                            ) : org.status === "ACTIVE" ? (
                                <ActionBtn
                                icon={isSuspending
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : <Pause size={14} />}
                                title="Suspendre"
                                onClick={() => handleSuspend(org)}
                                color="#f59e0b"
                                />
                            ) : null}

                            {/* Lien invitation */}
                            <ActionBtn
                                icon={<Copy size={14} />}
                                title="Générer lien d'invitation"
                                onClick={() => handleGenerateInvite(org)}
                                color="#6366f1"
                            />

                            {/* Supprimer */}
                            <ActionBtn
                                icon={<Trash2 size={14} />}
                                title="Désactiver"
                                onClick={() => setDeleteId(org.id)}
                                danger
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
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 text-gray-600">
                <ChevronLeft size={16} />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)}
                    className="w-7 h-7 rounded text-xs font-medium"
                    style={page === i + 1
                    ? { background: "var(--color-primary)", color: "white" }
                    : { color: "#6b7280" }}>
                    {i + 1}
                </button>
                ))}
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 text-gray-600">
                <ChevronRight size={16} />
                </button>
            </div>
            </div>
        </div>

        {/* ══════════════════════════════════════════
            MODAL : VOIR DÉTAIL
        ══════════════════════════════════════════ */}
        {viewOrg && (
            <Modal
            title={`Détail — ${viewOrg.name}`}
            onClose={() => setViewOrg(null)}
            size="lg"
            >
            <div className="space-y-5">
                {/* Header org */}
                <div className="flex items-start gap-4">
                <OrgAvatar name={viewOrg.name} size="lg" />
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-gray-900">{viewOrg.name}</h2>
                    <StatusBadge status={viewOrg.status} />
                    </div>
                    <p className="text-sm text-gray-500">{viewOrg.businessEmail}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                    Créée le {new Date(viewOrg.createdAt).toLocaleDateString("fr-FR")}
                    {viewOrg.validatedAt && ` · Validée le ${new Date(viewOrg.validatedAt).toLocaleDateString("fr-FR")}`}
                    </p>
                </div>
                </div>

                {/* Infos en grille */}
                <div className="grid grid-cols-2 gap-3">
                {[
                    { label: "Pays",       value: `${COUNTRY_FLAGS[viewOrg.country] ?? ""} ${viewOrg.country}` },
                    { label: "Ville",      value: viewOrg.city ?? "—" },
                    { label: "Téléphone",  value: viewOrg.phone ?? "—" },
                    { label: "Taille",     value: viewOrg.size ?? "—" },
                    { label: "Secteur",    value: viewOrg.industry ?? "—" },
                    { label: "Plan",       value: viewOrg.plan },
                    { label: "Utilisateurs", value: String(viewOrg._count?.users ?? 0) },
                ].map((row) => (
                    <div key={row.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">{row.label}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{row.value}</p>
                    </div>
                ))}
                </div>

                {/* Modules */}
                <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Modules activés</p>
                <div className="flex gap-2">
                    {viewOrg.hasCSE && <ModuleBadge label="AfrikCSE" color="#0f766e" />}
                    {viewOrg.hasVoyage && <ModuleBadge label="AfrikVoyage" color="#f59e0b" />}
                    {!viewOrg.hasCSE && !viewOrg.hasVoyage && (
                    <span className="text-xs text-gray-400">Aucun module actif</span>
                    )}
                </div>
                </div>

                {/* Admin principal */}
                {viewOrg.users?.[0] && (
                <div className="border border-gray-200 rounded-xl p-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Administrateur principal</p>
                    <p className="text-sm font-semibold text-gray-900">
                    {viewOrg.users[0].firstName} {viewOrg.users[0].lastName}
                    </p>
                    <p className="text-xs text-gray-500">{viewOrg.users[0].email}</p>
                </div>
                )}

                {/* Actions rapides depuis la modal */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <button
                    onClick={() => { setViewOrg(null); handleEditOpen(viewOrg); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-medium"
                    style={{ background: "var(--color-primary)" }}
                >
                    <Pencil size={13} /> Modifier
                </button>
                {viewOrg.status === "ACTIVE" && (
                    <button
                    onClick={() => { setViewOrg(null); handleSuspend(viewOrg); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-medium bg-amber-500"
                    >
                    <Pause size={13} /> Suspendre
                    </button>
                )}
                {viewOrg.status === "SUSPENDED" && (
                    <button
                    onClick={() => { setViewOrg(null); handleReactivate(viewOrg); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-medium bg-green-500"
                    >
                    <Play size={13} /> Réactiver
                    </button>
                )}
                <button
                    onClick={() => { setViewOrg(null); handleGenerateInvite(viewOrg); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
                >
                    <Copy size={13} /> Lien invitation
                </button>
                </div>
            </div>
            </Modal>
        )}

        {/* ══════════════════════════════════════════
            MODAL : MODIFIER
        ══════════════════════════════════════════ */}
        {editOrg && (
            <Modal
            title={`Modifier — ${editOrg.name}`}
            onClose={() => setEditOrg(null)}
            size="lg"
            >
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nom de l'entreprise *" colSpan>
                    <input value={editForm.name ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className={inp} />
                </Field>
                <Field label="Email professionnel *" colSpan>
                    <input value={editForm.businessEmail ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, businessEmail: e.target.value })}
                    type="email" className={inp} />
                </Field>
                <Field label="Pays">
                    <select value={editForm.country ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    className={inp}>
                    {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                    </select>
                </Field>
                <Field label="Ville">
                    <input value={editForm.city ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className={inp} />
                </Field>
                <Field label="Téléphone">
                    <input value={editForm.phone ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className={inp} />
                </Field>
                <Field label="Taille">
                    <select value={editForm.size ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                    className={inp}>
                    {["1-10", "11-50", "51-200", "201-500", "500+"].map((s) => (
                        <option key={s}>{s}</option>
                    ))}
                    </select>
                </Field>
                <Field label="Plan">
                    <select value={editForm.plan ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                    className={inp}>
                    {PLANS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                </Field>
                </div>

                {/* Modules */}
                <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Modules actifs</p>
                <div className="flex gap-3">
                    {[
                    { key: "hasCSE" as const,    label: "AfrikCSE",    color: "#0f766e" },
                    { key: "hasVoyage" as const, label: "AfrikVoyage", color: "#f59e0b" },
                    ].map((mod) => (
                    <label key={mod.key}
                        className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm"
                        style={editForm[mod.key]
                        ? { borderColor: mod.color, background: mod.color + "10", color: mod.color }
                        : { borderColor: "#e5e7eb", color: "#6b7280" }}
                    >
                        <input type="checkbox"
                        checked={editForm[mod.key] ?? false}
                        onChange={(e) => setEditForm({ ...editForm, [mod.key]: e.target.checked })}
                        style={{ accentColor: mod.color }} />
                        {mod.label}
                    </label>
                    ))}
                </div>
                </div>

                {/* Boutons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => setEditOrg(null)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                    Annuler
                </button>
                <button
                    onClick={handleEditSave}
                    disabled={processing === "edit"}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white disabled:opacity-70"
                    style={{ background: "var(--color-primary)" }}
                >
                    {processing === "edit"
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Save size={14} />}
                    Enregistrer
                </button>
                </div>
            </div>
            </Modal>
        )}

        {/* ══════════════════════════════════════════
            MODAL : LIEN INVITATION
        ══════════════════════════════════════════ */}
        {inviteOrg && (
            <Modal
            title={`Lien d'invitation — ${inviteOrg.name}`}
            onClose={() => { setInviteOrg(null); setInviteLink(""); }}
            >
            {processing === "invite" ? (
                <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-gray-400" size={24} />
                </div>
            ) : inviteLink ? (
                <div className="space-y-4">
                <p className="text-sm text-gray-600">
                    Envoyez ce lien à l&#39;administrateur de <strong>{inviteOrg.name}</strong>.
                    Il lui permettra d&#39;activer son compte. Valable <strong>7 jours</strong>.
                </p>
                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-xs font-mono text-gray-700 flex-1 truncate">
                    {inviteLink}
                    </p>
                    <button onClick={handleCopy}
                    className="shrink-0 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    style={{ color: copied ? "#10b981" : "#6b7280" }}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                </div>
                <div className="p-3 rounded-xl text-xs"
                    style={{ background: "#fffbeb", color: "#92400e" }}>
                    ⚠️ Ce lien est à usage unique. Une fois utilisé, il ne sera plus valide.
                </div>
                <button
                    onClick={() => { setInviteOrg(null); setInviteLink(""); }}
                    className="w-full py-2 rounded-lg text-white text-sm font-medium"
                    style={{ background: "var(--color-primary)" }}
                >
                    Terminé
                </button>
                </div>
            ) : null}
            </Modal>
        )}

        {/* ══════════════════════════════════════════
            MODAL : CONFIRMATION SUPPRESSION
        ══════════════════════════════════════════ */}
        {deleteId && (
            <Modal title="Confirmer la désactivation" onClose={() => setDeleteId(null)}>
            <p className="text-sm text-gray-500 mb-5">
                Cette action désactivera l&#39;organisation et tous ses utilisateurs.
                Elle peut être réactivée ultérieurement depuis la liste.
            </p>
            <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                Annuler
                </button>
                <button
                onClick={handleDelete}
                disabled={processing === "delete"}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white bg-red-500 disabled:opacity-70"
                >
                {processing === "delete" && <Loader2 size={14} className="animate-spin" />}
                Désactiver
                </button>
            </div>
            </Modal>
        )}
        </div>
    );
}

// ── Composants utilitaires ─────────────────────────────────

function OrgAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
    const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const colors   = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#0f766e"];
    const color    = colors[name.charCodeAt(0) % colors.length];
    const cls      = size === "lg"
        ? "w-14 h-14 rounded-xl text-lg"
        : "w-8 h-8 rounded-lg text-xs";
    return (
        <div
        className={`${cls} flex items-center justify-center text-white font-bold shrink-0`}
        style={{ background: color }}
        >
        {initials}
        </div>
    );
}

function ModuleBadge({ label, color }: { label: string; color: string }) {
    return (
        <span className="text-xs font-medium px-2 py-0.5 rounded"
        style={{ color, background: color + "18" }}>
        {label}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const st = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
    return (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ color: st.color, background: st.color + "18" }}>
        {st.label}
        </span>
    );
}

function ActionBtn({ icon, title, onClick, danger = false, color }: {
    icon:     React.ReactNode;
    title:    string;
    onClick:  () => void;
    danger?:  boolean;
    color?:   string;
}) {
    return (
        <button title={title} onClick={onClick}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        style={{ color: danger ? "#ef4444" : color ?? "#6b7280" }}>
        {icon}
        </button>
    );
}

function Field({ label, children, colSpan = false }: {
    label:    string;
    children: React.ReactNode;
    colSpan?: boolean;
}) {
    return (
        <div className={colSpan ? "col-span-2" : ""}>
        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
        {children}
        </div>
    );
}

function Modal({ title, children, onClose, size = "md" }: {
    title:    string;
    children: React.ReactNode;
    onClose:  () => void;
    size?:    "md" | "lg";
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div
            className="bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ width: size === "lg" ? "640px" : "480px", maxWidth: "100%" }}
        >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
            <h3 className="font-bold text-gray-900">{title}</h3>
            <button onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
            </button>
            </div>
            <div className="p-5">{children}</div>
        </div>
        </div>
    );
}

const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400 bg-white text-gray-900";