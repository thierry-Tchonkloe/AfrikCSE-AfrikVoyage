"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, X, Loader2, MapPin, Clock, ExternalLink } from "lucide-react";
import { partnerPortalService, AvailabilitySlot } from "@/services/partner/partner-portal.service";
import { PartnerLocation } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { LocationViewToggle, LocationViewMode } from "@/components/partner-portal/LocationViewToggle";
import { LocationCard, locationCardVariants } from "@/components/partner-portal/LocationCard";
import { useTranslations } from "next-intl";


type Translator = ReturnType<typeof useTranslations<"partner.locations">>;

type LocationForm = Omit<PartnerLocation, "id" | "partnerId" | "createdAt" | "updatedAt" | "availabilities" | "latitude" | "longitude" | "phone" | "mapsUrl"> & {
    latitude?: number;
    longitude?: number;
    phone?: string;
    mapsUrl?: string;
};

const EMPTY_LOC: LocationForm = { name: "", address: "", city: "", country: "Bénin", isMain: false };

const getDays = (tr: Translator) => ([tr("mon"), tr("tue"), tr("wed"), tr("thu"), tr("fri"), tr("sat"), tr("sun")]);

const EMPTY_SLOTS: AvailabilitySlot[] = Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i + 1,
    openTime:  "08:00",
    closeTime: "18:00",
    isClosed:  i >= 5, // Sam–Dim fermé par défaut
}));

