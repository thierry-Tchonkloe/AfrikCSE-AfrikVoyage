"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, X, LayoutGrid, List, Copy } from "lucide-react";
import { adminService } from "@/services/admin/admin.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

interface PendingOrg {
    id: string;
    name: string;
    businessEmail: string;
    country: string;
    size: string;
    createdAt: string;
    users: Array<{ firstName: string; lastName: string }>;
}

interface ValidateModalState {
    org: PendingOrg;
    hasCSE: boolean;
    hasVoyage: boolean;
}

export default function ValidationsPage() {
    const router = useRouter();
    const [orgs, setOrgs]           = useState<PendingOrg[]>([]);
    const [loading, setLoading]     = useState(true);
    const [view, setView]           = useState<"grid" | "list">("grid");
    const [validateModal, setValidateModal] = useState<ValidateModalState | null>(null);
    const [rejectModal, setRejectModal]   = useState<PendingOrg | null>(null);
    const [rejectNote, setRejectNote]     = useState("");
    const [processing, setProcessing]     = useState(false);
    const [invitationLink, setInvitationLink] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
        const res = await adminService.getPendingOrganizations();
        setOrgs(res.data);
        } catch {
        toast.error("Erreur chargement");
        } finally {
        setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleValidate = async () => {
        if (!validateModal) return;
        setProcessing(true);
        try {
        const res = await adminService.validateOrganization(validateModal.org.id, {
            hasCSE: validateModal.hasCSE,
            hasVoyage: validateModal.hasVoyage,
        });
        setInvitationLink(res.invitationLink);
        toast.success("Organisation validée !");
        load();
        } catch (err) {
        toast.error(getErrorMessage(err, "Erreur validation"));
        } finally {
        setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectModal || !rejectNote.trim()) return;
        setProcessing(true);
        try {
        await adminService.rejectOrganization(rejectModal.id, rejectNote);
        toast.success("Organisation rejetée");
        setRejectModal(null);
        setRejectNote("");
        load();
        } catch {
        toast.error("Erreur");
        } finally {
        setProcessing(false);
        }
    };

    const copyLink = async () => {
        if (!invitationLink) return;
        await navigator.clipboard.writeText(invitationLink);
        toast.success("Lien copié !");
    };

    return (
        <div className="space-y-5">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
            <h1 className="text-xl font-bold text-gray-900">Demandes d&#39;inscription</h1>
            <p className="text-sm text-gray-500">
                Gérez les demandes en attente de validation
            </p>
            </div>
            <div className="flex items-center gap-2">
            <span
                className="text-sm font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: "#fef3c7", color: "#92400e" }}
            >
                Total en attente : {orgs.length}
            </span>
            {/* Basculer vue */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                onClick={() => setView("grid")}
                className="p-2 transition-colors"
                style={view === "grid"
                    ? { background: "var(--color-primary)", color: "white" }
                    : { color: "#6b7280" }}
                >
                <LayoutGrid size={16} />
                </button>
                <button
                onClick={() => setView("list")}
                className="p-2 transition-colors"
                style={view === "list"
                    ? { background: "var(--color-primary)", color: "white" }
                    : { color: "#6b7280" }}
                >
                <List size={16} />
                </button>
            </div>
            </div>
        </div>

        {/* Contenu */}
        {loading ? (
            <div className={view === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
            : "space-y-3"}>
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 h-48 animate-pulse" />
            ))}
            </div>
        ) : orgs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">Aucune demande en attente</p>
            </div>
        ) : view === "grid" ? (
            // ── Vue grille ──
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orgs.map((org) => (
                <OrgCard
                key={org.id}
                org={org}
                onValidate={() => setValidateModal({ org, hasCSE: false, hasVoyage: false })}
                onReject={() => setRejectModal(org)}
                onView={() => router.push(`/admin/companies/${org.id}`)}
                />
            ))}
            </div>
        ) : (
            // ── Vue liste ──
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                    {["Entreprise", "Responsable", "Pays", "Taille", "Date", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {orgs.map((org) => (
                    <tr key={org.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                        <OrgAvatar name={org.name} />
                        <div>
                            <p className="text-sm font-medium text-gray-900">{org.name}</p>
                            <p className="text-xs text-gray-500">{org.businessEmail}</p>
                        </div>
                        </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                        {org.users[0]
                        ? `${org.users[0].firstName} ${org.users[0].lastName}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{org.country}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{org.size || "—"}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                        {new Date(org.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3">
                        <div className="flex gap-2">
                        <button
                            onClick={() => setValidateModal({ org, hasCSE: false, hasVoyage: false })}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-white"
                            style={{ background: "#10b981" }}
                        >
                            <Check size={13} /> Approuver
                        </button>
                        <button
                            onClick={() => setRejectModal(org)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-white bg-red-500"
                        >
                            <X size={13} /> Refuser
                        </button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}

        {/* ── Modal Validation ── */}
        {validateModal && !invitationLink && (
            <Modal title={`Valider — ${validateModal.org.name}`}
            onClose={() => setValidateModal(null)}>
            <p className="text-sm text-gray-500 mb-4">
                Sélectionnez les modules à activer pour cette organisation.
            </p>
            {[
                { field: "hasCSE" as const, label: "AfrikCSE" },
                { field: "hasVoyage" as const, label: "AfrikVoyage" },
            ].map((mod) => (
                <label key={mod.field}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 mb-2">
                <input
                    type="checkbox"
                    checked={validateModal[mod.field]}
                    onChange={(e) =>
                    setValidateModal({ ...validateModal, [mod.field]: e.target.checked })
                    }
                    className="w-4 h-4"
                    style={{ accentColor: "var(--color-primary)" }}
                />
                <span className="text-sm font-medium text-gray-900">{mod.label}</span>
                </label>
            ))}
            <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setValidateModal(null)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                Annuler
                </button>
                <button
                onClick={handleValidate}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white disabled:opacity-70"
                style={{ background: "#10b981" }}
                >
                {processing && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Valider et générer le lien
                </button>
            </div>
            </Modal>
        )}

        {/* ── Lien d'invitation généré ── */}
        {invitationLink && (
            <Modal title="Lien d'activation généré" onClose={() => {
            setInvitationLink(null);
            setValidateModal(null);
            }}>
            <p className="text-sm text-gray-500 mb-3">
                Envoyez ce lien à l&#39;administrateur de l&#39;entreprise.
                Il est valable <strong>7 jours</strong>.
            </p>
            <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                <p className="text-xs font-mono text-gray-700 flex-1 truncate">{invitationLink}</p>
                <button onClick={copyLink}
                className="p-2 rounded hover:bg-gray-100"
                style={{ color: "var(--color-primary)" }}>
                <Copy size={15} />
                </button>
            </div>
            <button
                onClick={() => { setInvitationLink(null); setValidateModal(null); }}
                className="w-full mt-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "var(--color-primary)" }}
            >
                Terminé
            </button>
            </Modal>
        )}

        {/* ── Modal Rejet ── */}
        {rejectModal && (
            <Modal title={`Refuser — ${rejectModal.name}`}
            onClose={() => { setRejectModal(null); setRejectNote(""); }}>
            <p className="text-sm text-gray-500 mb-3">
                Précisez la raison du refus. Elle sera communiquée à l&#39;entreprise.
            </p>
            <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={4}
                placeholder="Ex: Documents manquants, secteur non éligible..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => { setRejectModal(null); setRejectNote(""); }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                Annuler
                </button>
                <button
                onClick={handleReject}
                disabled={processing || rejectNote.trim().length < 10}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white bg-red-500 disabled:opacity-50"
                >
                {processing && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Confirmer le refus
                </button>
            </div>
            </Modal>
        )}
        </div>
    );
    }

    // ── Composants ──

    function OrgCard({ org, onValidate, onReject, onView }: {
    org: PendingOrg;
    onValidate: () => void;
    onReject: () => void;
    onView: () => void;
    }) {
    const admin = org.users[0];
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-start gap-3">
            <OrgAvatar name={org.name} />
            <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{org.name}</p>
            <p className="text-xs text-gray-500 truncate">{org.businessEmail}</p>
            </div>
        </div>
        <div className="space-y-1.5 text-sm">
            <Row label="Responsable"
            value={admin ? `${admin.firstName} ${admin.lastName}` : "—"} />
            <Row label="Date d'inscription"
            value={new Date(org.createdAt).toLocaleDateString("fr-FR")} />
            <Row label="Nombre d'employés" value={org.size || "—"} />
            <Row label="Pays" value={org.country} />
        </div>
        <div className="flex gap-2 pt-1">
            <button
            onClick={onValidate}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: "#10b981" }}
            >
            <Check size={14} /> Approuver
            </button>
            <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white text-sm font-medium bg-red-500"
            >
            <X size={14} /> Refuser
            </button>
        </div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-xs">
            <span className="text-gray-500">{label} :</span>
            <span className="font-medium text-gray-900">{value}</span>
        </div>
    );
}

function OrgAvatar({ name }: { name: string }) {
    const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#0f766e"];
    const color = colors[name.charCodeAt(0) % colors.length];
    return (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: color }}>
            {initials}
        </div>
    );
}

function Modal({ title, children, onClose }: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
            </button>
            </div>
            {children}
        </div>
        </div>
    );
}