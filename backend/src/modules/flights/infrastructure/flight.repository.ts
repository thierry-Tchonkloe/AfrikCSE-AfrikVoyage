import { amadeusGet } from "./amadeus.client";

interface AmadeusSegment {
    departure: { iataCode: string; at: string };
    arrival: { iataCode: string; at: string };
    carrierCode: string;
    numberOfStops: number;
}

interface AmadeusItinerary {
    duration: string;
    segments: AmadeusSegment[];
}

interface AmadeusOffer {
    id: string;
    itineraries: AmadeusItinerary[];
    price: { currency: string; total: string };
    validatingAirlineCodes?: string[];
}

interface FlightOffersResponse {
    data: AmadeusOffer[];
    dictionaries?: { carriers?: Record<string, string> };
}

interface AmadeusLocationEntry {
    iataCode: string;
    name: string;
    subType: string;
    address?: { cityName?: string; countryName?: string };
}

interface LocationsResponse {
    data: AmadeusLocationEntry[];
}

export interface FlightLeg {
    from: string;
    to: string;
    departTime: string;
    arriveTime: string;
    departDate: string;
    duration: string;
    stops: number;
}

export interface FlightOffer {
    id: string;
    airline: string;
    airlineCode: string;
    price: number;
    currency: string;
    outbound: FlightLeg;
    inbound?: FlightLeg;
}

export interface AirportResult {
    iataCode: string;
    name: string;
    city?: string;
    country?: string;
    subType: string;
}

function formatDuration(iso: string): string {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    const hours = match?.[1] ? `${match[1]}h ` : "";
    const minutes = match?.[2] ? `${match[2]}m` : "";
    return `${hours}${minutes}`.trim() || "—";
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function mapItinerary(itinerary: AmadeusItinerary): FlightLeg {
    const segments = itinerary.segments;
    const first = segments[0]!;
    const last = segments[segments.length - 1]!;
    const stops = (segments.length - 1) + segments.reduce((sum, seg) => sum + seg.numberOfStops, 0);

    return {
        from: first.departure.iataCode,
        to: last.arrival.iataCode,
        departTime: formatTime(first.departure.at),
        arriveTime: formatTime(last.arrival.at),
        departDate: first.departure.at.slice(0, 10),
        duration: formatDuration(itinerary.duration),
        stops,
    };
}

export class FlightRepository {
    async searchFlights(params: {
        originLocationCode: string;
        destinationLocationCode: string;
        departureDate: string;
        returnDate?: string;
        adults: number;
        nonStop?: boolean;
        currencyCode: string;
    }): Promise<FlightOffer[]> {
        const response = await amadeusGet<FlightOffersResponse>("/v2/shopping/flight-offers", {
            originLocationCode: params.originLocationCode,
            destinationLocationCode: params.destinationLocationCode,
            departureDate: params.departureDate,
            returnDate: params.returnDate,
            adults: params.adults,
            nonStop: params.nonStop,
            currencyCode: params.currencyCode,
            max: 20,
        });

        const carriers = response.dictionaries?.carriers ?? {};

        return response.data.map((offer) => {
            const carrierCode = offer.validatingAirlineCodes?.[0] ?? offer.itineraries[0]!.segments[0]!.carrierCode;
            return {
                id: offer.id,
                airline: carriers[carrierCode] ?? carrierCode,
                airlineCode: carrierCode,
                price: parseFloat(offer.price.total),
                currency: offer.price.currency,
                outbound: mapItinerary(offer.itineraries[0]!),
                inbound: offer.itineraries[1] ? mapItinerary(offer.itineraries[1]) : undefined,
            };
        });
    }

    async searchLocations(keyword: string): Promise<AirportResult[]> {
        const response = await amadeusGet<LocationsResponse>("/v1/reference-data/locations", {
            keyword,
            subType: "AIRPORT,CITY",
            "page[limit]": 8,
        });

        return response.data.map((loc) => ({
            iataCode: loc.iataCode,
            name: loc.name,
            city: loc.address?.cityName,
            country: loc.address?.countryName,
            subType: loc.subType,
        }));
    }
}
