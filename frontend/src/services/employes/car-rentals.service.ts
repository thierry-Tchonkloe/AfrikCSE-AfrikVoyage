import api from "@/lib/api";

function cfg() {
    return { withCredentials: true };
}

export interface CarRentalOffer {
    id:           string;
    partnerId:    string;
    agency:       string;
    category:     string;
    brand:        string;
    model:        string;
    city:         string;
    country:      string;
    seats:        number;
    transmission: string;
    imageUrl:     string | null;
    pricePerDay:  number;
    currency:     string;
}

export const carRentalsService = {
    async search(city: string, category?: string): Promise<CarRentalOffer[]> {
        const { data } = await api.get("/car-rentals/search", { params: { city, category }, ...cfg() });
        return data;
    },

    async getCities(): Promise<string[]> {
        const { data } = await api.get("/car-rentals/cities", cfg());
        return data;
    },
};
