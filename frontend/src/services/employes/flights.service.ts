import api from "@/lib/api";

function cfg() {
    return { withCredentials: true };
}

export interface AirportOption {
    iataCode: string;
    name:     string;
    city:     string;
    country:  string;
}

export interface FlightLeg {
    from:       string;
    to:         string;
    departTime: string;
    arriveTime: string;
    departDate: string;
    duration:   string;
    stops:      number;
}

export interface FlightOffer {
    id:          string;
    partnerId:   string;
    routeId:     string;
    airline:     string;
    airlineCode: string;
    price:       number;
    currency:    string;
    outbound:    FlightLeg;
    inbound?:    FlightLeg;
}

export const flightsService = {
    async search(params: {
        from: string;
        to: string;
        departureDate: string;
        returnDate?: string;
        adults?: number;
        nonStop?: boolean;
        currency?: string;
    }): Promise<FlightOffer[]> {
        const { data } = await api.get("/flights/search", { params, ...cfg() });
        return data;
    },

    async searchAirports(keyword: string): Promise<AirportOption[]> {
        const { data } = await api.get("/flights/airports", { params: { keyword }, ...cfg() });
        return data;
    },
};
