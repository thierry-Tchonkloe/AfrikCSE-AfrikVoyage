"use client";

import { useState, useEffect } from "react";
import { Ticket as TicketIcon, CheckCircle2, XCircle, Clock, Ban, Loader2 } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { ticketsService } from "@/services/employes/tickets.service";
import { Ticket, TicketStatus } from "@/types";

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: React.ReactNode }> = {
    VALID:     { label: "Valide",    color: "bg-green-100 text-green-700",  icon: <CheckCircle2 size={13} /> },
    USED:      { label: "Utilisé",   color: "bg-gray-100 text-gray-500",    icon: <CheckCircle2 size={13} /> },
    CANCELLED: { label: "Annulé",    color: "bg-red-100 text-red-600",      icon: <Ban size={13} /> },
    EXPIRED:   { label: "Expiré",    color: "bg-amber-100 text-amber-600",  icon: <Clock size={13} /> },
};

export default function TicketsPage() {
    const [tickets, setTickets]       = useState<Ticket[]>([]);
    const [loading, setLoading]       = useState(true);
    const [selected, setSelected]     = useState<Ticket | null>(null);
    const [cancelling, setCancelling] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const data = await ticketsService.getMyTickets();
            setTickets(data);
        } catch {
            toast.error("Impossible de charger vos tickets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCancel = async (id: string) => {
        setCancelling(id);
        try {
            await ticketsService.cancel(id);
            toast.success("Ticket annulé");
            if (selected?.id === id) setSelected(null);
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Annulation impossible");
        } finally {
            setCancelling(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
                    <TicketIcon size={22} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Mes tickets</h1>
                    <p className="text-sm text-gray-500">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
            ) : tickets.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
                    <TicketIcon size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">Aucun ticket généré</p>
                    <p className="text-sm text-gray-400 mt-1">Accédez à une offre du catalogue pour obtenir votre ticket.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {tickets.map(t => {
                        const cfg = STATUS_CONFIG[t.status];
                        return (
                            <div
                                key={t.id}
                                onClick={() => setSelected(t)}
                                className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-indigo-200 hover:shadow-sm transition"
                            >
                                <div className="flex items-start gap-3">
                                    {t.offer?.imageUrl ? (
                                        <img src={t.offer.imageUrl} alt=""
                                            className="w-12 h-12 rounded-lg object-cover shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                            <TicketIcon size={20} className="text-indigo-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-gray-900 truncate">
                                            {t.offer?.title ?? "Offre"}
                                        </p>
                                        {t.offer?.partner && (
                                            <p className="text-xs text-gray-400 truncate">{t.offer.partner.name}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                                                {cfg.icon} {cfg.label}
                                            </span>
                                            <span className="text-xs font-mono text-gray-400">{t.code}</span>
                                        </div>
                                        {t.familyMember && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                Pour : {t.familyMember.firstName} {t.familyMember.lastName}
                                            </p>
                                        )}
                                        {t.expiresAt && (
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Expire le {new Date(t.expiresAt).toLocaleDateString("fr-FR")}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {t.status === "VALID" && (
                                    <button
                                        onClick={e => { e.stopPropagation(); handleCancel(t.id); }}
                                        disabled={cancelling === t.id}
                                        className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                                    >
                                        {cancelling === t.id
                                            ? <Loader2 size={12} className="animate-spin" />
                                            : <XCircle size={12} />
                                        }
                                        Annuler ce ticket
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal QR */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setSelected(null)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center"
                        onClick={e => e.stopPropagation()}>
                        <p className="font-bold text-gray-900 text-lg mb-1">{selected.offer?.title ?? "Ticket"}</p>
                        <p className="text-sm text-gray-500 mb-5">
                            {selected.offer?.partner?.name ?? ""}
                            {selected.familyMember && ` · Pour ${selected.familyMember.firstName}`}
                        </p>
                        <div className="flex justify-center mb-5 p-4 bg-gray-50 rounded-xl">
                            <QRCode value={selected.qrPayload} size={180} />
                        </div>
                        <p className="font-mono text-sm tracking-widest text-gray-500 mb-2">{selected.code}</p>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-5 ${STATUS_CONFIG[selected.status].color}`}>
                            {STATUS_CONFIG[selected.status].icon}
                            {STATUS_CONFIG[selected.status].label}
                        </div>
                        {selected.expiresAt && (
                            <p className="text-xs text-gray-400 mb-4">
                                Valide jusqu&apos;au {new Date(selected.expiresAt).toLocaleDateString("fr-FR")}
                            </p>
                        )}
                        <button onClick={() => setSelected(null)}
                            className="w-full py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                            Fermer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
