import { PartnerUser, PartnerLocation, Booking } from "@/types";
import api from "@/lib/api";

// PartnerSession conservé pour la compatibilité du hook usePartnerAuth (obsolète)
export interface PartnerSession {
    token:       string;
    user:        Pick<PartnerUser, "id" | "email" | "firstName" | "lastName" | "role" | "partnerId">;
    partnerName: string;
}

export interface OfferInput {
    title:        string;
    description?: string;
    price:        number;
    currencyCode?: string;
    category?:    string;
    capacity?:    number;
    validUntil?:  string;
    isActive?:    boolean;
}

// Conservé pour rétrocompatibilité — plus utilisé depuis la migration cookie
export const partnerSessionStore = {
    get(): PartnerSession | null { return null; },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    set(_: PartnerSession) { /* no-op */ },
    clear() { /* no-op */ },
};

// Tous les appels utilisent désormais les cookies HTTP-only via withCredentials:true.
// Plus besoin d'injecter manuellement le Bearer token.
export const partnerPortalService = {
    async listStaff(): Promise<PartnerUser[]> {
        const { data } = await api.get<PartnerUser[]>(`/partner-portal/staff`);
        return data;
    },

    async createStaff(payload: { email: string; firstName: string; lastName: string; password: string; role?: "PARTNER_ADMIN" | "PARTNER_STAFF" }): Promise<PartnerUser> {
        const { data } = await api.post<PartnerUser>(`/partner-portal/staff`, payload);
        return data;
    },

    async deactivateStaff(id: string): Promise<void> {
        await api.patch(`/partner-portal/staff/${id}/deactivate`);
    },

    async listLocations(): Promise<PartnerLocation[]> {
        const { data } = await api.get<PartnerLocation[]>(`/partner-portal/locations`);
        return data;
    },

    async createLocation(payload: Partial<PartnerLocation>): Promise<PartnerLocation> {
        const { data } = await api.post<PartnerLocation>(`/partner-portal/locations`, payload);
        return data;
    },

    async listOffers(): Promise<unknown[]> {
        const { data } = await api.get(`/partner-portal/offers`);
        return data;
    },

    async createOffer(payload: OfferInput): Promise<unknown> {
        const { data } = await api.post(`/partner-portal/offers`, payload);
        return data;
    },

    async updateOffer(id: string, payload: Partial<OfferInput>): Promise<unknown> {
        const { data } = await api.patch(`/partner-portal/offers/${id}`, payload);
        return data;
    },

    async getPartnerBookings(status?: string, page = 1, limit = 20): Promise<{ bookings: Booking[]; total: number }> {
        const { data } = await api.get(`/bookings/partner`, { params: { status, page, limit } });
        return data;
    },

    async confirmBooking(id: string, notes?: string): Promise<Booking> {
        const { data } = await api.patch(`/bookings/partner/${id}/confirm`, { notes });
        return data;
    },

    async rejectBooking(id: string, reason?: string): Promise<Booking> {
        const { data } = await api.patch(`/bookings/partner/${id}/reject`, { reason });
        return data;
    },

    async completeBooking(id: string): Promise<Booking> {
        const { data } = await api.patch(`/bookings/partner/${id}/complete`);
        return data;
    },
};
