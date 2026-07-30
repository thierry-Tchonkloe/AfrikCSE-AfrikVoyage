"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Layers, Eye, MapPin, Ticket, Users, Star, CalendarClock, Package } from "lucide-react";
import { partnersService } from "@/services/admin/partners.service";
import { CatalogItem } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const OFFER_TYPE_LABELS: Record<string, string> = {
    VOUCHER: "Bon d'achat",
    BOOKING: "Réservation",
    DISCOUNT_CODE: "Code de réduction",
};

export default function PendingPartnerOffersPage() {
    const router = useRouter();
    const [offers, setOffers]   = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailTarget, setDetailTarget] = useState<CatalogItem | null>(null);
    const [rejectTarget, setRejectTarget] = useState<CatalogItem | null>(null);
    const [rejectNote, setRejectNote]     = useState("");
    const [processing, setProcessing]     = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setOffers(await partnersService.getPendingOffers());
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur de chargement"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleApprove = async (offer: CatalogItem) => {
        setProcessing(offer.id);
        try {
            await partnersService.approveOffer(offer.id);
            toast.success("Offre validée — visible par les employés");
            setOffers((prev) => prev.filter((o) => o.id !== offer.id));
            setDetailTarget((prev) => (prev?.id === offer.id ? null : prev));
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de la validation"));
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async () => {
        if (!rejectTarget || rejectNote.trim().length < 10) return;
        setProcessing(rejectTarget.id);
        try {
            await partnersService.rejectOffer(rejectTarget.id, rejectNote);
            toast.success("Offre refusée");
            setOffers((prev) => prev.filter((o) => o.id !== rejectTarget.id));
            setDetailTarget((prev) => (prev?.id === rejectTarget.id ? null : prev));
            setRejectTarget(null);
            setRejectNote("");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors du refus"));
        } finally {
            setProcessing(null);
        }
    };

    const fmt = (v: number) => new Intl.NumberFormat("fr-FR").format(v);

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Offres partenaires à valider</h1>
                <p className="text-sm text-gray-500">
                    Une offre créée ou modifiée par un partenaire reste invisible du catalogue tant qu&#39;elle n&#39;a pas été validée ici.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                    <Loader2 size={24} className="animate-spin mr-2" /> Chargement…
                </div>
            ) : offers.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Layers className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">Aucune offre en attente</p>
                    <p className="text-xs text-gray-400 mt-1">Toutes les offres soumises par les partenaires ont été traitées.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {offers.map((o) => (
                        <div key={o.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                            <div className="flex items-start gap-3">
                                {o.partner?.logoUrl ? (
                                    <img src={o.partner.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                                ) : (
                                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                                        {(o.partner?.name ?? "?")[0].toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <button onClick={() => setDetailTarget(o)} className="font-semibold text-gray-900 truncate hover:underline text-left block w-full">
                                        {o.title}
                                    </button>
                                    <button
                                        onClick={() => o.partner && router.push(`/admin/partners/${o.partner.id}`)}
                                        className="text-xs text-gray-500 hover:underline truncate"
                                    >
                                        {o.partner?.name ?? "Partenaire inconnu"}
                                    </button>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 shrink-0">
                                    En attente
                                </span>
                            </div>

                            {o.imageUrl && (
                                <img src={o.imageUrl} alt="" className="w-full h-32 object-cover rounded-lg" />
                            )}

                            {o.description && (
                                <p className="text-xs text-gray-500 line-clamp-2">{o.description}</p>
                            )}

                            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                                <p className="font-bold text-gray-900">
                                    {fmt(o.employeePrice)} <span className="text-xs font-normal text-gray-400">XOF employé</span>
                                </p>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{o.category}</span>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => setDetailTarget(o)}
                                    title="Voir les détails"
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-gray-600 text-sm font-medium border border-gray-200 hover:bg-gray-50"
                                >
                                    <Eye size={14} />
                                </button>
                                <button
                                    onClick={() => handleApprove(o)}
                                    disabled={processing === o.id}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60"
                                    style={{ background: "#10b981" }}
                                >
                                    {processing === o.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Valider
                                </button>
                                <button
                                    onClick={() => setRejectTarget(o)}
                                    disabled={processing === o.id}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white text-sm font-medium bg-red-500 disabled:opacity-60"
                                >
                                    <X size={14} /> Refuser
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal détails */}
            {detailTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3 min-w-0">
                                {detailTarget.partner?.logoUrl ? (
                                    <img src={detailTarget.partner.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                                        {(detailTarget.partner?.name ?? "?")[0].toUpperCase()}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">{detailTarget.title}</h3>
                                    <button
                                        onClick={() => detailTarget.partner && router.push(`/admin/partners/${detailTarget.partner.id}`)}
                                        className="text-xs text-gray-500 hover:underline truncate"
                                    >
                                        {detailTarget.partner?.name ?? "Partenaire inconnu"}
                                    </button>
                                </div>
                            </div>
                            <button onClick={() => setDetailTarget(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                                <X size={18} />
                            </button>
                        </div>

                        {detailTarget.imageUrl && (
                            <img src={detailTarget.imageUrl} alt="" className="w-full h-40 object-cover rounded-lg mb-4" />
                        )}

                        {detailTarget.description && (
                            <p className="text-sm text-gray-600 mb-4">{detailTarget.description}</p>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                            <DetailRow label="Prix employé" value={`${fmt(detailTarget.employeePrice)} XOF`} />
                            <DetailRow label="Prix entreprise" value={`${fmt(detailTarget.companyPrice)} XOF`} />
                            <DetailRow label="Catégorie" value={detailTarget.category} />
                            <DetailRow label="Type d'offre" value={OFFER_TYPE_LABELS[detailTarget.offerType] ?? detailTarget.offerType} />
                            <DetailRow label="Subvention" value={detailTarget.subsidyAmount ? `${fmt(detailTarget.subsidyAmount)} XOF` : `${detailTarget.subsidyPct} %`} />
                            {detailTarget.stock != null && <DetailRow label="Stock" value={String(detailTarget.stock)} icon={<Package size={12} />} />}
                            {detailTarget.validUntil && <DetailRow label="Valide jusqu'au" value={new Date(detailTarget.validUntil).toLocaleDateString("fr-FR")} icon={<CalendarClock size={12} />} />}
                            {(detailTarget.city || detailTarget.region || detailTarget.country) && (
                                <DetailRow label="Localisation" value={[detailTarget.city, detailTarget.region, detailTarget.country].filter(Boolean).join(", ")} icon={<MapPin size={12} />} />
                            )}
                            {detailTarget.requiresTicket && <DetailRow label="Ticket requis" value="Oui" icon={<Ticket size={12} />} />}
                            {detailTarget.requiresFamilyMember && <DetailRow label="Membre famille requis" value="Oui" icon={<Users size={12} />} />}
                            {detailTarget.isFeatured && <DetailRow label="Mise en avant" value="Oui" icon={<Star size={12} />} />}
                        </div>

                        <p className="text-xs text-gray-400 mb-4">
                            Soumise le {new Date(detailTarget.createdAt).toLocaleDateString("fr-FR")}
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleApprove(detailTarget)}
                                disabled={processing === detailTarget.id}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-60"
                                style={{ background: "#10b981" }}
                            >
                                {processing === detailTarget.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Valider
                            </button>
                            <button
                                onClick={() => setRejectTarget(detailTarget)}
                                disabled={processing === detailTarget.id}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white text-sm font-medium bg-red-500 disabled:opacity-60"
                            >
                                <X size={14} /> Refuser
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal refus */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-gray-900">Refuser — {rejectTarget.title}</h3>
                            <button onClick={() => { setRejectTarget(null); setRejectNote(""); }} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                            Précisez la raison du refus. Elle sera communiquée au partenaire.
                        </p>
                        <textarea
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            rows={4}
                            placeholder="Ex: Prix incohérent, catégorie non éligible..."
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none resize-none"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => { setRejectTarget(null); setRejectNote(""); }}
                                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                                Annuler
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing === rejectTarget.id || rejectNote.trim().length < 10}
                                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white bg-red-500 disabled:opacity-50"
                            >
                                {processing === rejectTarget.id && <Loader2 size={14} className="animate-spin" />}
                                Confirmer le refus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div>
            <p className="flex items-center gap-1 text-xs text-gray-400">{icon}{label}</p>
            <p className="font-medium text-gray-900">{value}</p>
        </div>
    );
}
