"use client";

import { useState, useEffect } from "react";
import {
    Users, Plus, X, Loader2, MapPin, Calendar, AlertCircle,
    CheckCircle2, XCircle, Clock, ChevronRight, Crown,
} from "lucide-react";
import { toast } from "sonner";
import { groupTravelService, GroupTravelInput } from "@/services/employes/group-travel.service";
import { GroupTravel, GroupTravelStatus, GroupTravelParticipant } from "@/types";
import { useAuth } from "@/hooks/useAuth";

const STATUS_CONFIG: Record<GroupTravelStatus, { label: string; color: string }> = {
    DRAFT:     { label: "Brouillon",  color: "bg-gray-100 text-gray-600" },
    OPEN:      { label: "Ouvert",     color: "bg-green-100 text-green-700" },
    CONFIRMED: { label: "Confirmé",   color: "bg-blue-100 text-blue-700" },
    CANCELLED: { label: "Annulé",     color: "bg-red-100 text-red-600" },
    COMPLETED: { label: "Terminé",    color: "bg-purple-100 text-purple-700" },
};

const PARTICIPANT_ICONS: Record<string, React.ReactNode> = {
    CONFIRMED: <CheckCircle2 size={13} className="text-green-500" />,
    DECLINED:  <XCircle size={13} className="text-red-500" />,
    INVITED:   <Clock size={13} className="text-amber-500" />,
    CANCELLED: <XCircle size={13} className="text-gray-400" />,
};

const EMPTY_FORM: GroupTravelInput = {
    title: "", description: "", destination: "",
    departureDate: "", returnDate: "",
    estimatedCost: null, maxParticipants: null,
    currency: "XOF", notes: "",
};

