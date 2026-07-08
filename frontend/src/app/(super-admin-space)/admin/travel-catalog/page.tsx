"use client";

import { useState, useEffect, useCallback } from "react";
import { Plane, Hotel, Train, Car, MapPin, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import {
    travelCatalogService,
    Airport, FlightRoute, HotelProperty, HotelRoomType, TrainRoute, CarRentalVehicle,
} from "@/services/admin/travel-catalog.service";
import { partnersService } from "@/services/admin/partners.service";
import { Partner } from "@/types";

type TabId = "flights" | "hotels" | "trains" | "cars" | "airports";

function usePartners() {
    const [partners, setPartners] = useState<Partner[]>([]);
    useEffect(() => {
        partnersService.getAll({ status: "ACTIVE", limit: 100 }).then((r) => setPartners(r.partners)).catch(() => {});
    }, []);
    return partners;
}

function PartnerSelect({ value, onChange, partners }: { value: string; onChange: (v: string) => void; partners: Partner[] }) {
    return (
        <div>
            <label className="text-xs font-medium text-gray-600">Partenaire *</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} required
                className="w-full border rounded px-3 py-1.5 text-sm mt-1">
                <option value="">Sélectionner…</option>
                {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
        </div>
    );
}

// ─── Aéroports ──────────────────────────────────────────────────────────────────

function AirportModal({ initial, onClose, onSaved }: { initial?: Airport | null; onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState({
        iataCode: initial?.iataCode ?? "", name: initial?.name ?? "", city: initial?.city ?? "", country: initial?.country ?? "",
    });
    const [error, setError] = useState<string | null>(null);
    const isEdit = !!initial;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            if (isEdit) await travelCatalogService.updateAirport(initial.id, form);
            else await travelCatalogService.createAirport(form);
            onSaved(); onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-gray-900">{isEdit ? "Modifier" : "Ajouter"} un aéroport</h2>
                    <button type="button" onClick={onClose}><X size={18} /></button>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-medium text-gray-600">Code IATA *</label>
                        <input value={form.iataCode} onChange={(e) => setForm((f) => ({ ...f, iataCode: e.target.value.toUpperCase() }))}
                            required maxLength={3} placeholder="LOS" className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Ville *</label>
                        <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                            required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-600">Nom de l&apos;aéroport *</label>
                        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Pays *</label>
                        <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                            required placeholder="NG" className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="text-sm border px-4 py-1.5 rounded hover:bg-gray-50">Annuler</button>
                    <button type="submit" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700">Enregistrer</button>
                </div>
            </form>
        </div>
    );
}

function AirportsTab() {
    const [airports, setAirports] = useState<Airport[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<"create" | Airport | null>(null);

    const load = useCallback(async () => {
        try { setAirports(await travelCatalogService.listAirports()); } finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer cet aéroport ?")) return;
        await travelCatalogService.deleteAirport(id);
        await load();
    };

    return (
        <div>
            {(modal === "create" || (modal && typeof modal === "object")) && (
                <AirportModal initial={modal === "create" ? null : modal} onClose={() => setModal(null)} onSaved={load} />
            )}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-gray-700">Aéroports ({airports.length})</h2>
                <button onClick={() => setModal("create")} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
                    <Plus size={14} /> Ajouter
                </button>
            </div>
            {loading ? <p className="text-sm text-gray-500">Chargement…</p> : (
                <div className="bg-white rounded-xl border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-gray-500 text-xs">
                            <tr><th className="text-left px-4 py-3">Code</th><th className="text-left px-4 py-3">Nom</th><th className="text-left px-4 py-3">Ville</th><th className="text-left px-4 py-3">Pays</th><th className="text-left px-4 py-3">Actions</th></tr>
                        </thead>
                        <tbody>
                            {airports.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucun aéroport</td></tr>
                            ) : airports.map((a) => (
                                <tr key={a.id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{a.iataCode}</td>
                                    <td className="px-4 py-3 text-gray-800">{a.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{a.city}</td>
                                    <td className="px-4 py-3 text-gray-500">{a.country}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => setModal(a)} className="text-gray-500 hover:text-blue-600"><Pencil size={14} /></button>
                                            <button onClick={() => handleDelete(a.id)} className="text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Vols ───────────────────────────────────────────────────────────────────────

function FlightRouteModal({ initial, partners, onClose, onSaved }: {
    initial?: FlightRoute | null; partners: Partner[]; onClose: () => void; onSaved: () => void;
}) {
    const [form, setForm] = useState({
        partnerId: initial?.partnerId ?? "", airlineCode: initial?.airlineCode ?? "",
        originIata: initial?.originIata ?? "", originCity: initial?.originCity ?? "",
        destinationIata: initial?.destinationIata ?? "", destinationCity: initial?.destinationCity ?? "",
        departureTime: initial?.departureTime ?? "08:00", durationMinutes: initial?.durationMinutes ?? 60,
        stops: initial?.stops ?? 0, basePrice: initial ? parseFloat(initial.basePrice) : 0,
        currency: initial?.currency ?? "XOF", isActive: initial?.isActive ?? true,
    });
    const [error, setError] = useState<string | null>(null);
    const isEdit = !!initial;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const body = { ...form, originIata: form.originIata.toUpperCase(), destinationIata: form.destinationIata.toUpperCase(), airlineCode: form.airlineCode.toUpperCase() };
            if (isEdit) await travelCatalogService.updateFlightRoute(initial.id, body);
            else await travelCatalogService.createFlightRoute(body);
            onSaved(); onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-gray-900">{isEdit ? "Modifier" : "Ajouter"} une route aérienne</h2>
                    <button type="button" onClick={onClose}><X size={18} /></button>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <PartnerSelect value={form.partnerId} onChange={(v) => setForm((f) => ({ ...f, partnerId: v }))} partners={partners} />
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-medium text-gray-600">Code compagnie *</label>
                        <input value={form.airlineCode} onChange={(e) => setForm((f) => ({ ...f, airlineCode: e.target.value }))}
                            required maxLength={3} placeholder="KP" className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Heure de départ *</label>
                        <input type="time" value={form.departureTime} onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))}
                            required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Aéroport origine (IATA) *</label>
                        <input value={form.originIata} onChange={(e) => setForm((f) => ({ ...f, originIata: e.target.value }))}
                            required maxLength={3} placeholder="LOS" className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Ville origine *</label>
                        <input value={form.originCity} onChange={(e) => setForm((f) => ({ ...f, originCity: e.target.value }))}
                            required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Aéroport destination (IATA) *</label>
                        <input value={form.destinationIata} onChange={(e) => setForm((f) => ({ ...f, destinationIata: e.target.value }))}
                            required maxLength={3} placeholder="ABV" className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Ville destination *</label>
                        <input value={form.destinationCity} onChange={(e) => setForm((f) => ({ ...f, destinationCity: e.target.value }))}
                            required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Durée (minutes) *</label>
                        <input type="number" min={1} value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value, 10) || 0 }))}
                            required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Escales</label>
                        <input type="number" min={0} value={form.stops} onChange={(e) => setForm((f) => ({ ...f, stops: parseInt(e.target.value, 10) || 0 }))}
                            className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Prix par personne *</label>
                        <input type="number" min={0} value={form.basePrice} onChange={(e) => setForm((f) => ({ ...f, basePrice: parseFloat(e.target.value) || 0 }))}
                            required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Devise</label>
                        <input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
                            maxLength={4} className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                    Actif
                </label>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="text-sm border px-4 py-1.5 rounded hover:bg-gray-50">Annuler</button>
                    <button type="submit" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700">Enregistrer</button>
                </div>
            </form>
        </div>
    );
}

function FlightsTab() {
    const partners = usePartners();
    const [routes, setRoutes] = useState<FlightRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<"create" | FlightRoute | null>(null);

    const load = useCallback(async () => {
        try { setRoutes(await travelCatalogService.listFlightRoutes()); } finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer cette route ?")) return;
        await travelCatalogService.deleteFlightRoute(id);
        await load();
    };

    return (
        <div>
            {(modal === "create" || (modal && typeof modal === "object")) && (
                <FlightRouteModal initial={modal === "create" ? null : modal} partners={partners} onClose={() => setModal(null)} onSaved={load} />
            )}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-gray-700">Routes aériennes ({routes.length})</h2>
                <button onClick={() => setModal("create")} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
                    <Plus size={14} /> Ajouter
                </button>
            </div>
            {loading ? <p className="text-sm text-gray-500">Chargement…</p> : (
                <div className="bg-white rounded-xl border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-gray-500 text-xs">
                            <tr>
                                <th className="text-left px-4 py-3">Compagnie</th><th className="text-left px-4 py-3">Trajet</th>
                                <th className="text-left px-4 py-3">Départ</th><th className="text-left px-4 py-3">Durée</th>
                                <th className="text-left px-4 py-3">Prix</th><th className="text-left px-4 py-3">Actif</th><th className="text-left px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {routes.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucune route</td></tr>
                            ) : routes.map((r) => (
                                <tr key={r.id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-800">{r.partner.name} <span className="text-gray-400 font-mono text-xs">{r.airlineCode}</span></td>
                                    <td className="px-4 py-3 font-mono text-blue-600">{r.originIata} → {r.destinationIata}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.departureTime}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.durationMinutes} min</td>
                                    <td className="px-4 py-3 text-gray-600">{parseFloat(r.basePrice).toLocaleString()} {r.currency}</td>
                                    <td className="px-4 py-3">{r.isActive ? "✅" : "—"}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => setModal(r)} className="text-gray-500 hover:text-blue-600"><Pencil size={14} /></button>
                                            <button onClick={() => handleDelete(r.id)} className="text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Hôtels ─────────────────────────────────────────────────────────────────────

function HotelPropertyModal({ initial, partners, onClose, onSaved }: {
    initial?: HotelProperty | null; partners: Partner[]; onClose: () => void; onSaved: () => void;
}) {
    const [form, setForm] = useState({
        partnerId: initial?.partnerId ?? "", name: initial?.name ?? "", city: initial?.city ?? "",
        country: initial?.country ?? "", address: initial?.address ?? "", starRating: initial?.starRating ?? 3,
        isActive: initial?.isActive ?? true,
    });
    const [error, setError] = useState<string | null>(null);
    const isEdit = !!initial;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            if (isEdit) await travelCatalogService.updateHotelProperty(initial.id, form);
            else await travelCatalogService.createHotelProperty(form);
            onSaved(); onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-gray-900">{isEdit ? "Modifier" : "Ajouter"} un hôtel</h2>
                    <button type="button" onClick={onClose}><X size={18} /></button>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <PartnerSelect value={form.partnerId} onChange={(v) => setForm((f) => ({ ...f, partnerId: v }))} partners={partners} />
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-600">Nom *</label>
                        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Ville *</label>
                        <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                            required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Pays *</label>
                        <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                            required placeholder="BJ" className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-600">Adresse</label>
                        <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                            className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Étoiles</label>
                        <input type="number" min={1} max={5} value={form.starRating} onChange={(e) => setForm((f) => ({ ...f, starRating: parseInt(e.target.value, 10) || 1 }))}
                            className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                    Actif
                </label>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="text-sm border px-4 py-1.5 rounded hover:bg-gray-50">Annuler</button>
                    <button type="submit" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700">Enregistrer</button>
                </div>
            </form>
        </div>
    );
}

function RoomTypeRow({ room, onChanged }: { room: HotelRoomType; onChanged: () => void }) {
    const handleDelete = async () => {
        if (!confirm("Supprimer ce type de chambre ?")) return;
        await travelCatalogService.deleteHotelRoomType(room.id);
        onChanged();
    };
    return (
        <tr className="border-t border-gray-100">
            <td className="px-3 py-2">{room.name}</td>
            <td className="px-3 py-2">{room.capacity} pers.</td>
            <td className="px-3 py-2">{parseFloat(room.pricePerNight).toLocaleString()} {room.currency}</td>
            <td className="px-3 py-2">{room.totalRooms}</td>
            <td className="px-3 py-2"><button onClick={handleDelete} className="text-gray-400 hover:text-red-600"><Trash2 size={12} /></button></td>
        </tr>
    );
}

function AddRoomTypeForm({ hotelId, onAdded }: { hotelId: string; onAdded: () => void }) {
    const [form, setForm] = useState({ name: "", capacity: 2, pricePerNight: 0, totalRooms: 1 });
    const handleAdd = async () => {
        if (!form.name || form.pricePerNight <= 0) return;
        await travelCatalogService.createHotelRoomType({ hotelId, ...form });
        setForm({ name: "", capacity: 2, pricePerNight: 0, totalRooms: 1 });
        onAdded();
    };
    return (
        <tr className="border-t border-gray-100 bg-gray-50">
            <td className="px-3 py-2"><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Chambre Standard" className="w-full border rounded px-2 py-1 text-xs" /></td>
            <td className="px-3 py-2"><input type="number" min={1} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value, 10) || 1 }))} className="w-16 border rounded px-2 py-1 text-xs" /></td>
            <td className="px-3 py-2"><input type="number" min={0} value={form.pricePerNight} onChange={(e) => setForm((f) => ({ ...f, pricePerNight: parseFloat(e.target.value) || 0 }))} className="w-24 border rounded px-2 py-1 text-xs" /></td>
            <td className="px-3 py-2"><input type="number" min={1} value={form.totalRooms} onChange={(e) => setForm((f) => ({ ...f, totalRooms: parseInt(e.target.value, 10) || 1 }))} className="w-16 border rounded px-2 py-1 text-xs" /></td>
            <td className="px-3 py-2"><button onClick={handleAdd} className="text-blue-600 hover:text-blue-800 text-xs font-medium">+ Ajouter</button></td>
        </tr>
    );
}

