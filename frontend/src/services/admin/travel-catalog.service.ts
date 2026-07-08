import api from "@/lib/api";

function cfg() {
    return { withCredentials: true };
}

export interface Airport {
    id:        string;
    iataCode:  string;
    name:      string;
    city:      string;
    country:   string;
    createdAt: string;
}

export interface FlightRoute {
    id:              string;
    partnerId:       string;
    partner:         { id: string; name: string };
    airlineCode:     string;
    originIata:      string;
    originCity:      string;
    destinationIata: string;
    destinationCity: string;
    departureTime:   string;
    durationMinutes: number;
    stops:           number;
    basePrice:       string;
    currency:        string;
    operatingDays:   number[];
    isActive:        boolean;
}

export interface HotelRoomType {
    id:            string;
    hotelId:       string;
    name:          string;
    capacity:      number;
    pricePerNight: string;
    currency:      string;
    totalRooms:    number;
    isActive:      boolean;
}

export interface HotelProperty {
    id:         string;
    partnerId:  string;
    partner:    { id: string; name: string };
    name:       string;
    city:       string;
    country:    string;
    address?:   string | null;
    starRating?: number | null;
    imageUrl?:  string | null;
    isActive:   boolean;
    roomTypes:  HotelRoomType[];
}

export interface TrainRoute {
    id:                 string;
    partnerId:          string;
    partner:            { id: string; name: string };
    originCity:         string;
    originStation:      string;
    destinationCity:    string;
    destinationStation: string;
    departureTime:      string;
    durationMinutes:    number;
    basePrice:          string;
    currency:           string;
    travelClass:        string;
    operatingDays:      number[];
    isActive:           boolean;
}

export interface CarRentalVehicle {
    id:           string;
    partnerId:    string;
    partner:      { id: string; name: string };
    category:     string;
    brand:        string;
    model:        string;
    city:         string;
    country:      string;
    pricePerDay:  string;
    currency:     string;
    seats:        number;
    transmission: string;
    imageUrl?:    string | null;
    isActive:     boolean;
}

export const travelCatalogService = {
    // ── Aéroports ──────────────────────────────────────────────────────────────
    async listAirports(): Promise<Airport[]> {
        const { data } = await api.get("/flights/admin/airports", cfg());
        return data;
    },
    async createAirport(body: Partial<Airport>): Promise<Airport> {
        const { data } = await api.post("/flights/admin/airports", body, cfg());
        return data;
    },
    async updateAirport(id: string, body: Partial<Airport>): Promise<Airport> {
        const { data } = await api.patch(`/flights/admin/airports/${id}`, body, cfg());
        return data;
    },
    async deleteAirport(id: string): Promise<void> {
        await api.delete(`/flights/admin/airports/${id}`, cfg());
    },

    // ── Routes aériennes ──────────────────────────────────────────────────────
    async listFlightRoutes(): Promise<FlightRoute[]> {
        const { data } = await api.get("/flights/admin/routes", cfg());
        return data;
    },
    async createFlightRoute(body: Record<string, unknown>): Promise<FlightRoute> {
        const { data } = await api.post("/flights/admin/routes", body, cfg());
        return data;
    },
    async updateFlightRoute(id: string, body: Record<string, unknown>): Promise<FlightRoute> {
        const { data } = await api.patch(`/flights/admin/routes/${id}`, body, cfg());
        return data;
    },
    async deleteFlightRoute(id: string): Promise<void> {
        await api.delete(`/flights/admin/routes/${id}`, cfg());
    },

    // ── Hôtels ────────────────────────────────────────────────────────────────
    async listHotelProperties(): Promise<HotelProperty[]> {
        const { data } = await api.get("/hotels/admin/properties", cfg());
        return data;
    },
    async createHotelProperty(body: Record<string, unknown>): Promise<HotelProperty> {
        const { data } = await api.post("/hotels/admin/properties", body, cfg());
        return data;
    },
    async updateHotelProperty(id: string, body: Record<string, unknown>): Promise<HotelProperty> {
        const { data } = await api.patch(`/hotels/admin/properties/${id}`, body, cfg());
        return data;
    },
    async deleteHotelProperty(id: string): Promise<void> {
        await api.delete(`/hotels/admin/properties/${id}`, cfg());
    },
    async createHotelRoomType(body: Record<string, unknown>): Promise<HotelRoomType> {
        const { data } = await api.post("/hotels/admin/room-types", body, cfg());
        return data;
    },
    async updateHotelRoomType(id: string, body: Record<string, unknown>): Promise<HotelRoomType> {
        const { data } = await api.patch(`/hotels/admin/room-types/${id}`, body, cfg());
        return data;
    },
    async deleteHotelRoomType(id: string): Promise<void> {
        await api.delete(`/hotels/admin/room-types/${id}`, cfg());
    },

    // ── Trains ────────────────────────────────────────────────────────────────
    async listTrainRoutes(): Promise<TrainRoute[]> {
        const { data } = await api.get("/trains/admin/routes", cfg());
        return data;
    },
    async createTrainRoute(body: Record<string, unknown>): Promise<TrainRoute> {
        const { data } = await api.post("/trains/admin/routes", body, cfg());
        return data;
    },
    async updateTrainRoute(id: string, body: Record<string, unknown>): Promise<TrainRoute> {
        const { data } = await api.patch(`/trains/admin/routes/${id}`, body, cfg());
        return data;
    },
    async deleteTrainRoute(id: string): Promise<void> {
        await api.delete(`/trains/admin/routes/${id}`, cfg());
    },

    // ── Location de véhicules ─────────────────────────────────────────────────
    async listCarRentalVehicles(): Promise<CarRentalVehicle[]> {
        const { data } = await api.get("/car-rentals/admin/vehicles", cfg());
        return data;
    },
    async createCarRentalVehicle(body: Record<string, unknown>): Promise<CarRentalVehicle> {
        const { data } = await api.post("/car-rentals/admin/vehicles", body, cfg());
        return data;
    },
    async updateCarRentalVehicle(id: string, body: Record<string, unknown>): Promise<CarRentalVehicle> {
        const { data } = await api.patch(`/car-rentals/admin/vehicles/${id}`, body, cfg());
        return data;
    },
    async deleteCarRentalVehicle(id: string): Promise<void> {
        await api.delete(`/car-rentals/admin/vehicles/${id}`, cfg());
    },
};
