"use client";

import { useEffect, useState, useCallback } from "react";
import {
    UserPlus, Search, Eye, Pencil, Pause, Play, Trash2,
    Users, Building2, Briefcase, UserX,
} from "lucide-react";
import { cseService } from "@/services/companies/cse.service";
import { companyService } from "@/services/companies/company.service";
import { toast } from "sonner";

interface EmpItem {
    id: string;
    matricule: string | null;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        isActive: boolean;
        jobTitle: string | null;
        department: string | null;
        lastLoginAt: string | null;
    };
    manager: { user: { firstName: string; lastName: string } } | null;
}

interface Stats {
    active: number;
    departments: number;
    managers: number;
    suspended: number;
}

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Admin",
    MANAGER: "Manager",
    RH: "RH",
    FINANCE: "Finance",
    EMPLOYE: "Employé",
};

export default function EmployesPage() {
    const [employees, setEmployees] = useState<EmpItem[]>([]);
    const [stats, setStats]         = useState<Stats | null>(null);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState("");
    const [status, setStatus]       = useState("");
    const [role, setRole]           = useState("");
    const [page, setPage]           = useState(1);
    const [total, setTotal]         = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [showAdd, setShowAdd]     = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const [empRes, statsRes] = await Promise.all([
            cseService.getEmployees({ search, status, role, page, limit: 10 }),
            cseService.getEmployeeStats(),
        ]);
        setEmployees(empRes.data);
        setTotal(empRes.total);
        setTotalPages(empRes.totalPages);
        setStats(statsRes);
        } catch {
        toast.error("Erreur chargement");
        } finally {
        setLoading(false);
        }
    }, [search, status, role, page]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [search, status, role]);

    const handleDeactivate = async (userId: string) => {
        try {
        await companyService.deactivateUser(userId);
        toast.success("Employé désactivé");
        load();
        } catch { toast.error("Erreur"); }
    };

    const handleActivate = async (userId: string) => {
        try {
        await companyService.activateUser(userId);
        toast.success("Employé réactivé");
        load();
        } catch { toast.error("Erreur"); }
    };

    return (
        <div className="space-y-5">
        {/* En-tête */}
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Gestion des employés</h1>
            <p className="text-sm text-gray-500">
                Administrez les collaborateurs de votre entreprise
            </p>
            </div>
            <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: "#0f766e" }}
            >
            <UserPlus size={15} /> Ajouter un employé
            </button>
        </div>

        {/* Stats */}
        {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
                { label: "Employés actifs",   value: stats.active,     icon: Users,     color: "#3b82f6", bg: "#eff6ff", sub: "+12%" },
                { label: "Départements",      value: stats.departments, icon: Building2, color: "#10b981", bg: "#f0fdf4", sub: "—" },
                { label: "Managers",          value: stats.managers,    icon: Briefcase, color: "#f59e0b", bg: "#fffbeb", sub: "—" },
                { label: "Comptes suspendus", value: stats.suspended,   icon: UserX,     color: "#ef4444", bg: "#fef2f2", sub: `-${stats.suspended > 0 ? 3 : 0}` },
            ].map((s) => (
                <div key={s.label}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: s.bg }}>
                    <s.icon size={20} style={{ color: s.color }} />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                </div>
                <span className="ml-auto text-xs font-medium"
                    style={{ color: s.color }}>{s.sub}</span>
                </div>
            ))}
            </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, email ou matricule..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
            />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-600">
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
            </select>
            <select value={role} onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-600">
            <option value="">Tous les rôles</option>
            <option value="MANAGER">Manager</option>
            <option value="RH">RH</option>
            <option value="FINANCE">Finance</option>
            <option value="EMPLOYE">Employé</option>
            </select>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
            <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                {["Employé", "Département", "Rôle", "Statut", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                ))}
                </tr>
            </thead>
            <tbody>
                {loading ? (
                [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-b">
                    <td colSpan={5} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                    </tr>
                ))
                ) : employees.length === 0 ? (
                <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                    Aucun employé trouvé
                    </td>
                </tr>
                ) : (
                employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                        <Avatar name={`${emp.user.firstName} ${emp.user.lastName}`}
                            active={emp.user.isActive} />
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                            {emp.user.firstName} {emp.user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{emp.user.email}</p>
                        </div>
                        </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                        {emp.user.department ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                        {ROLE_LABELS[emp.user.role] ?? emp.user.role}
                    </td>
                    <td className="px-5 py-3">
                        <span
                        className="text-xs font-medium px-2 py-1 rounded-full"
                        style={emp.user.isActive
                            ? { color: "#166534", background: "#f0fdf4" }
                            : { color: "#9ca3af", background: "#f9fafb" }}
                        >
                        {emp.user.isActive ? "Actif" : "Inactif"}
                        </span>
                    </td>
                    <td className="px-5 py-3">
                        <div className="flex gap-1">
                        <Btn icon={<Eye size={14} />} title="Voir" onClick={() => {}} />
                        <Btn icon={<Pencil size={14} />} title="Modifier" onClick={() => {}} />
                        {emp.user.isActive ? (
                            <Btn icon={<Pause size={14} />} title="Suspendre"
                            onClick={() => handleDeactivate(emp.user.id)} />
                        ) : (
                            <Btn icon={<Play size={14} />} title="Réactiver"
                            onClick={() => handleActivate(emp.user.id)} />
                        )}
                        <Btn icon={<Trash2 size={14} />} title="Supprimer"
                            onClick={() => handleDeactivate(emp.user.id)} danger />
                        </div>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
                Affichage de 1 à {employees.length} sur {total} employés
            </p>
            <div className="flex gap-1 items-center">
                <PagBtn label="Précédent" onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1} />
                {[...Array(Math.min(totalPages, 3))].map((_, i) => (
                <button key={i}
                    onClick={() => setPage(i + 1)}
                    className="w-7 h-7 rounded text-xs"
                    style={page === i + 1
                    ? { background: "#0f766e", color: "white" }
                    : { color: "#6b7280" }}>
                    {i + 1}
                </button>
                ))}
                <PagBtn label="Suivant" onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages} />
            </div>
            </div>
        </div>

        {/* Modal ajout (réutilise le composant de /companies/users) */}
        {showAdd && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                <h3 className="font-bold text-gray-900 mb-4">Ajouter un employé</h3>
                <p className="text-sm text-gray-500 mb-4">
                Utilisez la page Utilisateurs pour ajouter un employé avec toutes les options.
                </p>
                <div className="flex gap-2">
                <button onClick={() => setShowAdd(false)}
                    className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                    Fermer
                </button>
                <a href="/companies/users?action=new"
                    className="flex-1 py-2 rounded-lg text-white text-sm text-center font-medium"
                    style={{ background: "#0f766e" }}>
                    Aller à Utilisateurs
                </a>
                </div>
            </div>
            </div>
        )}
        </div>
    );
}

function Avatar({ name, active }: { name: string; active: boolean }) {
    const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#0f766e"];
    const color = colors[name.charCodeAt(0) % colors.length];
    return (
        <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: color, opacity: active ? 1 : 0.5 }}>
            {initials}
        </div>
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
            style={{ background: active ? "#10b981" : "#d1d5db" }} />
        </div>
    );
}

function Btn({ icon, title, onClick, danger = false }: {
    icon: React.ReactNode; title: string;
    onClick: () => void; danger?: boolean;
}) {
    return (
        <button title={title} onClick={onClick}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        style={{ color: danger ? "#ef4444" : "#6b7280" }}>
        {icon}
        </button>
    );
}

function PagBtn({ label, onClick, disabled }: {
    label: string; onClick: () => void; disabled: boolean;
}) {
    return (
        <button onClick={onClick} disabled={disabled}
        className="text-xs px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40 text-gray-600">
        {label}
        </button>
    );
}