function HotelsTab() {
    const partners = usePartners();
    const [hotels, setHotels] = useState<HotelProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<"create" | HotelProperty | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    const load = useCallback(async () => {
        try { setHotels(await travelCatalogService.listHotelProperties()); } finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer cet hôtel (et ses types de chambre) ?")) return;
        await travelCatalogService.deleteHotelProperty(id);
        await load();
    };

    return (
        <div>
            {(modal === "create" || (modal && typeof modal === "object")) && (
                <HotelPropertyModal initial={modal === "create" ? null : modal} partners={partners} onClose={() => setModal(null)} onSaved={load} />
            )}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-gray-700">Hôtels ({hotels.length})</h2>
                <button onClick={() => setModal("create")} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
                    <Plus size={14} /> Ajouter
                </button>
            </div>
            {loading ? <p className="text-sm text-gray-500">Chargement…</p> : hotels.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun hôtel.</p>
            ) : (
                <div className="space-y-3">
                    {hotels.map((h) => (
                        <div key={h.id} className="bg-white rounded-xl border overflow-hidden">
                            <div className="flex justify-between items-center p-4">
                                <div>
                                    <p className="font-medium text-gray-800">{h.name}</p>
                                    <p className="text-xs text-gray-500">{h.city}, {h.country} · {h.partner.name} {h.starRating ? `· ${"★".repeat(h.starRating)}` : ""}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setExpanded(expanded === h.id ? null : h.id)} className="text-xs flex items-center gap-1 text-gray-600 border px-2 py-1 rounded hover:bg-gray-50">
                                        {expanded === h.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Chambres ({h.roomTypes.length})
                                    </button>
                                    <button onClick={() => setModal(h)} className="text-gray-500 hover:text-blue-600"><Pencil size={14} /></button>
                                    <button onClick={() => handleDelete(h.id)} className="text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            {expanded === h.id && (
                                <div className="border-t bg-gray-50 px-4 pb-4">
                                    <table className="w-full text-xs mt-2">
                                        <thead><tr className="text-gray-500"><th className="text-left px-3 py-1">Nom</th><th className="text-left px-3 py-1">Capacité</th><th className="text-left px-3 py-1">Prix/nuit</th><th className="text-left px-3 py-1">Chambres</th><th></th></tr></thead>
                                        <tbody>
                                            {h.roomTypes.map((r) => <RoomTypeRow key={r.id} room={r} onChanged={load} />)}
                                            <AddRoomTypeForm hotelId={h.id} onAdded={load} />
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Trains ─────────────────────────────────────────────────────────────────────

function TrainRouteModal({ initial, partners, onClose, onSaved }: {
    initial?: TrainRoute | null; partners: Partner[]; onClose: () => void; onSaved: () => void;
}) {
    const [form, setForm] = useState({
        partnerId: initial?.partnerId ?? "", originCity: initial?.originCity ?? "", originStation: initial?.originStation ?? "",
        destinationCity: initial?.destinationCity ?? "", destinationStation: initial?.destinationStation ?? "",
        departureTime: initial?.departureTime ?? "08:00", durationMinutes: initial?.durationMinutes ?? 60,
        basePrice: initial ? parseFloat(initial.basePrice) : 0, currency: initial?.currency ?? "XOF",
        travelClass: initial?.travelClass ?? "Économique", isActive: initial?.isActive ?? true,
    });
    const [error, setError] = useState<string | null>(null);
    const isEdit = !!initial;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            if (isEdit) await travelCatalogService.updateTrainRoute(initial.id, form);
            else await travelCatalogService.createTrainRoute(form);
            onSaved(); onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-gray-900">{isEdit ? "Modifier" : "Ajouter"} un trajet ferroviaire</h2>
                    <button type="button" onClick={onClose}><X size={18} /></button>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <PartnerSelect value={form.partnerId} onChange={(v) => setForm((f) => ({ ...f, partnerId: v }))} partners={partners} />
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-medium text-gray-600">Ville origine *</label>
                        <input value={form.originCity} onChange={(e) => setForm((f) => ({ ...f, originCity: e.target.value }))} required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Gare origine *</label>
                        <input value={form.originStation} onChange={(e) => setForm((f) => ({ ...f, originStation: e.target.value }))} required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Ville destination *</label>
                        <input value={form.destinationCity} onChange={(e) => setForm((f) => ({ ...f, destinationCity: e.target.value }))} required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Gare destination *</label>
                        <input value={form.destinationStation} onChange={(e) => setForm((f) => ({ ...f, destinationStation: e.target.value }))} required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Heure de départ *</label>
                        <input type="time" value={form.departureTime} onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))} required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Durée (minutes) *</label>
                        <input type="number" min={1} value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value, 10) || 0 }))} required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Classe</label>
                        <input value={form.travelClass} onChange={(e) => setForm((f) => ({ ...f, travelClass: e.target.value }))} className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Prix par personne *</label>
                        <input type="number" min={0} value={form.basePrice} onChange={(e) => setForm((f) => ({ ...f, basePrice: parseFloat(e.target.value) || 0 }))} required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                    Actif
                </label>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="text-sm border px-4 py-1.5 rounded hover:bg-gray-50">Annuler</button>
                    <button type="submit" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700">Enregistrer</button>
                </div>
            </form>
        </div>
    );
}

