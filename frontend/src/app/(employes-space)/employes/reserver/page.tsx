"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plane, Hotel, Train, Car, Filter, ChevronLeft, ChevronRight, Wifi } from "lucide-react";
import { toast } from "sonner";

type TabType = "Flights" | "Hotels" | "Trains" | "Car Rental";

const MOCK_FLIGHTS = [
    { id: "1", depart: "07:20", arrive: "11:40", duration: "4h 20m nonstop", price: 92500, policy: true,  wifi: true,  direct: true,  airline: "Air Peace" },
    { id: "2", depart: "07:20", arrive: "11:40", duration: "4h 20m nonstop", price: 72500, policy: true,  wifi: true,  direct: true,  airline: "Ark Air" },
    { id: "3", depart: "07:20", arrive: "11:40", duration: "4h 20m nonstop", price: 62500, policy: false, wifi: false, direct: true,  airline: "Ethiopian" },
];

const AIRLINES = ["Air Peace (12)", "Ark Air (8)", "Ethiopian Airlines (6)"];
const STOPS    = ["Direct", "1 Stop", "2+ Stops"];
const TIMES    = ["Morning (6AM – 12PM)", "Afternoon (12PM – 6PM)", "Evening (6PM – 12AM)"];

export default function ReserverPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("Flights");
    const [tripType, setTripType]   = useState("roundtrip");
    const [directOnly, setDirectOnly] = useState(false);

    const [from, setFrom]           = useState("Lagos (LOS)");
    const [to, setTo]               = useState("Abuja (ABV)");
    const [departure, setDeparture] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [passengers, setPassengers] = useState("1 Adult");

    const [priceRange, setPriceRange] = useState([50000, 500000]);
    const [sortBy, setSortBy]         = useState("Price (Low to High)");
    const [searchDone, setSearchDone] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const TABS: { id: TabType; icon: React.ElementType }[] = [
        { id: "Flights",    icon: Plane },
        { id: "Hotels",     icon: Hotel },
        { id: "Trains",     icon: Train },
        { id: "Car Rental", icon: Car },
    ];

    const handleSearch = () => {
        if (!from || !to) { toast.error("Renseignez départ et destination"); return; }
        setSearchDone(true);
        toast.success("Recherche effectuée — 24 résultats trouvés");
    };

    const handleSelect = (flight: typeof MOCK_FLIGHTS[0]) => {
        toast.success(`Vol ${flight.airline} sélectionné — €${(flight.price / 655.957).toFixed(0)}`);
        router.push("/employes/voyages");
    };

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
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <div className="relative">
                    <Plane size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={from} onChange={(e) => setFrom(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <div className="relative">
                    <Plane size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" />
                    <input value={to} onChange={(e) => setTo(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
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
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold"
                    style={{ background: "#0f766e" }}
                >
                    <Search size={16} /> Search Flights
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
                    <span>₦50,000</span><span>₦500,000</span>
                </div>
                <input type="range" min="50000" max="500000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-teal-600" />
                </div>

                {/* Compagnies */}
                <div>
                <p className="text-xs font-medium text-gray-700 mb-2">compagnies aériennes</p>
                {AIRLINES.map((a) => (
                    <label key={a} className="flex items-center gap-2 text-xs text-gray-600 mb-1.5 cursor-pointer">
                    <input type="checkbox" className="w-3.5 h-3.5"
                        style={{ accentColor: "#0f766e" }} />
                    {a}
                    </label>
                ))}
                </div>

                {/* Heure départ */}
                <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Departure Time</p>
                {TIMES.map((t) => (
                    <label key={t} className="flex items-center gap-2 text-xs text-gray-600 mb-1.5 cursor-pointer">
                    <input type="checkbox" className="w-3.5 h-3.5"
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
                    <p className="text-xs text-gray-500">24 results found</p>
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

                {MOCK_FLIGHTS.map((flight) => (
                <div key={flight.id}
                    className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs text-gray-400 mb-3">Nov 10, 2025</p>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* Infos vol */}
                    <div className="flex items-center gap-4">
                        <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: "#eff6ff" }}
                        >
                        <Plane size={18} style={{ color: "#3b82f6" }} />
                        </div>
                        <div className="flex items-center gap-2">
                        <div className="text-center">
                            <p className="font-bold text-gray-900">{flight.depart}</p>
                            <div className="w-2 h-2 rounded-full bg-orange-400 mx-auto mt-1" />
                        </div>
                        <div className="text-center px-3">
                            <p className="text-xs text-gray-500 whitespace-nowrap">{flight.duration}</p>
                            <div className="w-16 h-px bg-gray-300 my-1 relative">
                            <Plane size={10} className="absolute -top-1.5 right-0 text-gray-400" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-gray-900">{flight.arrive}</p>
                            <div className="w-2 h-2 rounded-full bg-green-400 mx-auto mt-1" />
                        </div>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                        {flight.policy && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "#f0fdf4", color: "#0f766e" }}>
                            Policy Compliant
                        </span>
                        )}
                        {flight.direct && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                            Direct
                        </span>
                        )}
                        {flight.wifi && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            <Wifi size={11} /> Wi-Fi Available
                        </span>
                        )}
                        {!flight.wifi && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            <Wifi size={11} /> without Wi-Fi
                        </span>
                        )}
                    </div>

                    {/* Prix + bouton */}
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                        <p className="font-bold text-gray-900 text-lg">
                            ₦{flight.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">per person</p>
                        </div>
                        <button
                        onClick={() => handleSelect(flight)}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-white text-sm font-semibold"
                        style={{ background: "#f59e0b" }}
                        >
                        Select <ChevronRight size={14} />
                        </button>
                    </div>
                    </div>
                </div>
                ))}

                {/* Pagination */}
                <div className="flex justify-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <ChevronLeft size={16} />
                </button>
                {[1, 2, 3].map((p) => (
                    <button key={p} onClick={() => setCurrentPage(p)}
                    className="w-9 h-9 rounded-lg text-sm font-medium"
                    style={currentPage === p
                        ? { background: "#0f766e", color: "white" }
                        : { color: "#6b7280" }}>
                    {p}
                    </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(3, p + 1))}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <ChevronRight size={16} />
                </button>
                </div>
            </div>
            </div>
        )}
        </div>
    );
}