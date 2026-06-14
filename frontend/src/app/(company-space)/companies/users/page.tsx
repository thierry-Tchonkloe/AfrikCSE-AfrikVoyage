"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { UserPlus, Search, Pencil, UserX, UserCheck, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { companyService } from "@/services/companies/company.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ── Types ──────────────────────────────────────────────

interface UserItem {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    jobTitle: string | null;
    department: string | null;
    lastLoginAt: string | null;
    manager: { firstName: string; lastName: string } | null;
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
    ADMIN:            { label: "Admin",    color: "#8b5cf6" },
    MANAGER:          { label: "Manager",  color: "#3b82f6" },
    RH:               { label: "RH",       color: "#10b981" },
    FINANCE:          { label: "Finance",  color: "#f59e0b" },
    EMPLOYE:          { label: "Employé",  color: "#6b7280" },
};

// ── Schéma création utilisateur ────────────────────────

const createSchema = z.object({
    firstName:  z.string().min(1, "Prénom requis"),
    lastName:   z.string().min(1, "Nom requis"),
    email:      z.string().email("Email invalide"),
    role:       z.enum(["ADMIN", "MANAGER", "RH", "FINANCE", "EMPLOYE"]),
    jobTitle:   z.string().optional(),
    department: z.string().optional(),
    phone:      z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

const DEPARTMENTS = [
    "Direction", "Ressources Humaines", "Finance & Comptabilité",
    "Commercial", "Marketing", "Technologie", "Opérations", "Autre",
];

// ── Composant principal ────────────────────────────────

function UsersContent() {
    const searchParams = useSearchParams();

    const [users, setUsers]           = useState<UserItem[]>([]);
    const [loading, setLoading]       = useState(true);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch]         = useState("");
    const [department, setDepartment] = useState("");
    const [page, setPage]             = useState(1);
    const [total, setTotal]           = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [showCreate, setShowCreate] = useState(
        searchParams.get("action") === "new"
    );
    const [editUser, setEditUser]     = useState<UserItem | null>(null);
    const [roleModal, setRoleModal]   = useState<UserItem | null>(null);
    const [processing, setProcessing] = useState(false);

    const LIMIT = 10;

    // Débounce de la recherche
    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Revient à la page 1 quand les filtres changent
    useEffect(() => { setPage(1); }, [search, department]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const data = await companyService.getUsers({
            page, limit: LIMIT,
            search: search || undefined,
            department: department || undefined,
        });
        setUsers(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        } catch {
        toast.error("Erreur chargement utilisateurs");
        } finally {
        setLoading(false);
        }
    }, [page, search, department]);

    useEffect(() => { load(); }, [load]);

    const handleDeactivate = async (u: UserItem) => {
        if (!confirm(`Désactiver ${u.firstName} ${u.lastName} ?`)) return;
        try {
        await companyService.deactivateUser(u.id);
        toast.success("Utilisateur désactivé");
        load();
        } catch {
        toast.error("Erreur");
        }
    };

    const handleActivate = async (u: UserItem) => {
        try {
        await companyService.activateUser(u.id);
        toast.success("Utilisateur réactivé");
        load();
        } catch {
        toast.error("Erreur");
        }
    };

    return (
        <div className="space-y-5">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Utilisateurs</h1>
            <p className="text-sm text-gray-500">
                {total} utilisateur{total > 1 ? "s" : ""} dans votre organisation
            </p>
            </div>
            <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: "var(--color-primary)" }}
            >
            <UserPlus size={15} /> Ajouter un utilisateur
            </button>
        </div>

        {/* Barre de recherche + filtre département */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none"
            />
            </div>
            <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700 sm:w-56"
            >
            <option value="">Tous les départements</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                    {["Utilisateur", "Rôle", "Département", "Dernier login", "Statut", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {loading ? (
                    [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-b">
                        <td colSpan={6} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                    </tr>
                    ))
                ) : users.length === 0 ? (
                    <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                        Aucun utilisateur trouvé
                    </td>
                    </tr>
                ) : (
                    users.map((u) => {
                    const rc = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.EMPLOYE;
                    return (
                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                        {/* Utilisateur */}
                        <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                            <Avatar name={`${u.firstName} ${u.lastName}`} active={u.isActive} />
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                {u.firstName} {u.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                                {u.jobTitle && (
                                <p className="text-xs text-gray-400">{u.jobTitle}</p>
                                )}
                            </div>
                            </div>
                        </td>
                        {/* Rôle */}
                        <td className="px-5 py-3">
                            <span
                            className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{ color: rc.color, background: rc.color + "18" }}
                            >
                            {rc.label}
                            </span>
                        </td>
                        {/* Département */}
                        <td className="px-5 py-3 text-xs text-gray-600">
                            {u.department ?? "—"}
                        </td>
                        {/* Dernier login */}
                        <td className="px-5 py-3 text-xs text-gray-500">
                            {u.lastLoginAt
                            ? new Date(u.lastLoginAt).toLocaleDateString("fr-FR")
                            : "Jamais"}
                        </td>
                        {/* Statut */}
                        <td className="px-5 py-3">
                            <span
                            className="text-xs font-medium px-2 py-1 rounded-full"
                            style={u.isActive
                                ? { color: "#166534", background: "#f0fdf4" }
                                : { color: "#9ca3af", background: "#f9fafb" }}
                            >
                            {u.isActive ? "Actif" : "Inactif"}
                            </span>
                        </td>
                        {/* Actions */}
                        <td className="px-5 py-3">
                            <div className="flex items-center gap-1">
                            <ActionBtn
                                icon={<Pencil size={14} />}
                                title="Modifier"
                                onClick={() => setEditUser(u)}
                            />
                            <ActionBtn
                                icon={<Shield size={14} />}
                                title="Changer le rôle"
                                onClick={() => setRoleModal(u)}
                            />
                            {u.isActive ? (
                                <ActionBtn
                                icon={<UserX size={14} />}
                                title="Désactiver"
                                danger
                                onClick={() => handleDeactivate(u)}
                                />
                            ) : (
                                <ActionBtn
                                icon={<UserCheck size={14} />}
                                title="Réactiver"
                                onClick={() => handleActivate(u)}
                                />
                            )}
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
            {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                Page {page} sur {totalPages}
                </p>
                <div className="flex items-center gap-2">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
                >
                    <ChevronLeft size={15} />
                </button>
                <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
                >
                    <ChevronRight size={15} />
                </button>
                </div>
            </div>
            )}
        </div>

        {/* ── Modal Créer utilisateur ── */}
        {showCreate && (
            <CreateUserModal
            onClose={() => setShowCreate(false)}
            onSuccess={() => { setShowCreate(false); load(); }}
            />
        )}

        {/* ── Modal Modifier utilisateur ── */}
        {editUser && (
            <EditUserModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onSuccess={() => { setEditUser(null); load(); }}
            />
        )}

        {/* ── Modal Changer rôle ── */}
        {roleModal && (
            <RoleModal
            user={roleModal}
            processing={processing}
            onClose={() => setRoleModal(null)}
            onConfirm={async (role) => {
                setProcessing(true);
                try {
                await companyService.changeUserRole(roleModal.id, role);
                toast.success("Rôle mis à jour");
                setRoleModal(null);
                load();
                } catch (err) {
                toast.error(getErrorMessage(err, "Erreur"));
                } finally {
                setProcessing(false);
                }
            }}
            />
        )}
        </div>
    );
}

export default function UsersPage() {
    return (
        <Suspense fallback={null}>
        <UsersContent />
        </Suspense>
    );
}

// ── Modal Créer ────────────────────────────────────────

function CreateUserModal({ onClose, onSuccess,}: {
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<CreateForm>({
        resolver: zodResolver(createSchema),
        defaultValues: { role: "EMPLOYE" },
    });

    const onSubmit = async (data: CreateForm): Promise<void> => {
        setLoading(true);
        try {
        await companyService.createUser(data as unknown as Record<string, unknown>);
        toast.success("Utilisateur créé — un email d'invitation lui a été envoyé");
        onSuccess();
        } catch (err) {
        toast.error(getErrorMessage(err, "Erreur création"));
        } finally {
        setLoading(false);
        }
    };

    return (
        <Modal title="Ajouter un utilisateur" onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *" error={errors.firstName?.message}>
                <input {...register("firstName")} placeholder="Jean" className={inp} />
            </Field>
            <Field label="Nom *" error={errors.lastName?.message}>
                <input {...register("lastName")} placeholder="Dupont" className={inp} />
            </Field>
            <Field label="Email *" error={errors.email?.message} colSpan>
                <input {...register("email")} type="email" placeholder="jean@entreprise.com" className={inp} />
            </Field>
            <Field label="Rôle *" error={errors.role?.message}>
                <select {...register("role")} className={inp}>
                <option value="EMPLOYE">Employé</option>
                <option value="MANAGER">Manager</option>
                <option value="RH">RH</option>
                <option value="FINANCE">Finance</option>
                </select>
            </Field>
            <Field label="Poste">
                <input {...register("jobTitle")} placeholder="Chef de projet" className={inp} />
            </Field>
            <Field label="Département" colSpan>
                <select {...register("department")} className={inp}>
                <option value="">Sélectionner</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
            </Field>
            <Field label="Téléphone" colSpan>
                <input {...register("phone")} placeholder="+229 XX XX XX XX" className={inp} />
            </Field>
            </div>

            <div
            className="p-3 rounded-lg text-xs"
            style={{ background: "#f0fdf4", color: "#166534" }}
            >
            Un email d&#39;invitation sera envoyé à l&#39;utilisateur pour qu&#39;il définisse son mot de passe.
            </div>

            <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                Annuler
            </button>
            <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white disabled:opacity-70"
                style={{ background: "var(--color-primary)" }}>
                {loading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Créer l&#39;utilisateur
            </button>
            </div>
        </form>
        </Modal>
    );
}

// ── Modal Modifier ────────────────────────────────────

function EditUserModal({ user, onClose, onSuccess,}: {
    user: UserItem;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);

    const updateSchema = z.object({
        firstName:  z.string().min(1),
        lastName:   z.string().min(1),
        jobTitle:   z.string().optional(),
        department: z.string().optional(),
        phone:      z.string().optional(),
    });

    const { register, handleSubmit } = useForm({
        resolver: zodResolver(updateSchema),
        defaultValues: {
        firstName:  user.firstName,
        lastName:   user.lastName,
        jobTitle:   user.jobTitle ?? "",
        department: user.department ?? "",
        },
    });

    const onSubmit = async (data: unknown): Promise<void> => {
        setLoading(true);
        try {
        await companyService.updateUser(user.id, data as Record<string, unknown>);
        toast.success("Utilisateur mis à jour");
        onSuccess();
        } catch {
        toast.error("Erreur mise à jour");
        } finally {
        setLoading(false);
        }
    };

    return (
        <Modal title={`Modifier — ${user.firstName} ${user.lastName}`} onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom">
                <input {...register("firstName")} className={inp} />
            </Field>
            <Field label="Nom">
                <input {...register("lastName")} className={inp} />
            </Field>
            <Field label="Poste" colSpan>
                <input {...register("jobTitle")} placeholder="Chef de projet" className={inp} />
            </Field>
            <Field label="Département" colSpan>
                <select {...register("department")} className={inp}>
                <option value="">Sélectionner</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
            </Field>
            </div>
            <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                Annuler
            </button>
            <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white disabled:opacity-70"
                style={{ background: "var(--color-primary)" }}>
                {loading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Enregistrer
            </button>
            </div>
        </form>
        </Modal>
    );
}

// ── Modal Rôle ────────────────────────────────────────

function RoleModal({ user, processing, onClose, onConfirm,}: {
    user: UserItem;
    processing: boolean;
    onClose: () => void;
    onConfirm: (role: string) => void;
}) {
    const [selected, setSelected] = useState(user.role);

    return (
        <Modal title={`Rôle — ${user.firstName} ${user.lastName}`} onClose={onClose}>
        <p className="text-sm text-gray-500 mb-4">
            Sélectionnez le nouveau rôle de cet utilisateur.
        </p>
        <div className="space-y-2">
            {Object.entries(ROLE_CONFIG)
            .filter(([key]) => key !== "ADMIN")
            .map(([key, { label, color }]) => (
                <label key={key}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer"
                style={{
                    borderColor: selected === key ? color : "#e5e7eb",
                    background: selected === key ? color + "10" : "white",
                }}>
                <input
                    type="radio"
                    value={key}
                    checked={selected === key}
                    onChange={() => setSelected(key)}
                    style={{ accentColor: color }}
                />
                <span className="text-sm font-medium" style={{ color: selected === key ? color : "#374151" }}>
                    {label}
                </span>
                </label>
            ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
            Annuler
            </button>
            <button
            onClick={() => onConfirm(selected)}
            disabled={processing || selected === user.role}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
            >
            {processing && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Confirmer
            </button>
        </div>
        </Modal>
    );
}

// ── Composants utilitaires ────────────────────────────

const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400 bg-white";

function Avatar({ name, active }: { name: string; active: boolean }) {
    const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#0f766e"];
    const color = colors[name.charCodeAt(0) % colors.length];
    return (
        <div className="relative shrink-0">
        <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: color, opacity: active ? 1 : 0.5 }}
        >
            {initials}
        </div>
        <span
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
            style={{ background: active ? "#10b981" : "#d1d5db" }}
        />
        </div>
    );
}

function Field({
    label, error, children, colSpan = false,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
    colSpan?: boolean;
}) {
    return (
        <div className={colSpan ? "col-span-2" : ""}>
        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
        {children}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

function ActionBtn({ icon, title, onClick, danger = false }: {
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button title={title} onClick={onClick}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            style={{ color: danger ? "#ef4444" : "#6b7280" }}>
            {icon}
        </button>
    );
}

function Modal({ title, children, onClose }: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">{title}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            {children}
        </div>
        </div>
    );
}