function TrainsTab() {
    const partners = usePartners();
    const [routes, setRoutes] = useState<TrainRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<"create" | TrainRoute | null>(null);

    const load = useCallback(async () => {
        try { setRoutes(await travelCatalogService.listTrainRoutes()); } finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer ce trajet ?")) return;
        await travelCatalogService.deleteTrainRoute(id);
        await load();
    };

    return (
        <div>
            {(modal === "create" || (modal && typeof modal === "object")) && (
                <TrainRouteModal initial={modal === "create" ? null : modal} partners={partners} onClose={() => setModal(null)} onSaved={load} />
            )}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-gray-700">Trajets ferroviaires ({routes.length})</h2>
                <button onClick={() => setModal("create")} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
                    <Plus size={14} /> Ajouter
                </button>
            </div>
            {loading ? <p className="text-sm text-gray-500">Chargement…</p> : (
                <div className="bg-white rounded-xl border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-gray-500 text-xs">
                            <tr>
                                <th className="text-left px-4 py-3">Opérateur</th><th className="text-left px-4 py-3">Trajet</th>
                                <th className="text-left px-4 py-3">Classe</th><th className="text-left px-4 py-3">Prix</th>
                                <th className="text-left px-4 py-3">Actif</th><th className="text-left px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {routes.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucun trajet</td></tr>
                            ) : routes.map((r) => (
                                <tr key={r.id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-800">{r.partner.name}</td>
                                    <td className="px-4 py-3 text-blue-600">{r.originCity} → {r.destinationCity}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.travelClass}</td>
                                    <td className="px-4 py-3 text-gray-600">{parseFloat(r.basePrice).toLocaleString()} {r.currency}</td>
                                    <td className="px-4 py-3">{r.isActive ? "✅" : "—"}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => setModal(r)} className="text-gray-500 hover:text-blue-600"><Pencil size={14} /></button>
                                            <button onClick={() => handleDelete(r.id)} className="text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Location de véhicules ───────────────────────────────────────────────────────

function CarRentalVehicleModal({ initial, partners, onClose, onSaved }: {
    initial?: CarRentalVehicle | null; partners: Partner[]; onClose: () => void; onSaved: () => void;
}) {
    const [form, setForm] = useState({
        partnerId: initial?.partnerId ?? "", category: initial?.category ?? "Économique", brand: initial?.brand ?? "",
        model: initial?.model ?? "", city: initial?.city ?? "", country: initial?.country ?? "",
        pricePerDay: initial ? parseFloat(initial.pricePerDay) : 0, currency: initial?.currency ?? "XOF",
        seats: initial?.seats ?? 5, transmission: initial?.transmission ?? "MANUELLE", isActive: initial?.isActive ?? true,
    });
    const [error, setError] = useState<string | null>(null);
    const isEdit = !!initial;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            if (isEdit) await travelCatalogService.updateCarRentalVehicle(initial.id, form);
            else await travelCatalogService.createCarRentalVehicle(form);
            onSaved(); onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-gray-900">{isEdit ? "Modifier" : "Ajouter"} un véhicule</h2>
                    <button type="button" onClick={onClose}><X size={18} /></button>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <PartnerSelect value={form.partnerId} onChange={(v) => setForm((f) => ({ ...f, partnerId: v }))} partners={partners} />
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-medium text-gray-600">Marque *</label>
                        <input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Modèle *</label>
                        <input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Catégorie</label>
                        <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full border rounded px-3 py-1.5 text-sm mt-1">
                            {["Économique", "Compacte", "SUV", "Luxe", "Utilitaire"].map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Transmission</label>
                        <select value={form.transmission} onChange={(e) => setForm((f) => ({ ...f, transmission: e.target.value }))} className="w-full border rounded px-3 py-1.5 text-sm mt-1">
                            <option value="MANUELLE">Manuelle</option>
                            <option value="AUTOMATIQUE">Automatique</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Ville *</label>
                        <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Pays *</label>
                        <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} required placeholder="CI" className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Places</label>
                        <input type="number" min={1} value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: parseInt(e.target.value, 10) || 1 }))} className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600">Prix par jour *</label>
                        <input type="number" min={0} value={form.pricePerDay} onChange={(e) => setForm((f) => ({ ...f, pricePerDay: parseFloat(e.target.value) || 0 }))} required className="w-full border rounded px-3 py-1.5 text-sm mt-1" />
                    </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                    Actif
                </label>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="text-sm border px-4 py-1.5 rounded hover:bg-gray-50">Annuler</button>
                    <button type="submit" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700">Enregistrer</button>
                </div>
            </form>
        </div>
    );
}

