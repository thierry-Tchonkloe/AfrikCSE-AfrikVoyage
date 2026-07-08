import api from "@/lib/api";

function cfg() {
    return { withCredentials: true };
}

export interface TrainOffer {
    id:                 string;
    partnerId:          string;
    routeId:            string;
    operator:           string;
    originCity:         string;
    originStation:      string;
    destinationCity:    string;
    destinationStation: string;
    departureTime:      string;
    arriveTime:         string;
    duration:            string;
    travelClass:        string;
    price:               number;
    currency:            string;
}

export const trainsService = {
    async search(from: string, to: string): Promise<TrainOffer[]> {
        const { data } = await api.get("/trains/search", { params: { from, to }, ...cfg() });
        return data;
    },

    async getCities(): Promise<string[]> {
        const { data } = await api.get("/trains/cities", cfg());
        return data;
    },
};
