"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Clock, CheckCircle, XCircle, History, Paperclip } from "lucide-react";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

interface BenefitRequest {
    id: string;
    amount: number;
    description: string | null;
    receipts: string[];
    urgency: string;
    status: string;
    createdAt: string;
    category: { id: string; name: string; icon: string | null };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    PENDING:   { label: "En attente",  color: "#f59e0b", bg: "#fffbeb", icon: Clock },
    APPROVED:  { label: "Approuvé",    color: "#10b981", bg: "#f0fdf4", icon: CheckCircle },
    REJECTED:  { label: "Rejeté",      color: "#ef4444", bg: "#fef2f2", icon: XCircle },
    CANCELLED: { label: "Annulé",      color: "#6b7280", bg: "#f9fafb", icon: XCircle },
};

const URGENCY_OPTIONS: Record<string, { label: string; color: string }> = {
    LOW:    { label: "Faible", color: "#10b981" },
    MEDIUM: { label: "Normal", color: "#f59e0b" },
    HIGH:   { label: "Urgent", color: "#ef4444" },
};

export default function MesDemandesPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<BenefitRequest[]>([]);
    const [loading, setLoading]   = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const reqs = await employeeService.getMyBenefitRequests();
            setRequests(reqs);
        } catch {
            toast.error("Erreur de chargement des demandes");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleCancel = async (id: string) => {
        try {
            await employeeService.cancelBenefitRequest(id);
            toast.success("Demande annulée");
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, "Impossible d'annuler"));
        }
    };

    return (
        <div className="space-y-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <button onClick={() => router.push("/employes/avantages")}
                    className="hover:underline flex items-center gap-1">
                    <ChevronLeft size={14} /> Mes avantages
                </button>
                <span>/</span>
                <span className="text-gray-900">Mes demandes</span>
            </div>

            <div>
                <h1 className="text-xl font-bold text-gray-900">Mes demandes d&apos;avantages</h1>
                <p className="text-sm text-gray-500">Suivez le statut de vos demandes de remboursement CSE</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-6 space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="py-16 text-center text-gray-500">
                        <History size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Aucune demande d&apos;avantage</p>
                        <p className="text-xs mt-1">Vos demandes soumises depuis le catalogue apparaîtront ici</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                {["Catégorie", "Montant", "Priorité", "Justificatif", "Date", "Statut", "Action"].map((h) => (
                                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((req) => {
                                const st = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.PENDING;
                                const StatusIcon = st.icon;
                                const urg = URGENCY_OPTIONS[req.urgency];
                                return (
                                    <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{req.category.icon ?? "🎁"}</span>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{req.category.name}</p>
                                                    {req.description && (
                                                        <p className="text-xs text-gray-500 truncate max-w-48">{req.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                                            {req.amount.toLocaleString()} XOF
                                        </td>
                                        <td className="px-5 py-3">
                                            {urg && (
                                                <span
                                                    className="text-xs font-medium px-2 py-1 rounded-full"
                                                    style={{ color: urg.color, background: urg.color + "18" }}
                                                >
                                                    {urg.label}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            {req.receipts.length > 0 ? (
                                                <a
                                                    href={req.receipts[0]}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs hover:underline"
                                                    style={{ color: "#0f766e" }}
                                                >
                                                    <Paperclip size={12} /> Voir
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-xs text-gray-500">
                                            {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span
                                                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                                                style={{ color: st.color, background: st.bg }}
                                            >
                                                <StatusIcon size={11} /> {st.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            {req.status === "PENDING" && (
                                                <button
                                                    onClick={() => handleCancel(req.id)}
                                                    className="text-xs text-red-500 hover:text-red-700 hover:underline"
                                                >
                                                    Annuler
                                                </button>
                                            )}
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