function CarsTab() {
    const partners = usePartners();
    const [vehicles, setVehicles] = useState<CarRentalVehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<"create" | CarRentalVehicle | null>(null);

    const load = useCallback(async () => {
        try { setVehicles(await travelCatalogService.listCarRentalVehicles()); } finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer ce véhicule ?")) return;
        await travelCatalogService.deleteCarRentalVehicle(id);
        await load();
    };

    return (
        <div>
            {(modal === "create" || (modal && typeof modal === "object")) && (
                <CarRentalVehicleModal initial={modal === "create" ? null : modal} partners={partners} onClose={() => setModal(null)} onSaved={load} />
            )}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-gray-700">Véhicules ({vehicles.length})</h2>
                <button onClick={() => setModal("create")} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
                    <Plus size={14} /> Ajouter
                </button>
            </div>
            {loading ? <p className="text-sm text-gray-500">Chargement…</p> : (
                <div className="bg-white rounded-xl border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-gray-500 text-xs">
                            <tr>
                                <th className="text-left px-4 py-3">Agence</th><th className="text-left px-4 py-3">Véhicule</th>
                                <th className="text-left px-4 py-3">Ville</th><th className="text-left px-4 py-3">Prix/jour</th>
                                <th className="text-left px-4 py-3">Actif</th><th className="text-left px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucun véhicule</td></tr>
                            ) : vehicles.map((v) => (
                                <tr key={v.id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-800">{v.partner.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{v.brand} {v.model} <span className="text-xs text-gray-400">({v.category})</span></td>
                                    <td className="px-4 py-3 text-gray-600">{v.city}</td>
                                    <td className="px-4 py-3 text-gray-600">{parseFloat(v.pricePerDay).toLocaleString()} {v.currency}</td>
                                    <td className="px-4 py-3">{v.isActive ? "✅" : "—"}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => setModal(v)} className="text-gray-500 hover:text-blue-600"><Pencil size={14} /></button>
                                            <button onClick={() => handleDelete(v.id)} className="text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Page principale ────────────────────────────────────────────────────────────

export default function TravelCatalogPage() {
    const [tab, setTab] = useState<TabId>("flights");

    const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
        { id: "flights",  label: "Vols",                  icon: Plane },
        { id: "hotels",   label: "Hôtels",                icon: Hotel },
        { id: "trains",   label: "Trains",                icon: Train },
        { id: "cars",     label: "Location de voitures",  icon: Car },
        { id: "airports", label: "Aéroports",              icon: MapPin },
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Plane size={24} className="text-blue-600" />
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Catalogue Voyage</h1>
                    <p className="text-sm text-gray-500">Vols, hôtels, trains et location de véhicules disponibles à la recherche</p>
                </div>
            </div>

            <div className="flex gap-1 mb-6 border-b overflow-x-auto">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setTab(id)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 -mb-px whitespace-nowrap ${tab === id ? "border-blue-600 text-blue-600 font-medium" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                        <Icon size={14} /> {label}
                    </button>
                ))}
            </div>

            {tab === "flights"  && <FlightsTab />}
            {tab === "hotels"   && <HotelsTab />}
            {tab === "trains"   && <TrainsTab />}
            {tab === "cars"     && <CarsTab />}
            {tab === "airports" && <AirportsTab />}
        </div>
    );
}
