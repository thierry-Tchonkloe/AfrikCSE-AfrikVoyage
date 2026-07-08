import api from "@/lib/api";

function cfg() {
    return { withCredentials: true };
}

export interface HotelOffer {
    id:            string;
    partnerId:     string;
    name:          string;
    city:          string;
    country:       string;
    starRating:    number | null;
    imageUrl:      string | null;
    roomTypeId:    string;
    roomTypeName:  string;
    capacity:      number;
    pricePerNight: number;
    currency:      string;
}

export const hotelsService = {
    async search(city: string): Promise<HotelOffer[]> {
        const { data } = await api.get("/hotels/search", { params: { city }, ...cfg() });
        return data;
    },

    async getCities(): Promise<string[]> {
        const { data } = await api.get("/hotels/cities", cfg());
        return data;
    },
};