export default function PartnerLocationsPage() {
    const tr = useTranslations("partner.locations");
    const DAYS = useMemo(() => getDays(tr), [tr]);
    const t = useTranslations("partner.locations");
    const [locations, setLocations]       = useState<PartnerLocation[]>([]);
    const [loading, setLoading]           = useState(true);
    const [showLocModal, setShowLocModal] = useState(false);
    const [showAvailModal, setShowAvailModal] = useState(false);
    const [editing, setEditing]           = useState<PartnerLocation | null>(null);
    const [form, setForm]                 = useState<LocationForm>(EMPTY_LOC);
    const [slots, setSlots]               = useState<AvailabilitySlot[]>(EMPTY_SLOTS);
    const [savingLoc, setSavingLoc]       = useState(false);
    const [savingAvail, setSavingAvail]   = useState(false);
    const [deleting, setDeleting]         = useState<string | null>(null);
    const [selectedLocId, setSelectedLocId] = useState<string | null>(null);
    const [viewMode, setViewMode]         = useState<LocationViewMode>("grid");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setLocations(await partnerPortalService.listLocations());
        } catch (err) {
            toast.error(getErrorMessage(err, t("loadingError")));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_LOC);
        setShowLocModal(true);
    };

    const openEdit = (loc: PartnerLocation) => {
        setEditing(loc);
        setForm({ name: loc.name, address: loc.address, city: loc.city, country: loc.country, isMain: loc.isMain,
                  latitude: loc.latitude != null ? Number(loc.latitude) : undefined,
                  longitude: loc.longitude != null ? Number(loc.longitude) : undefined,
                  mapsUrl: loc.mapsUrl ?? undefined,
                  phone: loc.phone ?? undefined });
        setShowLocModal(true);
    };

    const openAvailabilities = (loc: PartnerLocation) => {
        setSelectedLocId(loc.id);
        const existing = loc.availabilities ?? [];
        setSlots(DAYS.map((_, i) => {
            const day = i + 1;
            const found = existing.find((a) => a.dayOfWeek === day);
            return found
                ? { dayOfWeek: day, openTime: found.openTime, closeTime: found.closeTime, isClosed: found.isClosed }
                : { dayOfWeek: day, openTime: "08:00", closeTime: "18:00", isClosed: i >= 5 };
        }));
        setShowAvailModal(true);
    };

    const handleSaveLoc = async () => {
        if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
            toast.error(t("nameAddressCityRequired")); return;
        }
        setSavingLoc(true);
        try {
            if (editing) {
                const updated = await partnerPortalService.updateLocation(editing.id, form);
                setLocations((prev) => prev.map((l) => l.id === editing.id ? { ...l, ...updated } : l));
                toast.success(t("locationUpdated"));
            } else {
                const created = await partnerPortalService.createLocation(form);
                setLocations((prev) => [...prev, created]);
                toast.success(t("locationCreated"));
            }
            setShowLocModal(false);
        } catch (err) {
            toast.error(getErrorMessage(err, t("error")));
        } finally {
            setSavingLoc(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("deleteLocation"))) return;
        setDeleting(id);
        try {
            await partnerPortalService.deleteLocation(id);
            setLocations((prev) => prev.filter((l) => l.id !== id));
            toast.success(t("deleted"));
        } catch (err) {
            toast.error(getErrorMessage(err, t("error")));
        } finally {
            setDeleting(null);
        }
    };

    const handleSaveAvail = async () => {
        if (!selectedLocId) return;
        setSavingAvail(true);
        try {
            await partnerPortalService.setAvailabilities(selectedLocId, slots);
            toast.success(t("openingHoursSaved"));
            setShowAvailModal(false);
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, t("error")));
        } finally {
            setSavingAvail(false);
        }
    };

    const updateSlot = (idx: number, patch: Partial<AvailabilitySlot>) =>
        setSlots((prev) => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("locations")}</h1>
                    <p className="text-xs text-gray-500 mt-0.5">{t("location", { length: locations.length, p2: locations.length !== 1 ? "s" : "" })}</p>
                </div>
                <div className="flex items-center gap-2">
                    <LocationViewToggle mode={viewMode} onChange={setViewMode} />
                    <button onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition">
                        <Plus size={16} /> {t("add")}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : locations.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <MapPin className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">{t("noLocations")}</p>
                    <button onClick={openCreate}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl transition">
                        {t("addLocation")}
                    </button>
                </div>
            ) : viewMode === "grid" ? (
                <motion.div
                    variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                    initial="hidden"
                    animate="show"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                >
                    {locations.map((loc) => (
                        <LocationCard
                            key={loc.id}
                            location={loc}
                            deleting={deleting === loc.id}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onAvailabilities={openAvailabilities}
                        />
                    ))}
                </motion.div>
            ) : (
                <motion.div
                    variants={{ show: { transition: { staggerChildren: 0.04 } } }}
                    initial="hidden"
                    animate="show"
                    className="space-y-3"
                >
                    {locations.map((loc) => (
                        <motion.div key={loc.id} variants={locationCardVariants} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                        <MapPin className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{loc.name}</p>
                                            {loc.isMain && (
                                                <span className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                                                    {t("main")}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">{loc.address}, {loc.city}, {loc.country}</p>
                                        {loc.phone && <p className="text-xs text-gray-400">{loc.phone}</p>}
                                        {loc.mapsUrl && (
                                            <a href={loc.mapsUrl} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5">
                                                {t("viewGoogleMaps")} <ExternalLink size={11} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                    <button onClick={() => openAvailabilities(loc)}
                                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title={t("openingHours")}>
                                        <Clock size={15} />
                                    </button>
                                    <button onClick={() => openEdit(loc)}
                                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                                        <Pencil size={15} />
                                    </button>
                                    <button onClick={() => handleDelete(loc.id)} disabled={deleting === loc.id}
                                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition">
                                        {deleting === loc.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                    </button>
                                </div>
                            </div>

                            {loc.availabilities && loc.availabilities.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {DAYS.map((d, i) => {
                                        const avail = loc.availabilities!.find((a) => a.dayOfWeek === i + 1);
                                        const open  = avail && !avail.isClosed;
                                        return (
                                            <span key={d} className={`text-xs px-2 py-0.5 rounded-full ${
                                                open
                                                    ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                                    : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                                            }`}>
                                                {d}{open ? ` ${avail!.openTime}–${avail!.closeTime}` : ""}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Modal — Établissement */}
            {showLocModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-gray-900 dark:text-white">
                                {editing ? t("editLocation") : t("newLocation")}
                            </h2>
                            <button onClick={() => setShowLocModal(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <F label={t("name")}>
                                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    className="inp" placeholder={t("locationName")} />
                            </F>
                            <F label={t("address")}>
                                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                                    className="inp" placeholder={t("streetNumber")} />
                            </F>
                            <div className="grid grid-cols-2 gap-3">
                                <F label={t("city")}>
                                    <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                                        className="inp" placeholder={t("cotonou")} />
                                </F>
                                <F label={t("country")}>
                                    <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                                        className="inp" />
                                </F>
                            </div>
                            <F label={t("phone")}>
                                <input value={form.phone ?? ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                    className="inp" placeholder="+229…" />
                            </F>
                            <F label={t("googleMapsLink")}>
                                <input type="url" value={form.mapsUrl ?? ""} onChange={(e) => setForm((f) => ({ ...f, mapsUrl: e.target.value }))}
                                    className="inp" placeholder="https://maps.app.goo.gl/…" />
                            </F>
                            <div className="grid grid-cols-2 gap-3">
                                <F label={t("latitude")}>
                                    <input type="number" step="any" min={-90} max={90} value={form.latitude ?? ""}
                                        onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value ? parseFloat(e.target.value) : undefined }))}
                                        className="inp" placeholder="6.3703" />
                                </F>
                                <F label={t("longitude")}>
                                    <input type="number" step="any" min={-180} max={180} value={form.longitude ?? ""}
                                        onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value ? parseFloat(e.target.value) : undefined }))}
                                        className="inp" placeholder="2.3912" />
                                </F>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isMain}
                                    onChange={(e) => setForm((f) => ({ ...f, isMain: e.target.checked }))}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{t("mainLocation")}</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setShowLocModal(false)}
                                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">
                                {t("cancel")}
                            </button>
                            <button onClick={handleSaveLoc} disabled={savingLoc}
                                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition">
                                {savingLoc ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal — Horaires */}
            {showAvailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-gray-900 dark:text-white">{t("openingHours2")}</h2>
                            <button onClick={() => setShowAvailModal(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {slots.map((slot, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <label className="flex items-center gap-1.5 w-10 shrink-0 cursor-pointer">
                                        <input type="checkbox" checked={!slot.isClosed}
                                            onChange={(e) => updateSlot(idx, { isClosed: !e.target.checked })}
                                            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600" />
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{DAYS[idx]}</span>
                                    </label>
                                    <input type="time" value={slot.openTime} disabled={slot.isClosed}
                                        onChange={(e) => updateSlot(idx, { openTime: e.target.value })}
                                        className="inp-sm flex-1 disabled:opacity-40" />
                                    <span className="text-xs text-gray-400">–</span>
                                    <input type="time" value={slot.closeTime} disabled={slot.isClosed}
                                        onChange={(e) => updateSlot(idx, { closeTime: e.target.value })}
                                        className="inp-sm flex-1 disabled:opacity-40" />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setShowAvailModal(false)}
                                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">
                                {t("cancel")}
                            </button>
                            <button onClick={handleSaveAvail} disabled={savingAvail}
                                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition">
                                {savingAvail ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
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
                .inp-sm {
                    padding: 0.35rem 0.5rem; font-size: 0.75rem;
                    border-radius: 0.5rem; border: 1px solid #e5e7eb;
                    background: white; outline: none;
                }
                .inp-sm:focus { border-color: #2563eb; }
                :global(.dark) .inp, :global(.dark) .inp-sm {
                    background: #1f2937; border-color: #374151; color: white;
                }
            `}</style>
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
