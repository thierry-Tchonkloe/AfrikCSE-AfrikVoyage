"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, UserX, X, Loader2, Users, Shield, User } from "lucide-react";
import { partnerPortalService } from "@/services/partner/partner-portal.service";
import { PartnerUser } from "@/types";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

interface StaffForm {
    email:     string;
    firstName: string;
    lastName:  string;
    password:  string;
}

const EMPTY_FORM: StaffForm = { email: "", firstName: "", lastName: "", password: "" };

export default function PartnerStaffPage() {
    const { user }                        = usePartnerAuth();
    const [staff, setStaff]               = useState<PartnerUser[]>([]);
    const [loading, setLoading]           = useState(true);
    const [showModal, setShowModal]       = useState(false);
    const [form, setForm]                 = useState<StaffForm>(EMPTY_FORM);
    const [saving, setSaving]             = useState(false);
    const [deactivating, setDeactivating] = useState<string | null>(null);

    const isAdmin = user?.role === "PARTNER_ADMIN";

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setStaff(await partnerPortalService.listStaff());
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur de chargement"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleInvite = async () => {
        if (!form.email.trim() || !form.firstName.trim() || !form.lastName.trim() || form.password.length < 8) {
            toast.error("Tous les champs sont requis (mot de passe min. 8 caractères)");
            return;
        }
        setSaving(true);
        try {
            const created = await partnerPortalService.createStaff(form);
            setStaff((prev) => [created, ...prev]);
            setShowModal(false);
            setForm(EMPTY_FORM);
            toast.success("Membre invité avec succès");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de l'invitation"));
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (member: PartnerUser) => {
        if (!confirm(`Désactiver ${member.firstName} ${member.lastName} ?`)) return;
        setDeactivating(member.id);
        try {
            await partnerPortalService.deactivateStaff(member.id);
            setStaff((prev) => prev.map((s) => s.id === member.id ? { ...s, isActive: false } : s));
            toast.success("Membre désactivé");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        } finally {
            setDeactivating(null);
        }
    };

    const active   = staff.filter((s) => s.isActive);
    const inactive = staff.filter((s) => !s.isActive);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Équipe</h1>
                    <p className="text-xs text-gray-500 mt-0.5">{active.length} membre{active.length !== 1 ? "s" : ""} actif{active.length !== 1 ? "s" : ""}</p>
                </div>
                {isAdmin && (
                    <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition">
                        <Plus size={16} /> Inviter
                    </button>
                )}
            </div>

            {!isAdmin && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                    Seuls les administrateurs partenaires peuvent gérer l'équipe.
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : (
                <>
                    {/* Membres actifs */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <h2 className="font-semibold text-sm text-gray-900 dark:text-white">Membres actifs</h2>
                        </div>
                        {active.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                Aucun membre actif
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {active.map((member) => (
                                    <MemberRow key={member.id} member={member}
                                        onDeactivate={isAdmin ? handleDeactivate : undefined}
                                        deactivating={deactivating === member.id} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Membres inactifs */}
                    {inactive.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden opacity-70">
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="font-semibold text-sm text-gray-500">Membres désactivés ({inactive.length})</h2>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {inactive.map((member) => (
                                    <MemberRow key={member.id} member={member} deactivating={false} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal invitation */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-gray-900 dark:text-white">Inviter un membre</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <F label="Prénom *">
                                    <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                                        className="inp" placeholder="Jean" />
                                </F>
                                <F label="Nom *">
                                    <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                                        className="inp" placeholder="Dupont" />
                                </F>
                            </div>
                            <F label="Email *">
                                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                    className="inp" placeholder="jean.dupont@email.com" />
                            </F>
                            <F label="Mot de passe provisoire *">
                                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                    className="inp" placeholder="Min. 8 caractères" />
                            </F>
                            <p className="text-xs text-gray-400">Le membre sera créé avec le rôle <strong>Staff</strong>. Il pourra se connecter au portail avec ces identifiants.</p>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">
                                Annuler
                            </button>
                            <button onClick={handleInvite} disabled={saving}
                                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Inviter"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .inp {
                    width: 100%; padding: 0.5rem 0.75rem; font-size: 0.875rem;
                    border-radius: 0.75rem; border: 1px solid #e5e7eb;
                    background: white; outline: none; transition: border-color 0.15s;
                }
                .inp:focus { border-color: #2563eb; }
                :global(.dark) .inp { background: #1f2937; border-color: #374151; color: white; }
            `}</style>
        </div>
    );
}

function MemberRow({ member, onDeactivate, deactivating }: {
    member:       PartnerUser;
    onDeactivate?: (m: PartnerUser) => void;
    deactivating: boolean;
}) {
    const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
    const isAdmin  = member.role === "PARTNER_ADMIN";

    return (
        <div className="px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                {initials}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {member.firstName} {member.lastName}
                    </p>
                    {isAdmin
                        ? <Shield size={12} className="text-blue-500" />
                        : <User   size={12} className="text-gray-400" />}
                </div>
                <p className="text-xs text-gray-400 truncate">{member.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isAdmin ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                }`}>
                    {isAdmin ? "Admin" : "Staff"}
                </span>
                {member.isActive && onDeactivate && (
                    <button onClick={() => onDeactivate(member)} disabled={deactivating}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition">
                        {deactivating ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                    </button>
                )}
            </div>
        </div>
    );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
            {children}
        </div>
    );
}
