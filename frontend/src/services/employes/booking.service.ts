// import axios from "axios";
import { Booking, BookingRating } from "@/types";
import api from "@/lib/api";

export interface CreateBookingPayload {
    partnerId:       string;
    offerId?:        string;
    locationId?:     string;
    bookingDate:     string;
    numberOfPersons?: number;
    notes?:          string;
    idempotencyKey:  string;
    paymentMethod:   "WALLET" | "MOBILE_MONEY" | "CARD";
    amount:          number;
}

export const bookingService = {
    async create(payload: CreateBookingPayload): Promise<Booking> {
        const { data } = await api.post(`/bookings`, payload, { withCredentials: true });
        return data;
    },

    async getMyBookings(page = 1, limit = 20): Promise<{ bookings: Booking[]; total: number; page: number; limit: number }> {
        const { data } = await api.get(`/bookings`, {
            params: { page, limit },
            withCredentials: true,
        });
        return data;
    },

    async getById(id: string): Promise<Booking> {
        const { data } = await api.get(`/bookings/${id}`, { withCredentials: true });
        return data;
    },

    async cancel(id: string, reason?: string): Promise<void> {
        await api.delete(`/bookings/${id}`, {
            data: { reason },
            withCredentials: true,
        });
    },

    async rate(id: string, score: number, comment?: string): Promise<BookingRating> {
        const { data } = await api.post(`/bookings/${id}/rate`, { score, comment }, { withCredentials: true });
        return data;
    },
};
