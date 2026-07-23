import { PartnerUser, PartnerLocation, Partner, Booking, PartnerSessionUser } from "@/types";
import api from "@/lib/api";

export interface OfferInput {
    title:          string;
    description?:   string;
    imageUrl?:      string;
    category:       string;
    employeePrice:  number;
    companyPrice:   number;
    subsidyPct?:    number;
    stock?:         number;
    validUntil?:    string;
    requiresTicket?: boolean;
    city?:          string;
    region?:        string;
    country?:       string;
    isActive?:      boolean;
}

export interface PartnerOffer {
    id:            string;
    title:         string;
    description?:  string | null;
    imageUrl?:     string | null;
    category:      string;
    employeePrice: number;
    companyPrice:  number;
    subsidyPct:    number;
    stock?:        number | null;
    validUntil?:   string | null;
    isActive:      boolean;
    createdAt:     string;
}

export interface ProfileInput {
    name?:         string;
    sector?:       string;
    description?:  string;
    contactEmail?: string;
    websiteUrl?:   string;
    phone?:        string;
}

export interface AvailabilitySlot {
    dayOfWeek?: number | null;
    openTime:   string;
    closeTime:  string;
    isClosed:   boolean;
}

// Tous les appels utilisent les cookies HTTP-only dédiés partnerAccessToken/
// partnerRefreshToken (withCredentials:true) — distincts des cookies User, pour
// qu'une session partenaire n'interfère jamais avec une session standard sur le
// même navigateur.
export const partnerAuthService = {
    async login(email: string, password: string): Promise<{ user: PartnerSessionUser }> {
        const { data } = await api.post("/partner-portal/login", { email, password });
        return data;
    },

    async logout(): Promise<void> {
        await api.post("/partner-portal/logout");
    },

    async getMe(): Promise<{ user: PartnerSessionUser }> {
        const { data } = await api.get("/partner-portal/me");
        return data;
    },
};

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

    async getProfile(): Promise<Partner> {
        const { data } = await api.get<Partner>(`/partner-portal/profile`);
        return data;
    },

    async updateProfile(payload: ProfileInput): Promise<Partner> {
        const { data } = await api.patch<Partner>(`/partner-portal/profile`, payload);
        return data;
    },

    async listLocations(): Promise<PartnerLocation[]> {
        const partner = await partnerPortalService.getProfile();
        return (partner as unknown as { locations?: PartnerLocation[] }).locations ?? [];
    },

    async createLocation(payload: Partial<PartnerLocation>): Promise<PartnerLocation> {
        const { data } = await api.post<PartnerLocation>(`/partner-portal/locations`, payload);
        return data;
    },

    async updateLocation(id: string, payload: Partial<PartnerLocation>): Promise<PartnerLocation> {
        const { data } = await api.patch<PartnerLocation>(`/partner-portal/locations/${id}`, payload);
        return data;
    },

    async deleteLocation(id: string): Promise<void> {
        await api.delete(`/partner-portal/locations/${id}`);
    },

    async setAvailabilities(locationId: string, slots: AvailabilitySlot[]): Promise<void> {
        await api.put(`/partner-portal/locations/${locationId}/availabilities`, { slots });
    },

    async listOffers(): Promise<PartnerOffer[]> {
        const { data } = await api.get<PartnerOffer[]>(`/partner-portal/offers`);
        return data;
    },

    async createOffer(payload: OfferInput): Promise<PartnerOffer> {
        const { data } = await api.post<PartnerOffer>(`/partner-portal/offers`, payload);
        return data;
    },

    async updateOffer(id: string, payload: Partial<OfferInput>): Promise<PartnerOffer> {
        const { data } = await api.patch<PartnerOffer>(`/partner-portal/offers/${id}`, payload);
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
