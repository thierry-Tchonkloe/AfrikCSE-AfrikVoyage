"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plane, Hotel, Train, Car, Filter, ChevronLeft, ChevronRight, MapPin, Loader2 } from "lucide-react";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";

type TabType = "Flights" | "Hotels" | "Trains" | "Car Rental";

interface AirportOption {
    iataCode: string;
    name: string;
    city?: string;
    country?: string;
    subType: string;
}

interface FlightLeg {
    from: string;
    to: string;
    departTime: string;
    arriveTime: string;
    departDate: string;
    duration: string;
    stops: number;
}

interface FlightOffer {
    id: string;
    airline: string;
    airlineCode: string;
    price: number;
    currency: string;
    outbound: FlightLeg;
    inbound?: FlightLeg;
}

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

export default function ReserverPage() {
    const router = useRouter();
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

    const TABS: { id: TabType; icon: React.ElementType }[] = [
        { id: "Flights",    icon: Plane },
        { id: "Hotels",     icon: Hotel },
        { id: "Trains",     icon: Train },
        { id: "Car Rental", icon: Car },
    ];

    // ── Autocomplétion aéroports ─────────────────────────────────────────────
    useEffect(() => {
        if (from.trim().length < 2) { setFromOptions([]); return; }
        const t = setTimeout(() => {
            employeeService.searchAirports(from.trim())
                .then((opts: AirportOption[]) => setFromOptions(opts))
                .catch(() => setFromOptions([]));
        }, 300);
        return () => clearTimeout(t);
    }, [from]);

    useEffect(() => {
        if (to.trim().length < 2) { setToOptions([]); return; }
        const t = setTimeout(() => {
            employeeService.searchAirports(to.trim())
                .then((opts: AirportOption[]) => setToOptions(opts))
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
        if (!fromCode || !toCode) { toast.error("Sélectionnez un aéroport de départ et de destination"); return; }
        if (!departure) { toast.error("Renseignez la date de départ"); return; }

        setSearching(true);
        try {
            const adults = parseInt(passengers, 10) || 1;
            const results: FlightOffer[] = await employeeService.searchFlights({
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
                toast.success(`${results.length} vol(s) trouvé(s)`);
            } else {
                setMaxPrice(DEFAULT_MAX_PRICE);
                setPriceRange([0, DEFAULT_MAX_PRICE]);
                toast.info("Aucun vol trouvé pour ces critères");
            }
        } catch {
            toast.error("Erreur lors de la recherche de vols");
            setFlights([]);
            setSearchDone(true);
        } finally {
            setSearching(false);
        }
    };

    const handleSelect = async (flight: FlightOffer) => {
        setBookingId(flight.id);
        try {
            await employeeService.createTravel({
                destination: `${flight.outbound.from} → ${flight.outbound.to}`,
                purpose: `Vol ${flight.airline}`,
                departureDate: flight.outbound.departDate,
                returnDate: flight.inbound ? flight.inbound.departDate : flight.outbound.departDate,
                estimatedCost: flight.price,
            });
            toast.success(`Vol ${flight.airline} réservé — demande ajoutée à "Mes voyages"`);
            router.push("/employes/voyages");
        } catch {
            toast.error("Erreur lors de la création de la demande de voyage");
        } finally {
            setBookingId(null);
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
                        {leg.duration} {leg.stops === 0 ? "· direct" : `· ${leg.stops} escale(s)`}
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
            <h1 className="text-xl font-bold text-gray-900">Search & Booking</h1>
            <p className="text-sm text-gray-500">Recherchez et réservez vos déplacements professionnels</p>
        </div>

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
                    <label className="block text-xs text-gray-500 mb-1">From</label>
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
                        <button key={`${opt.iataCode}-${opt.subType}`} type="button"
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
                    <label className="block text-xs text-gray-500 mb-1">To</label>
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
                        <button key={`${opt.iataCode}-${opt.subType}`} type="button"
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
                    <label className="block text-xs text-gray-500 mb-1">Departure</label>
                    <input type="date" value={departure}
                    onChange={(e) => setDeparture(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Return</label>
                    <input type="date" value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                    disabled={tripType === "oneway"} />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Passengers</label>
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
                    { id: "roundtrip", label: "Round trip" },
                    { id: "oneway",    label: "One way" },
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
                    Direct flights only
                    </label>
                </div>
                <button
                    onClick={handleSearch}
                    disabled={searching}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                    style={{ background: "#0f766e" }}
                >
                    {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Search Flights
                </button>
                </div>
            </div>
            )}

            {/* Autres tabs */}
            {activeTab !== "Flights" && (
            <div className="p-8 text-center text-gray-400 text-sm">
                Module {activeTab} — en cours de développement
            </div>
            )}
        </div>

        {/* Invite à rechercher */}
        {!searchDone && activeTab === "Flights" && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
            Renseignez vos critères puis cliquez sur « Search Flights » pour afficher les vols disponibles.
            </div>
        )}

        {/* Résultats */}
        {searchDone && activeTab === "Flights" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Filtres */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 h-fit space-y-4">
                <div className="flex items-center gap-2">
                <Filter size={15} className="text-gray-500" />
                <h3 className="font-semibold text-sm text-gray-900">Filter Results</h3>
                </div>

                {/* Prix */}
                <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Gamme de prix</p>
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
                    <p className="text-xs font-medium text-gray-700 mb-2">Compagnies aériennes</p>
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
                <p className="text-xs font-medium text-gray-700 mb-2">Departure Time</p>
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
                <p className="text-xs font-medium text-gray-700 mb-2">Stops</p>
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
                    <h3 className="font-semibold text-gray-900">Vols disponibles</h3>
                    <p className="text-xs text-gray-500">{sortedFlights.length} result(s) found</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Sort by:</span>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none">
                    <option>Price (Low to High)</option>
                    <option>Duration</option>
                    <option>Departure Time</option>
                    </select>
                </div>
                </div>

                {pagedFlights.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                    Aucun vol ne correspond à votre recherche.
                </div>
                )}

                {pagedFlights.map((flight) => (
                <div key={flight.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                    <p className="text-xs text-gray-400">
                    {new Date(flight.outbound.departDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>

                    {renderLeg(flight.outbound, flight.inbound ? "Aller" : undefined)}
                    {flight.inbound && renderLeg(flight.inbound, "Retour")}

                    <div className="flex items-center justify-between flex-wrap gap-4 pt-3 border-t border-gray-100">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                        {flight.outbound.stops === 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                            Direct
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
                        <p className="text-xs text-gray-400">per person</p>
                        </div>
                        <button
                        onClick={() => handleSelect(flight)}
                        disabled={bookingId !== null}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                        style={{ background: "#f59e0b" }}
                        >
                        {bookingId === flight.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <>Select <ChevronRight size={14} /></>}
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
        </div>
    );
}
