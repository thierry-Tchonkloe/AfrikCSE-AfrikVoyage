"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Search, Plane, Hotel, Train, Car, Filter, ChevronLeft, ChevronRight, MapPin, Loader2, X, Users, Briefcase } from "lucide-react";
import { flightsService, AirportOption, FlightOffer, FlightLeg } from "@/services/employes/flights.service";
import { hotelsService, HotelOffer } from "@/services/employes/hotels.service";
import { trainsService, TrainOffer } from "@/services/employes/trains.service";
import { carRentalsService, CarRentalOffer } from "@/services/employes/car-rentals.service";
import { bookingService } from "@/services/employes/booking.service";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useOptionLabel } from "@/hooks/useOptionLabel";
import { useDateLocale } from "@/hooks/useDateLocale";

interface TravelContext {
    id: string;
    destination: string;
    departureDate: string;
    returnDate: string;
}

// Bandeau de contexte affiché quand la réservation est liée à un voyage d'affaires approuvé.
function TravelContextBanner({ travel }: { travel: TravelContext }) {
    const dateLocale = useDateLocale();
    const tr = useTranslations("employee.reserver");
    return (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}>
            <Briefcase size={15} className="shrink-0" />
            <span>
                {tr("bookingLinkedTrip")} <strong>{travel.destination}</strong> {tr("from", { p1: new Date(travel.departureDate).toLocaleDateString(dateLocale), p2: new Date(travel.returnDate).toLocaleDateString(dateLocale) })}
            </span>
        </div>
    );
}

type TabType = "Flights" | "Hotels" | "Trains" | "Car Rental";
type PaymentMethod = "WALLET" | "MOBILE_MONEY" | "CARD";

const STOPS = ["Direct", "1 Stop", "2+ Stops"];
const TIMES = ["Morning (6AM – 12PM)", "Afternoon (12PM – 6PM)", "Evening (6PM – 12AM)"];
const PAGE_SIZE = 5;
const DEFAULT_MAX_PRICE = 500000;

const stopsLabel = (stops: number) => (stops === 0 ? "Direct" : stops === 1 ? "1 Stop" : "2+ Stops");

const timeBucket = (time: string) => {
    const hour = parseInt(time.split(":")[0] ?? "0", 10);
    if (hour < 12) return TIMES[0]!;
    if (hour < 18) return TIMES[1]!;
    return TIMES[2]!;
};

const durationToMinutes = (d: string) => {
    const h = d.match(/(\d+)h/);
    const m = d.match(/(\d+)m/);
    return (h ? parseInt(h[1]!, 10) * 60 : 0) + (m ? parseInt(m[1]!, 10) : 0);
};

// Nombre de nuits/jours entre deux dates ISO "YYYY-MM-DD" (minimum 1).
const diffDays = (endDate: string, startDate: string): number => {
    const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(1, Math.round(ms / 86400000));
};

// Convertit une date "YYYY-MM-DD" en ISO complet (minuit UTC) — requis par le validateur bookingDate du backend.
const toIsoMidnight = (dateStr: string): string => new Date(`${dateStr}T00:00:00`).toISOString();

