"use client";

import { useEffect, useState, useCallback } from "react";
import { Heart, Upload, CheckCircle, XCircle, Clock, Loader2, Image as ImageIcon, X } from "lucide-react";
import { eventPhotosService } from "@/services/employes/event-photos.service";
import { employeeService } from "@/services/employes/employee.service";
import { EventPhoto, PhotoStatus } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const STATUS_ICON: Record<PhotoStatus, React.ReactNode> = {
    PENDING:  <Clock    size={12} className="text-amber-500" />,
    APPROVED: <CheckCircle size={12} className="text-green-500" />,
    REJECTED: <XCircle  size={12} className="text-red-400" />,
};

interface CalEvent { id: string; title: string; startDate: string; icon: string | null }

export default function GaleriePage() {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "SUPER_ADMIN";

    const [events, setEvents]   = useState<CalEvent[]>([]);
    const [activeEvent, setActiveEvent] = useState<string | null>(null);
    const [photos, setPhotos]   = useState<EventPhoto[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [pendingCount, setPendingCount]   = useState(0);
    const [lightbox, setLightbox] = useState<EventPhoto | null>(null);

    // Upload form
    const [showUpload, setShowUpload] = useState(false);
    const [uploadUrl, setUploadUrl]   = useState("");
    const [uploadCaption, setUploadCaption] = useState("");
    const [uploading, setUploading]   = useState(false);

    const now = new Date();

    const loadEvents = useCallback(async () => {
        setLoadingEvents(true);
        try {
            const data = await employeeService.getRecentEvents();
            setEvents(data);
            if (data.length > 0) setActiveEvent(data[0].id);
        } catch {
            toast.error("Erreur chargement des événements");
        } finally {
            setLoadingEvents(false);
        }
    }, []);

    const loadPhotos = useCallback(async (eventId: string) => {
        setLoadingPhotos(true);
        try {
            const data = await eventPhotosService.getByEvent(eventId);
            setPhotos(data);
        } catch {
            toast.error("Erreur chargement des photos");
        } finally {
            setLoadingPhotos(false);
        }
    }, []);

    const loadPendingCount = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const count = await eventPhotosService.getPendingCount();
            setPendingCount(count);
        } catch { /* ignore */ }
    }, [isAdmin]);

    useEffect(() => { loadEvents(); loadPendingCount(); }, [loadEvents, loadPendingCount]);
    useEffect(() => { if (activeEvent) loadPhotos(activeEvent); }, [activeEvent, loadPhotos]);

    const handleToggleLike = async (photo: EventPhoto) => {
        try {
            const res = await eventPhotosService.toggleLike(photo.id);
            setPhotos((prev) => prev.map((p) =>
                p.id === photo.id ? { ...p, _count: { likes: res.count } } : p
            ));
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        }
    };

    const handleModerate = async (photo: EventPhoto, status: "APPROVED" | "REJECTED") => {
        try {
            await eventPhotosService.moderate(photo.id, status);
            setPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, status } : p));
            toast.success(status === "APPROVED" ? "Photo approuvée" : "Photo rejetée");
            loadPendingCount();
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        }
    };

    const handleDelete = async (photo: EventPhoto) => {
        if (!confirm("Supprimer cette photo ?")) return;
        try {
            await eventPhotosService.remove(photo.id);
            setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
            toast.success("Photo supprimée");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur"));
        }
    };

    const handleUpload = async () => {
        if (!uploadUrl.trim() || !activeEvent) {
            toast.error("URL de la photo requise");
            return;
        }
        setUploading(true);
        try {
            const photo = await eventPhotosService.upload({
                eventId: activeEvent,
                url: uploadUrl.trim(),
                caption: uploadCaption.trim() || undefined,
            });
            setPhotos((prev) => [photo, ...prev]);
            setShowUpload(false);
            setUploadUrl("");
            setUploadCaption("");
            toast.success("Photo soumise en attente de validation");
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur lors de l'envoi"));
        } finally {
            setUploading(false);
        }
    };

    const activeEventTitle = events.find((e) => e.id === activeEvent)?.title;

    return (
        <div className="space-y-5">
            {/* En-tête */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Galerie des événements</h1>
                    <p className="text-sm text-gray-500">Photos partagées par la communauté</p>
                </div>
                <div className="flex items-center gap-2">
                    {isAdmin && pendingCount > 0 && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            {pendingCount} photo{pendingCount > 1 ? "s" : ""} en attente
                        </span>
                    )}
                    {activeEvent && (
                        <button
                            onClick={() => setShowUpload(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                            style={{ background: "var(--color-primary)" }}
                        >
                            <Upload size={14} /> Ajouter une photo
                        </button>
                    )}
                </div>
            </div>

            {/* Sélecteur d'événement */}
            {loadingEvents ? (
                <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-8 w-28 bg-gray-100 rounded-full animate-pulse" />
                    ))}
                </div>
            ) : events.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">
                    Aucun événement récent trouvé.
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {events.map((ev) => (
                        <button
                            key={ev.id}
                            onClick={() => setActiveEvent(ev.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                            style={activeEvent === ev.id
                                ? { background: "var(--color-primary)", color: "white" }
                                : { background: "#f3f4f6", color: "#6b7280" }}
                        >
                            {ev.icon && <span>{ev.icon}</span>}
                            {ev.title}
                            <span className="opacity-60">
                                · {new Date(ev.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Grille photos */}
            {loadingPhotos ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : photos.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <ImageIcon size={36} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-400">
                        {activeEvent
                            ? "Aucune photo pour cet événement. Soyez le premier à en partager !"
                            : "Sélectionnez un événement."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {photos.map((photo) => (
                        <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={photo.url}
                                alt={photo.caption ?? "Photo événement"}
                                className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                                onClick={() => setLightbox(photo)}
                            />

                            {/* Overlay status pour admin */}
                            {isAdmin && photo.status !== "APPROVED" && (
                                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 text-xs font-medium">
                                    {STATUS_ICON[photo.status]}
                                    {photo.status === "PENDING" ? "En attente" : "Rejeté"}
                                </div>
                            )}

                            {/* Actions sur hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 gap-1">
                                {photo.caption && (
                                    <p className="text-white text-xs line-clamp-2">{photo.caption}</p>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-white text-xs">
                                        {photo.uploader.firstName}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {isAdmin && photo.status === "PENDING" && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleModerate(photo, "APPROVED"); }}
                                                    className="p-1 rounded bg-green-500/80 hover:bg-green-500 text-white"
                                                    title="Approuver"
                                                >
                                                    <CheckCircle size={12} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleModerate(photo, "REJECTED"); }}
                                                    className="p-1 rounded bg-red-500/80 hover:bg-red-500 text-white"
                                                    title="Rejeter"
                                                >
                                                    <XCircle size={12} />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggleLike(photo); }}
                                            className="flex items-center gap-0.5 px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-xs"
                                        >
                                            <Heart size={11} />
                                            {photo._count.likes > 0 && <span>{photo._count.likes}</span>}
                                        </button>
                                        {(isAdmin || photo.uploadedBy === user?.id) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                                                className="p-1 rounded bg-red-500/80 hover:bg-red-500 text-white"
                                                title="Supprimer"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setLightbox(null)}
                >
                    <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={lightbox.url}
                            alt={lightbox.caption ?? "Photo"}
                            className="max-h-[80vh] max-w-full rounded-xl object-contain"
                        />
                        {lightbox.caption && (
                            <p className="text-white text-sm text-center mt-3">{lightbox.caption}</p>
                        )}
                        <p className="text-white/60 text-xs text-center mt-1">
                            Partagé par {lightbox.uploader.firstName} {lightbox.uploader.lastName}
                        </p>
                        <button
                            onClick={() => setLightbox(null)}
                            className="absolute -top-3 -right-3 p-1.5 rounded-full bg-white text-gray-700 hover:bg-gray-100"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal upload */}
            {showUpload && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <h3 className="font-bold text-gray-900 mb-4">
                            Ajouter une photo — {activeEventTitle}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">URL de la photo *</label>
                                <input
                                    value={uploadUrl}
                                    onChange={(e) => setUploadUrl(e.target.value)}
                                    placeholder="https://…/photo.jpg"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Légende (optionnelle)</label>
                                <input
                                    value={uploadCaption}
                                    onChange={(e) => setUploadCaption(e.target.value)}
                                    placeholder="Une description de la photo…"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                                />
                            </div>
                            <p className="text-xs text-gray-400">
                                Les photos sont soumises à validation avant publication.
                            </p>
                        </div>
                        <div className="flex gap-2 mt-5">
                            <button
                                onClick={() => setShowUpload(false)}
                                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="flex-1 py-2 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-70"
                                style={{ background: "var(--color-primary)" }}
                            >
                                {uploading && <Loader2 size={14} className="animate-spin" />}
                                Soumettre
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