export default function GroupVoyagesPage() {
    const { user } = useAuth();
    const [trips, setTrips]           = useState<GroupTravel[]>([]);
    const [loading, setLoading]       = useState(true);
    const [showForm, setShowForm]     = useState(false);
    const [form, setForm]             = useState<GroupTravelInput>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [selected, setSelected]     = useState<GroupTravel | null>(null);
    const [responding, setResponding] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try { setTrips(await groupTravelService.getAll()); }
        catch { toast.error("Impossible de charger les voyages de groupe"); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await groupTravelService.create(form);
            toast.success("Voyage de groupe créé !");
            setShowForm(false);
            setForm(EMPTY_FORM);
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Erreur lors de la création");
        } finally { setSubmitting(false); }
    };

    const handleRespond = async (tripId: string, accept: boolean) => {
        setResponding(tripId + (accept ? "_yes" : "_no"));
        try {
            await groupTravelService.respond(tripId, accept);
            toast.success(accept ? "Participation confirmée !" : "Invitation refusée");
            load();
            if (selected?.id === tripId) {
                const updated = await groupTravelService.getById(tripId);
                setSelected(updated);
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Erreur");
        } finally { setResponding(null); }
    };

    const myParticipation = (trip: GroupTravel): GroupTravelParticipant | undefined =>
        trip.participants.find(p => p.userId === user?.id);

    const isLeader = (trip: GroupTravel) => trip.leaderId === user?.id;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-100 text-teal-700">
                        <Users size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Voyages de groupe</h1>
                        <p className="text-sm text-gray-500">Organisez et rejoignez des voyages collectifs</p>
                    </div>
                </div>
                <button onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ background: "var(--color-primary)" }}>
                    <Plus size={16} /> Organiser un voyage
                </button>
            </div>

            {/* Formulaire création */}
            {showForm && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-semibold text-gray-900">Nouveau voyage de groupe</h2>
                        <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                            <X size={16} />
                        </button>
                    </div>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Titre *</label>
                                <input required value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                                    placeholder="ex. Séminaire Dakar 2026" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Destination *</label>
                                <input required value={form.destination}
                                    onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                                    placeholder="ex. Dakar, Sénégal" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Date de départ *</label>
                                <input required type="date" value={form.departureDate}
                                    onChange={e => setForm(f => ({ ...f, departureDate: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Date de retour *</label>
                                <input required type="date" value={form.returnDate}
                                    onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Coût estimé (XOF)</label>
                                <input type="number" min={0}
                                    value={form.estimatedCost ?? ""}
                                    onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value ? Number(e.target.value) : null }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Participants max.</label>
                                <input type="number" min={2}
                                    value={form.maxParticipants ?? ""}
                                    onChange={e => setForm(f => ({ ...f, maxParticipants: e.target.value ? Number(e.target.value) : null }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Description / notes</label>
                                <textarea rows={2} value={form.description ?? ""}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none"
                                    placeholder="Objectif du voyage, hébergement prévu, etc." />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                                Annuler
                            </button>
                            <button type="submit" disabled={submitting}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-60"
                                style={{ background: "var(--color-primary)" }}>
                                {submitting && <Loader2 size={14} className="animate-spin" />}
                                Créer le voyage
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Liste des voyages */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
            ) : trips.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
                    <Users size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">Aucun voyage de groupe</p>
                    <p className="text-sm text-gray-400 mt-1">Organisez votre premier voyage collectif ou attendez une invitation.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {trips.map(trip => {
                        const cfg  = STATUS_CONFIG[trip.status];
                        const me   = myParticipation(trip);
                        const lead = isLeader(trip);
                        const confirmed = trip.participants.filter(p => p.status === "CONFIRMED").length;
                        const nights = Math.max(0, Math.round(
                            (new Date(trip.returnDate).getTime() - new Date(trip.departureDate).getTime()) / 86400000
                        ));

                        return (
                            <div key={trip.id}
                                onClick={() => setSelected(trip)}
                                className="bg-white border border-gray-100 rounded-xl p-5 cursor-pointer hover:border-teal-200 hover:shadow-sm transition group">
                                <div className="flex items-start gap-4">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl bg-teal-50">
                                        ✈️
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-sm text-gray-900">{trip.title}</p>
                                            {lead && <span title="Vous êtes l'organisateur"><Crown size={13} className="text-amber-500" /></span>}
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                                            {me && me.status !== "DECLINED" && (
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    {PARTICIPANT_ICONS[me.status]}
                                                    {me.status === "CONFIRMED" ? "Confirmé" : me.status === "INVITED" ? "Invité" : ""}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                                            <span className="flex items-center gap-1"><MapPin size={11} />{trip.destination}</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={11} />
                                                {new Date(trip.departureDate).toLocaleDateString("fr-FR")} · {nights} nuit{nights !== 1 ? "s" : ""}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users size={11} />
                                                {confirmed + 1}/{trip.maxParticipants ?? "∞"} participant{(confirmed + 1) !== 1 ? "s" : ""}
                                            </span>
                                            {trip.estimatedCost && (
                                                <span>~{trip.estimatedCost.toLocaleString("fr-FR")} {trip.currency}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                        {me?.status === "INVITED" && (
                                            <>
                                                <button onClick={() => handleRespond(trip.id, true)}
                                                    disabled={responding === trip.id + "_yes"}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                                                    {responding === trip.id + "_yes"
                                                        ? <Loader2 size={12} className="animate-spin" />
                                                        : <CheckCircle2 size={12} />}
                                                    Accepter
                                                </button>
                                                <button onClick={() => handleRespond(trip.id, false)}
                                                    disabled={responding === trip.id + "_no"}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
                                                    Refuser
                                                </button>
                                            </>
                                        )}
                                        <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Drawer détail */}
            {selected && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setSelected(null)}>
                    <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl"
                        onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-bold text-gray-900">{selected.title}</h2>
                            <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-5 space-y-5">
                            {/* Infos */}
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin size={14} className="text-teal-500 shrink-0" />
                                    <span>{selected.destination}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar size={14} className="text-teal-500 shrink-0" />
                                    <span>
                                        {new Date(selected.departureDate).toLocaleDateString("fr-FR")} →{" "}
                                        {new Date(selected.returnDate).toLocaleDateString("fr-FR")}
                                    </span>
                                </div>
                                {selected.estimatedCost && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <span className="text-teal-500 shrink-0">💰</span>
                                        <span>{selected.estimatedCost.toLocaleString("fr-FR")} {selected.currency} estimés</span>
                                    </div>
                                )}
                                {selected.description && (
                                    <p className="text-gray-500 text-xs leading-relaxed mt-1">{selected.description}</p>
                                )}
                            </div>

                            {/* Organisateur */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Organisateur</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700">
                                        {selected.leader.firstName[0]}{selected.leader.lastName[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selected.leader.firstName} {selected.leader.lastName}
                                        </p>
                                        <p className="text-xs text-gray-400">Organisateur</p>
                                    </div>
                                </div>
                            </div>

                            {/* Participants */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Participants ({selected.participants.length})
                                </p>
                                {selected.participants.length === 0 ? (
                                    <p className="text-xs text-gray-400">Aucun participant invité pour l'instant.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {selected.participants.map(p => (
                                            <div key={p.id} className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                                    {p.user.firstName[0]}{p.user.lastName[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-900">{p.user.firstName} {p.user.lastName}</p>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    {PARTICIPANT_ICONS[p.status]}
                                                    <span>{p.status === "CONFIRMED" ? "Confirmé" : p.status === "INVITED" ? "En attente" : p.status === "DECLINED" ? "Refusé" : "Annulé"}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action si invité */}
                            {myParticipation(selected)?.status === "INVITED" && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                    <p className="text-sm font-medium text-amber-800 mb-3">Vous avez été invité à ce voyage</p>
                                    <div className="flex gap-3">
                                        <button onClick={() => handleRespond(selected.id, true)}
                                            disabled={!!responding}
                                            className="flex-1 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                                            Accepter
                                        </button>
                                        <button onClick={() => handleRespond(selected.id, false)}
                                            disabled={!!responding}
                                            className="flex-1 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
                                            Refuser
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
