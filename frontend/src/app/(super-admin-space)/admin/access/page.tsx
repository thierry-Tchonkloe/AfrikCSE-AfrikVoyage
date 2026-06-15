"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, X, Save, ShieldCheck, UserCog, Power, PowerOff } from "lucide-react";
import { usersService, HostUser } from "@/services/admin/users.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    SUPER_ADMIN: { label: "Super Admin", color: "#ef4444" },
    MANAGER:     { label: "Manager",     color: "#6366f1" },
    ADMIN:       { label: "Admin",       color: "#6366f1" },
};

function roleMeta(role: string) {
    return ROLE_LABELS[role] ?? { label: role, color: "#6b7280" };
}

const emptyForm = { firstName: "", lastName: "", email: "" };

export default function AccessManagementPage() {
    const { user: me } = useAuth();
    const [users, setUsers]     = useState<HostUser[]>([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm]       = useState(emptyForm);
    const [saving, setSaving]   = useState(false);

    const [actingId, setActingId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const data = await usersService.getHostUsers();
            setUsers(data);
        } catch {
            toast.error("Erreur chargement des accès");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
            toast.error("Veuillez remplir tous les champs");
            return;
        }
        setSaving(true);
        try {
            await usersService.create({ ...form, role: "MANAGER" });
            toast.success("Membre invité — un email d'activation lui a été envoyé");
            setModalOpen(false);
            setForm(emptyForm);
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la création"));
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (user: HostUser) => {
        if (user.id === me?.id) {
            toast.error("Vous ne pouvez pas modifier votre propre accès");
            return;
        }
        setActingId(user.id);
        try {
            if (user.isActive) {
                await usersService.deactivate(user.id);
                toast.success("Accès désactivé");
            } else {
                await usersService.activate(user.id);
                toast.success("Accès réactivé");
            }
            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)));
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        } finally {
            setActingId(null);
        }
    };

    return (
        <div className="space-y-5">
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Gestion des accès</h1>
                    <p className="text-sm text-gray-500">
                        Super Administrateurs et Managers de la plateforme Waxeho
                    </p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ background: "var(--color-primary)" }}
                >
                    <Plus size={15} /> Inviter un membre
                </button>
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase">
                                <th className="px-5 py-3 font-medium">Utilisateur</th>
                                <th className="px-5 py-3 font-medium">Rôle</th>
                                <th className="px-5 py-3 font-medium">Statut</th>
                                <th className="px-5 py-3 font-medium">Dernière connexion</th>
                                <th className="px-5 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i} className="border-b border-gray-50">
                                        <td colSpan={5} className="px-5 py-4">
                                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                                        Aucun membre trouvé
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const role = roleMeta(user.role);
                                    const isMe = user.id === me?.id;
                                    return (
                                        <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                                        style={{ background: "var(--color-primary)" }}
                                                    >
                                                        {user.firstName[0]}{user.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {user.firstName} {user.lastName}
                                                            {isMe && <span className="text-xs text-gray-400 ml-1">(vous)</span>}
                                                        </p>
                                                        <p className="text-xs text-gray-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded"
                                                    style={{ color: role.color, background: role.color + "18" }}
                                                >
                                                    {user.role === "SUPER_ADMIN" ? <ShieldCheck size={12} /> : <UserCog size={12} />}
                                                    {role.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className="text-xs font-medium px-2 py-1 rounded"
                                                    style={user.isActive
                                                        ? { color: "#10b981", background: "#10b98118" }
                                                        : { color: "#ef4444", background: "#ef444418" }}
                                                >
                                                    {user.isActive ? "Actif" : "Désactivé"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-gray-500">
                                                {user.lastLoginAt
                                                    ? new Date(user.lastLoginAt).toLocaleString("fr-FR", {
                                                        day: "2-digit", month: "2-digit", year: "numeric",
                                                        hour: "2-digit", minute: "2-digit",
                                                    })
                                                    : <span className="text-gray-400">Jamais connecté</span>}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() => handleToggleActive(user)}
                                                    disabled={isMe || actingId === user.id}
                                                    title={isMe ? "Vous ne pouvez pas modifier votre propre accès" : undefined}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-40 disabled:cursor-not-allowed ${
                                                        user.isActive
                                                            ? "border-red-200 text-red-500 hover:bg-red-50"
                                                            : "border-green-200 text-green-600 hover:bg-green-50"
                                                    }`}
                                                >
                                                    {actingId === user.id ? (
                                                        <Loader2 size={13} className="animate-spin" />
                                                    ) : user.isActive ? (
                                                        <PowerOff size={13} />
                                                    ) : (
                                                        <Power size={13} />
                                                    )}
                                                    {user.isActive ? "Désactiver" : "Réactiver"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Modal invitation ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl" style={{ width: "440px", maxWidth: "100%" }}>
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">Inviter un membre</h3>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-xs text-gray-500">
                                Le membre sera ajouté avec le rôle <strong>Manager</strong> et recevra
                                un email pour définir son mot de passe.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Prénom *</label>
                                    <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inp} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                                    <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inp} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                                    Annuler
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white disabled:opacity-70"
                                    style={{ background: "var(--color-primary)" }}
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Envoyer l&apos;invitation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400 bg-white text-gray-900";