function PaymentMethodField({ value, onChange }: { value: PaymentMethod; onChange: (v: PaymentMethod) => void }) {
    const tr = useTranslations("employee.reserver");
    // Mobile Money / Carte bancaire ne débitent encore rien réellement côté
    // serveur (aucune passerelle branchée) — désactivés ici le temps de coder
    // l'intégration, plutôt que de laisser créer une réservation gratuite.
    const OPTIONS: { id: PaymentMethod; label: string; disabled?: boolean }[] = [
        { id: "WALLET",       label: tr("wallet") },
        { id: "MOBILE_MONEY", label: tr("mobileMoney"), disabled: true },
        { id: "CARD",         label: tr("bankCard"), disabled: true },
    ];
    return (
        <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{tr("paymentMethod")}</label>
            <div className="grid grid-cols-3 gap-2">
                {OPTIONS.map((o) => (
                    <button key={o.id} type="button" onClick={() => onChange(o.id)}
                        disabled={o.disabled}
                        className="px-2 py-2 rounded-lg text-xs font-medium border transition-colors disabled:cursor-not-allowed"
                        style={o.disabled
                            ? { borderColor: "#e5e7eb", color: "#9ca3af", background: "#f9fafb" }
                            : value === o.id
                                ? { background: "#0f766e", color: "white", borderColor: "#0f766e" }
                                : { borderColor: "#e5e7eb", color: "#6b7280" }}>
                        {o.label}
                        {o.disabled && <span className="block text-[10px] mt-0.5">{tr("comingSoon")}</span>}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Onglet Hôtels ─────────────────────────────────────────────────────────────

function HotelsTab({ travelRequestId }: { travelRequestId?: string }) {
    const tr = useTranslations("employee.reserver");
    const router = useRouter();
    const [city, setCity]           = useState("Cotonou");
    const [cities, setCities]       = useState<string[]>([]);
    const [checkIn, setCheckIn]     = useState("");
    const [checkOut, setCheckOut]   = useState("");
    const [guests, setGuests]       = useState(1);

    const [searching, setSearching] = useState(false);
    const [searchDone, setSearchDone] = useState(false);
    const [hotels, setHotels]       = useState<HotelOffer[]>([]);

    const [confirmHotel, setConfirmHotel] = useState<HotelOffer | null>(null);
    const [purpose, setPurpose]           = useState("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("WALLET");
    const [submitting, setSubmitting]     = useState(false);

    useEffect(() => { hotelsService.getCities().then(setCities).catch(() => {}); }, []);

    const handleSearch = async () => {
        if (!city.trim()) { toast.error(tr("enterCity")); return; }
        if (!checkIn || !checkOut) { toast.error(tr("enterStayDates")); return; }
        if (checkOut <= checkIn) { toast.error(tr("departureDateMustAfter")); return; }

        setSearching(true);
        try {
            const results = await hotelsService.search(city.trim());
            setHotels(results);
            setSearchDone(true);
            toast[results.length > 0 ? "success" : "info"](
                results.length > 0 ? tr("hotelSFound", { length: results.length }) : tr("noHotelFoundCity")
            );
        } catch {
            toast.error(tr("errorWhileSearchingHotels"));
            setHotels([]);
            setSearchDone(true);
        } finally {
            setSearching(false);
        }
    };

    const nights = checkIn && checkOut ? diffDays(checkOut, checkIn) : 1;

    const handleConfirmSubmit = async () => {
        if (!confirmHotel) return;
        setSubmitting(true);
        try {
            const total = confirmHotel.pricePerNight * nights;
            await bookingService.create({
                partnerId:      confirmHotel.partnerId,
                hotelRoomTypeId: confirmHotel.roomTypeId,
                travelRequestId,
                bookingDate:    toIsoMidnight(checkIn),
                numberOfPersons: guests,
                numberOfNights: nights,
                notes: purpose || undefined,
                idempotencyKey: crypto.randomUUID(),
                paymentMethod,
                amount: total,
            });
            toast.success(tr("bookingCreatedAwaiting"));
            router.push("/employes/reservations");
        } catch {
            toast.error(tr("errorWhileCreatingBooking"));
        } finally {
            setSubmitting(false);
            setConfirmHotel(null);
        }
    };

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs text-gray-500 mb-1">{tr("city")}</label>
                        <div className="relative">
                            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={city} onChange={(e) => setCity(e.target.value)} list="hotel-cities"
                                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                            <datalist id="hotel-cities">
                                {cities.map((c) => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">{tr("check")}</label>
                        <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">{tr("checkOut")}</label>
                        <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">{tr("travelers")}</label>
                        <input type="number" min={1} value={guests} onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button onClick={handleSearch} disabled={searching}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                        style={{ background: "#0f766e" }}>
                        {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} {tr("searchHotels")}
                    </button>
                </div>
            </div>

            {!searchDone && (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                    {tr("fillCriteriaThenClick")}
                </div>
            )}

            {searchDone && (
                <div className="space-y-4">
                    {hotels.length === 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                            {tr("noHotelMatchesSearch")}
                        </div>
                    )}
                    {hotels.map((h) => (
                        <div key={`${h.id}-${h.roomTypeId}`} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#eff6ff" }}>
                                    <Hotel size={20} style={{ color: "#3b82f6" }} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{h.name}</p>
                                    <p className="text-xs text-gray-400">{h.city}, {h.country} {h.starRating ? `· ${"★".repeat(h.starRating)}` : ""}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{tr("pers", { roomTypeName: h.roomTypeName, capacity: h.capacity })}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="font-bold text-gray-900 text-lg">{h.pricePerNight.toLocaleString()} {h.currency}</p>
                                    <p className="text-xs text-gray-400">{tr("perNight")}</p>
                                </div>
                                <button onClick={() => { setConfirmHotel(h); setPurpose(""); }}
                                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-white text-sm font-semibold"
                                    style={{ background: "#f59e0b" }}>
                                    {tr("select")} <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {confirmHotel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-gray-900">{tr("confirmHotelBooking")}</h3>
                            <button onClick={() => setConfirmHotel(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700">
                                {confirmHotel.name} — {confirmHotel.roomTypeName}
                            </div>
                            <div className="text-xs text-gray-500">
                                {tr("nightTraveler", { checkIn, checkOut, nights, p4: nights > 1 ? "s" : "", guests, p6: guests > 1 ? "s" : "" })}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">{tr("purposeStay")}</label>
                                <input value={purpose} onChange={(e) => setPurpose(e.target.value)}
                                    placeholder={tr("eGBusinessMission")}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                            </div>
                            <PaymentMethodField value={paymentMethod} onChange={setPaymentMethod} />
                            <div className="flex justify-between items-center px-3 py-2.5 rounded-lg" style={{ background: "#f0fdf4" }}>
                                <span className="text-xs text-gray-600">{tr("totalCost")}</span>
                                <span className="text-sm font-bold" style={{ color: "#0f766e" }}>
                                    {(confirmHotel.pricePerNight * nights).toLocaleString()} {confirmHotel.currency}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setConfirmHotel(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">{tr("cancel")}</button>
                            <button onClick={handleConfirmSubmit} disabled={submitting}
                                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                                style={{ background: "#0f766e" }}>
                                {submitting && <Loader2 size={14} className="animate-spin" />} {tr("confirmBooking")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Onglet Trains ──────────────────────────────────────────────────────────────

function TrainsTab({ travelRequestId }: { travelRequestId?: string }) {
    const tr = useTranslations("employee.reserver");
    const router = useRouter();
    const [origin, setOrigin]           = useState("Abidjan");
    const [destination, setDestination] = useState("Ouagadougou");
    const [cities, setCities]           = useState<string[]>([]);
    const [departureDate, setDepartureDate] = useState("");
    const [passengers, setPassengers]   = useState(1);

    const [searching, setSearching]     = useState(false);
    const [searchDone, setSearchDone]   = useState(false);
    const [trains, setTrains]           = useState<TrainOffer[]>([]);

    const [confirmTrain, setConfirmTrain] = useState<TrainOffer | null>(null);
    const [purpose, setPurpose]           = useState("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("WALLET");
    const [submitting, setSubmitting]     = useState(false);

    useEffect(() => { trainsService.getCities().then(setCities).catch(() => {}); }, []);

    const handleSearch = async () => {
        if (!origin.trim() || !destination.trim()) { toast.error(tr("enterDepartureDestination")); return; }
        if (!departureDate) { toast.error(tr("enterDepartureDate")); return; }

        setSearching(true);
        try {
            const results = await trainsService.search(origin.trim(), destination.trim());
            setTrains(results);
            setSearchDone(true);
            toast[results.length > 0 ? "success" : "info"](
                results.length > 0 ? tr("tripSFound", { length: results.length }) : tr("noTripFoundThese")
            );
        } catch {
            toast.error(tr("errorWhileSearchingTrains"));
            setTrains([]);
            setSearchDone(true);
        } finally {
            setSearching(false);
        }
    };

    const handleConfirmSubmit = async () => {
        if (!confirmTrain) return;
        setSubmitting(true);
        try {
            const total = confirmTrain.price * passengers;
            await bookingService.create({
                partnerId:      confirmTrain.partnerId,
                trainRouteId:   confirmTrain.routeId,
                travelRequestId,
                bookingDate:    toIsoMidnight(departureDate),
                numberOfPersons: passengers,
                notes: purpose || undefined,
                idempotencyKey: crypto.randomUUID(),
                paymentMethod,
                amount: total,
            });
            toast.success(tr("bookingCreatedAwaiting"));
            router.push("/employes/reservations");
        } catch {
            toast.error(tr("errorWhileCreatingBooking"));
        } finally {
            setSubmitting(false);
            setConfirmTrain(null);
        }
    };

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">{tr("from2")}</label>
                        <input value={origin} onChange={(e) => setOrigin(e.target.value)} list="train-cities"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">{tr("to")}</label>
                        <input value={destination} onChange={(e) => setDestination(e.target.value)} list="train-cities"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                        <datalist id="train-cities">
                            {cities.map((c) => <option key={c} value={c} />)}
                        </datalist>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">{tr("departure")}</label>
                        <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">{tr("passengers")}</label>
                        <input type="number" min={1} value={passengers} onChange={(e) => setPassengers(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button onClick={handleSearch} disabled={searching}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                        style={{ background: "#0f766e" }}>
                        {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} {tr("searchTrains")}
                    </button>
                </div>
            </div>

            {!searchDone && (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                    {tr("fillCriteriaThenClick2")}
                </div>
            )}

            {searchDone && (
                <div className="space-y-4">
                    {trains.length === 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                            {tr("noTripMatchesSearch")}
                        </div>
                    )}
                    {trains.map((t) => (
                        <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#eff6ff" }}>
                                    <Train size={20} style={{ color: "#3b82f6" }} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{t.operator} · {t.travelClass}</p>
                                    <p className="text-xs text-gray-400">{t.originStation} → {t.destinationStation}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{t.departureTime} – {t.arriveTime} · {t.duration}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="font-bold text-gray-900 text-lg">{t.price.toLocaleString()} {t.currency}</p>
                                    <p className="text-xs text-gray-400">{tr("perPerson")}</p>
                                </div>
                                <button onClick={() => { setConfirmTrain(t); setPurpose(""); }}
                                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-white text-sm font-semibold"
                                    style={{ background: "#f59e0b" }}>
                                    {tr("select")} <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {confirmTrain && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-gray-900">{tr("confirmTrainBooking")}</h3>
                            <button onClick={() => setConfirmTrain(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700">
                                {confirmTrain.originCity} → {confirmTrain.destinationCity} ({confirmTrain.travelClass})
                            </div>
                            <div className="text-xs text-gray-500">
                                {tr("passenger", { departureDate, departureTime: confirmTrain.departureTime, passengers, p4: passengers > 1 ? "s" : "" })}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">{tr("purposeTrip")}</label>
                                <input value={purpose} onChange={(e) => setPurpose(e.target.value)}
                                    placeholder={tr("eGBusinessMission")}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                            </div>
                            <PaymentMethodField value={paymentMethod} onChange={setPaymentMethod} />
                            <div className="flex justify-between items-center px-3 py-2.5 rounded-lg" style={{ background: "#f0fdf4" }}>
                                <span className="text-xs text-gray-600">{tr("totalCost")}</span>
                                <span className="text-sm font-bold" style={{ color: "#0f766e" }}>
                                    {(confirmTrain.price * passengers).toLocaleString()} {confirmTrain.currency}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setConfirmTrain(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">{tr("cancel")}</button>
                            <button onClick={handleConfirmSubmit} disabled={submitting}
                                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                                style={{ background: "#0f766e" }}>
                                {submitting && <Loader2 size={14} className="animate-spin" />} {tr("confirmBooking")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Onglet Location de voitures ───────────────────────────────────────────────

function CarRentalTab({ travelRequestId }: { travelRequestId?: string }) {
    const tr = useTranslations("employee.reserver");
    const optionLabel = useOptionLabel();
    const router = useRouter();
    const [city, setCity]           = useState("Abidjan");
    const [cities, setCities]       = useState<string[]>([]);
    const [pickupDate, setPickupDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [category, setCategory]   = useState("");

    const [searching, setSearching] = useState(false);
    const [searchDone, setSearchDone] = useState(false);
    const [vehicles, setVehicles]   = useState<CarRentalOffer[]>([]);

    const [confirmVehicle, setConfirmVehicle] = useState<CarRentalOffer | null>(null);
    const [purpose, setPurpose]               = useState("");
    const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod>("WALLET");
    const [submitting, setSubmitting]         = useState(false);

    useEffect(() => { carRentalsService.getCities().then(setCities).catch(() => {}); }, []);

    const handleSearch = async () => {
        if (!city.trim()) { toast.error(tr("enterCity")); return; }
        if (!pickupDate || !returnDate) { toast.error(tr("enterRentalDates")); return; }
        if (returnDate <= pickupDate) { toast.error(tr("returnDateMustAfter")); return; }

        setSearching(true);
        try {
            const results = await carRentalsService.search(city.trim(), category || undefined);
            setVehicles(results);
            setSearchDone(true);
            toast[results.length > 0 ? "success" : "info"](
                results.length > 0 ? tr("vehicleSFound", { length: results.length }) : tr("noVehicleFoundThese")
            );
        } catch {
            toast.error(tr("errorWhileSearchingVehicles"));
            setVehicles([]);
            setSearchDone(true);
        } finally {
            setSearching(false);
        }
    };

    const days = pickupDate && returnDate ? diffDays(returnDate, pickupDate) : 1;

    const handleConfirmSubmit = async () => {
        if (!confirmVehicle) return;
        setSubmitting(true);
        try {
            const total = confirmVehicle.pricePerDay * days;
            await bookingService.create({
                partnerId:      confirmVehicle.partnerId,
                carRentalVehicleId: confirmVehicle.id,
                travelRequestId,
                bookingDate:    toIsoMidnight(pickupDate),
                numberOfPersons: 1,
                numberOfDays: days,
                notes: purpose || undefined,
                idempotencyKey: crypto.randomUUID(),
                paymentMethod,
                amount: total,
            });
            toast.success(tr("bookingCreatedAwaiting"));
            router.push("/employes/reservations");
        } catch {
            toast.error(tr("errorWhileCreatingBooking"));
        } finally {
            setSubmitting(false);
            setConfirmVehicle(null);
        }
    };

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">{tr("city")}</label>
                        <input value={city} onChange={(e) => setCity(e.target.value)} list="car-cities"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                        <datalist id="car-cities">
                            {cities.map((c) => <option key={c} value={c} />)}
                        </datalist>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">{tr("pickUp")}</label>
                        <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">{tr("return")}</label>
                        <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">{tr("category")}</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                            <option value="">{tr("all")}</option>
                            {["Économique", "Compacte", "SUV", "Luxe", "Utilitaire"].map((c) => <option key={c} value={c}>{optionLabel(c)}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button onClick={handleSearch} disabled={searching}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                        style={{ background: "#0f766e" }}>
                        {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} {tr("searchVehicles")}
                    </button>
                </div>
            </div>

            {!searchDone && (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                    {tr("fillCriteriaThenClick3")}
                </div>
            )}

            {searchDone && (
                <div className="space-y-4">
                    {vehicles.length === 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                            {tr("noVehicleMatchesSearch")}
                        </div>
                    )}
                    {vehicles.map((v) => (
                        <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#eff6ff" }}>
                                    <Car size={20} style={{ color: "#3b82f6" }} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{v.brand} {v.model}</p>
                                    <p className="text-xs text-gray-400">{v.city}, {v.country} · {optionLabel(v.category)}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Users size={11} /> {tr("seats", { seats: v.seats, transmission: v.transmission })}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="font-bold text-gray-900 text-lg">{v.pricePerDay.toLocaleString()} {v.currency}</p>
                                    <p className="text-xs text-gray-400">{tr("perDay")}</p>
                                </div>
                                <button onClick={() => { setConfirmVehicle(v); setPurpose(""); }}
                                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-white text-sm font-semibold"
                                    style={{ background: "#f59e0b" }}>
                                    {tr("select")} <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {confirmVehicle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-gray-900">{tr("confirmRental")}</h3>
                            <button onClick={() => setConfirmVehicle(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700">
                                {confirmVehicle.brand} {confirmVehicle.model} ({optionLabel(confirmVehicle.category)})
                            </div>
                            <div className="text-xs text-gray-500">
                                {tr("day", { pickupDate, returnDate, days, p4: days > 1 ? "s" : "" })}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">{tr("purposeTrip2")}</label>
                                <input value={purpose} onChange={(e) => setPurpose(e.target.value)}
                                    placeholder={tr("eGBusinessMission")}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                            </div>
                            <PaymentMethodField value={paymentMethod} onChange={setPaymentMethod} />
                            <div className="flex justify-between items-center px-3 py-2.5 rounded-lg" style={{ background: "#f0fdf4" }}>
                                <span className="text-xs text-gray-600">{tr("totalCost")}</span>
                                <span className="text-sm font-bold" style={{ color: "#0f766e" }}>
                                    {(confirmVehicle.pricePerDay * days).toLocaleString()} {confirmVehicle.currency}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setConfirmVehicle(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">{tr("cancel")}</button>
                            <button onClick={handleConfirmSubmit} disabled={submitting}
                                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                                style={{ background: "#0f766e" }}>
                                {submitting && <Loader2 size={14} className="animate-spin" />} {tr("confirmBooking")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Page principale ────────────────────────────────────────────────────────────

function ReserverPageContent() {
    const dateLocale = useDateLocale();
    const tt = useTranslations("employee.reserver");
    const tr = useTranslations("employee.reserver");
    const router = useRouter();
    const searchParams = useSearchParams();
    const travelRequestId = searchParams.get("travelRequestId") ?? undefined;
    const [travelContext, setTravelContext] = useState<TravelContext | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>("Flights");
    const [tripType, setTripType]   = useState("roundtrip");
    const [directOnly, setDirectOnly] = useState(false);

    const [from, setFrom]         = useState("Lagos (LOS)");
    const [fromCode, setFromCode] = useState("LOS");
    const [to, setTo]             = useState("Abuja (ABV)");
    const [toCode, setToCode]     = useState("ABV");
    const [fromOptions, setFromOptions] = useState<AirportOption[]>([]);
    const [toOptions, setToOptions]     = useState<AirportOption[]>([]);
    const [fromOpen, setFromOpen] = useState(false);
    const [toOpen, setToOpen]     = useState(false);

    const [departure, setDeparture]   = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [passengers, setPassengers] = useState("1 Adult");

    const [priceRange, setPriceRange] = useState([0, DEFAULT_MAX_PRICE]);
    const [maxPrice, setMaxPrice]     = useState(DEFAULT_MAX_PRICE);
    const [sortBy, setSortBy]         = useState("Price (Low to High)");
    const [searchDone, setSearchDone] = useState(false);
    const [searching, setSearching]   = useState(false);
    const [flights, setFlights]       = useState<FlightOffer[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [bookingId, setBookingId]   = useState<string | null>(null);

    const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
    const [selectedStops, setSelectedStops]       = useState<string[]>([]);
    const [selectedTimes, setSelectedTimes]       = useState<string[]>([]);

    // ── Confirmation de réservation ──────────────────────────────────────────
    const [confirmFlight, setConfirmFlight] = useState<FlightOffer | null>(null);
    const [purpose, setPurpose]       = useState("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("WALLET");
    const [confirmSubmitting, setConfirmSubmitting] = useState(false);

    const TABS: { id: TabType; icon: React.ElementType }[] = [
        { id: "Flights",    icon: Plane },
        { id: "Hotels",     icon: Hotel },
        { id: "Trains",     icon: Train },
        { id: "Car Rental", icon: Car },
    ];

    // ── Contexte voyage d'affaires (si ouvert depuis /employes/voyages) ──────
    useEffect(() => {
        if (!travelRequestId) { setTravelContext(null); return; }
        employeeService.getTravelById(travelRequestId)
            .then((t) => setTravelContext(t))
            .catch(() => setTravelContext(null));
    }, [travelRequestId]);

    // ── Autocomplétion aéroports ─────────────────────────────────────────────
    useEffect(() => {
        if (from.trim().length < 2) { setFromOptions([]); return; }
        const t = setTimeout(() => {
            flightsService.searchAirports(from.trim())
                .then((opts) => setFromOptions(opts))
                .catch(() => setFromOptions([]));
        }, 300);
        return () => clearTimeout(t);
    }, [from]);

    useEffect(() => {
        if (to.trim().length < 2) { setToOptions([]); return; }
        const t = setTimeout(() => {
            flightsService.searchAirports(to.trim())
                .then((opts) => setToOptions(opts))
                .catch(() => setToOptions([]));
        }, 300);
        return () => clearTimeout(t);
    }, [to]);

    const selectFrom = (opt: AirportOption) => {
        setFrom(`${opt.city ?? opt.name} (${opt.iataCode})`);
        setFromCode(opt.iataCode);
        setFromOpen(false);
    };

    const selectTo = (opt: AirportOption) => {
        setTo(`${opt.city ?? opt.name} (${opt.iataCode})`);
        setToCode(opt.iataCode);
        setToOpen(false);
    };

    const toggleValue = (list: string[], value: string, setList: (v: string[]) => void) => {
        setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
    };

    const handleSearch = async () => {
        if (!fromCode || !toCode) { toast.error(tr("selectDepartureDestination")); return; }
        if (!departure) { toast.error(tr("enterDepartureDate")); return; }

        setSearching(true);
        try {
            const adults = parseInt(passengers, 10) || 1;
            const results = await flightsService.search({
                from: fromCode,
                to: toCode,
                departureDate: departure,
                returnDate: tripType === "roundtrip" && returnDate ? returnDate : undefined,
                adults,
                nonStop: directOnly,
                currency: "XOF",
            });

            setFlights(results);
            setSearchDone(true);
            setCurrentPage(1);
            setSelectedAirlines([]);
            setSelectedStops([]);
            setSelectedTimes([]);

            if (results.length > 0) {
                const max = Math.max(...results.map((f) => f.price));
                const rounded = Math.max(DEFAULT_MAX_PRICE, Math.ceil(max / 1000) * 1000);
                setMaxPrice(rounded);
                setPriceRange([0, rounded]);
                toast.success(tr("flightSFound", { length: results.length }));
            } else {
                setMaxPrice(DEFAULT_MAX_PRICE);
                setPriceRange([0, DEFAULT_MAX_PRICE]);
                toast.info(tr("noFlightFoundThese"));
            }
        } catch {
            toast.error(tr("errorWhileSearchingFlights"));
            setFlights([]);
            setSearchDone(true);
        } finally {
            setSearching(false);
        }
    };

    const handleSelect = (flight: FlightOffer) => {
        setConfirmFlight(flight);
        setPurpose(tt("flight", { airline: flight.airline }));
    };

    const closeConfirm = () => {
        setConfirmFlight(null);
        setPurpose("");
    };

    const handleConfirmSubmit = async () => {
        if (!confirmFlight) return;
        setBookingId(confirmFlight.id);
        setConfirmSubmitting(true);
        try {
            const adults = parseInt(passengers, 10) || 1;
            await bookingService.create({
                partnerId:      confirmFlight.partnerId,
                flightRouteId:  confirmFlight.routeId,
                travelRequestId,
                bookingDate:    toIsoMidnight(confirmFlight.outbound.departDate),
                numberOfPersons: adults,
                notes: purpose || undefined,
                idempotencyKey: crypto.randomUUID(),
                paymentMethod,
                amount: confirmFlight.price * adults,
            });
            toast.success(tr("bookingHasBeenCreated"));
            router.push("/employes/reservations");
        } catch {
            toast.error(tr("errorWhileCreatingBooking"));
        } finally {
            setBookingId(null);
            setConfirmSubmitting(false);
            closeConfirm();
        }
    };

    // ── Filtrage / tri / pagination ──────────────────────────────────────────
    const airlineCounts = flights.reduce<Record<string, number>>((acc, f) => {
        acc[f.airline] = (acc[f.airline] ?? 0) + 1;
        return acc;
    }, {});

    const filteredFlights = flights
        .filter((f) => f.price >= priceRange[0]! && f.price <= priceRange[1]!)
        .filter((f) => !directOnly || f.outbound.stops === 0)
        .filter((f) => selectedAirlines.length === 0 || selectedAirlines.includes(f.airline))
        .filter((f) => selectedStops.length === 0 || selectedStops.includes(stopsLabel(f.outbound.stops)))
        .filter((f) => selectedTimes.length === 0 || selectedTimes.includes(timeBucket(f.outbound.departTime)));

    const sortedFlights = [...filteredFlights].sort((a, b) => {
        if (sortBy === "Duration") return durationToMinutes(a.outbound.duration) - durationToMinutes(b.outbound.duration);
        if (sortBy === "Departure Time") return a.outbound.departTime.localeCompare(b.outbound.departTime);
        return a.price - b.price;
    });

    const totalPages = Math.max(1, Math.ceil(sortedFlights.length / PAGE_SIZE));
    const pagedFlights = sortedFlights.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const renderLeg = (leg: FlightLeg, label?: string) => (
        <div className="flex items-center gap-4">
            {label && <span className="text-xs font-medium text-gray-500 w-14 shrink-0">{label}</span>}
            <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#eff6ff" }}
            >
                <Plane size={18} style={{ color: "#3b82f6" }} />
            </div>
            <div className="flex items-center gap-2">
                <div className="text-center">
                    <p className="font-bold text-gray-900">{leg.departTime}</p>
                    <p className="text-xs text-gray-400">{leg.from}</p>
                </div>
                <div className="text-center px-3">
                    <p className="text-xs text-gray-500 whitespace-nowrap">
                        {leg.duration} {leg.stops === 0 ? tr("nonStop") : tr("stopS", { stops: leg.stops })}
                    </p>
                    <div className="w-16 h-px bg-gray-300 my-1 relative">
                        <Plane size={10} className="absolute -top-1.5 right-0 text-gray-400" />
                    </div>
                </div>
                <div className="text-center">
                    <p className="font-bold text-gray-900">{leg.arriveTime}</p>
                    <p className="text-xs text-gray-400">{leg.to}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-5">
        <div>
            <h1 className="text-xl font-bold text-gray-900">{tr("searchBooking")}</h1>
            <p className="text-sm text-gray-500">{tr("searchBookBusinessTrips")}</p>
        </div>

        {travelContext && <TravelContextBanner travel={travelContext} />}

        {/* Card de recherche */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
            {TABS.map(({ id, icon: Icon }) => (
                <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2"
                style={activeTab === id
                    ? { borderColor: "#0f766e", color: "#0f766e" }
                    : { borderColor: "transparent", color: "#6b7280" }}
                >
                <Icon size={16} /> {id}
                </button>
            ))}
            </div>

            {/* Formulaire vols */}
            {activeTab === "Flights" && (
            <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="col-span-2 sm:col-span-1 relative">
                    <label className="block text-xs text-gray-500 mb-1">{tr("from2")}</label>
                    <div className="relative">
                    <Plane size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        onFocus={() => setFromOpen(true)}
                        onBlur={() => setTimeout(() => setFromOpen(false), 150)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
                    {fromOpen && fromOptions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {fromOptions.map((opt) => (
                        <button key={`${opt.iataCode}`} type="button"
                            onMouseDown={() => selectFrom(opt)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs hover:bg-gray-50">
                            <MapPin size={12} className="text-gray-400 shrink-0" />
                            <span className="truncate">{opt.city ? `${opt.city} — ` : ""}{opt.name}</span>
                            <span className="ml-auto font-semibold text-gray-500 shrink-0">{opt.iataCode}</span>
                        </button>
                        ))}
                    </div>
                    )}
                </div>
                <div className="col-span-2 sm:col-span-1 relative">
                    <label className="block text-xs text-gray-500 mb-1">{tr("to")}</label>
                    <div className="relative">
                    <Plane size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" />
                    <input value={to}
                        onChange={(e) => setTo(e.target.value)}
                        onFocus={() => setToOpen(true)}
                        onBlur={() => setTimeout(() => setToOpen(false), 150)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
                    {toOpen && toOptions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {toOptions.map((opt) => (
                        <button key={`${opt.iataCode}`} type="button"
                            onMouseDown={() => selectTo(opt)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs hover:bg-gray-50">
                            <MapPin size={12} className="text-gray-400 shrink-0" />
                            <span className="truncate">{opt.city ? `${opt.city} — ` : ""}{opt.name}</span>
                            <span className="ml-auto font-semibold text-gray-500 shrink-0">{opt.iataCode}</span>
                        </button>
                        ))}
                    </div>
                    )}
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">{tr("departure")}</label>
                    <input type="date" value={departure}
                    onChange={(e) => setDeparture(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">{tr("return2")}</label>
                    <input type="date" value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                    disabled={tripType === "oneway"} />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">{tr("passengers")}</label>
                    <select value={passengers} onChange={(e) => setPassengers(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                    {["1 Adult", "2 Adults", "3 Adults", "4+ Adults"].map((o) => (
                        <option key={o}>{o}</option>
                    ))}
                    </select>
                </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-4 text-sm">
                    {[
                    { id: "roundtrip", label: tr("roundTrip") },
                    { id: "oneway",    label: tr("oneWay") },
                    ].map((t) => (
                    <label key={t.id} className="flex items-center gap-1.5 cursor-pointer text-gray-600">
                        <input type="radio" value={t.id}
                        checked={tripType === t.id}
                        onChange={() => setTripType(t.id)}
                        style={{ accentColor: "#0f766e" }} />
                        {t.label}
                    </label>
                    ))}
                    <label className="flex items-center gap-1.5 cursor-pointer text-gray-600 text-sm">
                    <input type="checkbox" checked={directOnly}
                        onChange={(e) => setDirectOnly(e.target.checked)}
                        style={{ accentColor: "#0f766e" }} />
                    {tr("directFlightsOnly")}
                    </label>
                </div>
                <button
                    onClick={handleSearch}
                    disabled={searching}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                    style={{ background: "#0f766e" }}
                >
                    {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} {tr("searchFlights")}
                </button>
                </div>
            </div>
            )}

            {/* Autres tabs */}
            {activeTab === "Hotels"     && <div className="p-5"><HotelsTab travelRequestId={travelRequestId} /></div>}
            {activeTab === "Trains"     && <div className="p-5"><TrainsTab travelRequestId={travelRequestId} /></div>}
            {activeTab === "Car Rental" && <div className="p-5"><CarRentalTab travelRequestId={travelRequestId} /></div>}
        </div>

        {/* Invite à rechercher */}
        {!searchDone && activeTab === "Flights" && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
            {tr("fillCriteriaThenClick4")}
            </div>
        )}

        {/* Résultats */}
        {searchDone && activeTab === "Flights" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Filtres */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 h-fit space-y-4">
                <div className="flex items-center gap-2">
                <Filter size={15} className="text-gray-500" />
                <h3 className="font-semibold text-sm text-gray-900">{tr("filterResults")}</h3>
                </div>

                {/* Prix */}
                <div>
                <p className="text-xs font-medium text-gray-700 mb-2">{tr("priceRange")}</p>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>0</span><span>{priceRange[1]!.toLocaleString()} {flights[0]?.currency ?? "XOF"}</span>
                </div>
                <input type="range" min="0" max={maxPrice}
                    value={priceRange[1]}
                    onChange={(e) => { setPriceRange([priceRange[0]!, parseInt(e.target.value, 10)]); setCurrentPage(1); }}
                    className="w-full accent-teal-600" />
                </div>

                {/* Compagnies */}
                {Object.keys(airlineCounts).length > 0 && (
                <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">{tr("airlines")}</p>
                    {Object.entries(airlineCounts).map(([airline, count]) => (
                    <label key={airline} className="flex items-center gap-2 text-xs text-gray-600 mb-1.5 cursor-pointer">
                        <input type="checkbox" className="w-3.5 h-3.5"
                        checked={selectedAirlines.includes(airline)}
                        onChange={() => { toggleValue(selectedAirlines, airline, setSelectedAirlines); setCurrentPage(1); }}
                        style={{ accentColor: "#0f766e" }} />
                        {airline} ({count})
                    </label>
                    ))}
                </div>
                )}

                {/* Heure départ */}
                <div>
                <p className="text-xs font-medium text-gray-700 mb-2">{tr("departureTime")}</p>
                {TIMES.map((t) => (
                    <label key={t} className="flex items-center gap-2 text-xs text-gray-600 mb-1.5 cursor-pointer">
                    <input type="checkbox" className="w-3.5 h-3.5"
                        checked={selectedTimes.includes(t)}
                        onChange={() => { toggleValue(selectedTimes, t, setSelectedTimes); setCurrentPage(1); }}
                        style={{ accentColor: "#0f766e" }} />
                    {t}
                    </label>
                ))}
                </div>

                {/* Escales */}
                <div>
                <p className="text-xs font-medium text-gray-700 mb-2">{tr("stops")}</p>
                {STOPS.map((s) => (
                    <label key={s} className="flex items-center gap-2 text-xs text-gray-600 mb-1.5 cursor-pointer">
                    <input type="checkbox" className="w-3.5 h-3.5"
                        checked={selectedStops.includes(s)}
                        onChange={() => { toggleValue(selectedStops, s, setSelectedStops); setCurrentPage(1); }}
                        style={{ accentColor: "#0f766e" }} />
                    {s}
                    </label>
                ))}
                </div>
            </div>

            {/* Liste vols */}
            <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-900">{tr("availableFlights")}</h3>
                    <p className="text-xs text-gray-500">{tr("resultSFound", { length: sortedFlights.length })}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{tr("sort")}</span>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none">
                    <option value="Price (Low to High)">{tr("priceLowHigh")}</option>
                    <option value="Duration">{tr("duration")}</option>
                    <option value="Departure Time">{tr("departureTime")}</option>
                    </select>
                </div>
                </div>

                {pagedFlights.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                    {tr("noFlightMatchesSearch")}
                </div>
                )}

                {pagedFlights.map((flight) => (
                <div key={flight.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                    <p className="text-xs text-gray-400">
                    {new Date(flight.outbound.departDate).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })}
                    </p>

                    {renderLeg(flight.outbound, flight.inbound ? tr("outbound") : undefined)}
                    {flight.inbound && renderLeg(flight.inbound, tt("return"))}

                    <div className="flex items-center justify-between flex-wrap gap-4 pt-3 border-t border-gray-100">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                        {flight.outbound.stops === 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                            {tr("direct")}
                        </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "#f0fdf4", color: "#0f766e" }}>
                        {flight.airline}
                        </span>
                    </div>

                    {/* Prix + bouton */}
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                        <p className="font-bold text-gray-900 text-lg">
                            {flight.price.toLocaleString()} {flight.currency}
                        </p>
                        <p className="text-xs text-gray-400">{tr("perPerson")}</p>
                        </div>
                        <button
                        onClick={() => handleSelect(flight)}
                        disabled={bookingId !== null}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                        style={{ background: "#f59e0b" }}
                        >
                        {bookingId === flight.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <>{tr("select")} <ChevronRight size={14} /></>}
                        </button>
                    </div>
                    </div>
                </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                <div className="flex justify-center gap-1">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setCurrentPage(p)}
                        className="w-9 h-9 rounded-lg text-sm font-medium"
                        style={currentPage === p
                        ? { background: "#0f766e", color: "white" }
                        : { color: "#6b7280" }}>
                        {p}
                    </button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <ChevronRight size={16} />
                    </button>
                </div>
                )}
            </div>
            </div>
        )}

        {/* ── Modal de confirmation ──────────────────────────────────────────── */}
        {confirmFlight && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="font-bold text-gray-900">{tr("confirmFlightBooking")}</h3>
                        <button onClick={closeConfirm} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{tr("destination")}</label>
                            <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700">
                                {confirmFlight.outbound.from} → {confirmFlight.outbound.to}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">{tr("departure2")}</label>
                                <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700">
                                    {new Date(confirmFlight.outbound.departDate).toLocaleDateString(dateLocale)}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">{tr("return")}</label>
                                <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700">
                                    {confirmFlight.inbound
                                        ? new Date(confirmFlight.inbound.departDate).toLocaleDateString(dateLocale)
                                        : "—"}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{tr("purposeTrip3")}</label>
                            <input
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder={tr("eGBusinessMission2")}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"
                            />
                        </div>

                        <PaymentMethodField value={paymentMethod} onChange={setPaymentMethod} />

                        <div className="flex justify-between items-center px-3 py-2.5 rounded-lg" style={{ background: "#f0fdf4" }}>
                            <span className="text-xs text-gray-600">{tr("estimatedCost")}</span>
                            <span className="text-sm font-bold" style={{ color: "#0f766e" }}>
                                {(confirmFlight.price * (parseInt(passengers, 10) || 1)).toLocaleString()} {confirmFlight.currency}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={closeConfirm}
                            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                        >
                            {tr("cancel")}
                        </button>
                        <button
                            onClick={handleConfirmSubmit}
                            disabled={confirmSubmitting || !purpose.trim()}
                            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                            style={{ background: "#0f766e" }}
                        >
                            {confirmSubmitting && <Loader2 size={14} className="animate-spin" />}
                            {tr("confirmRequest")}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}

// useSearchParams() exige une frontière Suspense pour ne pas bloquer le prerendering
// du reste de la route (cf. doc Next.js sur useSearchParams).
export default function ReserverPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>}>
            <ReserverPageContent />
        </Suspense>
    );
}
