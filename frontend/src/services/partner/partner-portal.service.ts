import { PartnerUser, PartnerLocation, PartnerProfile, Booking, PartnerSessionUser, PartnerSettings, PartnerPaymentMethod, PartnerPaymentMethodType } from "@/types";
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
}

export type OfferReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

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
    reviewStatus:  OfferReviewStatus;
    reviewNote?:   string | null;
    createdAt:     string;
}

export interface FinanceEntry {
    id:               string;
    bookingId:        string;
    date:             string;
    grossAmount:      number;
    commissionAmount: number;
    netAmount:        number;
    currencyCode:     string;
    // "CLAIMED" = déjà rattachée à un payout (versé ou en attente de traitement) ;
    // "AVAILABLE" = comptée dans le solde net disponible ci-dessous.
    payoutStatus:     "AVAILABLE" | "CLAIMED";
}

export interface FinanceSummary {
    grossRevenue:     number;
    totalCommissions: number;
    netBalance:       number;
    currencyCode:     string;
    history: {
        entries:    FinanceEntry[];
        total:      number;
        page:       number;
        totalPages: number;
    };
}

export interface ProfileInput {
    name?:         string;
    sector?:       string;
    description?:  string;
    contactEmail?: string;
    websiteUrl?:   string;
    phone?:        string;
    logoUrl?:      string;
}

export interface AvailabilitySlot {
    dayOfWeek?: number | null;
    openTime:   string;
    closeTime:  string;
    isClosed:   boolean;
}

export interface LocationInput {
    name?:      string;
    address?:   string;
    city?:      string;
    country?:   string;
    phone?:     string;
    isMain?:    boolean;
    mapsUrl?:   string;
    latitude?:  number;
    longitude?: number;
}

export const SUPPORTED_CURRENCIES = ["XOF", "GHS", "NGN", "EUR", "USD"] as const;

export interface ApiIntegrationInput {
    apiEnabled?: boolean;
    apiBaseUrl?: string;
    apiFormat?:  string;
    apiKey?:     string; // omis = clé inchangée
}

export interface PaymentMethodInput {
    type:     PartnerPaymentMethodType;
    provider: string;
    label:    string;
    details:  Record<string, string>;
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

    async getProfile(): Promise<PartnerProfile> {
        const { data } = await api.get<PartnerProfile>(`/partner-portal/profile`);
        return data;
    },

    async updateProfile(payload: ProfileInput): Promise<PartnerProfile> {
        const { data } = await api.patch<PartnerProfile>(`/partner-portal/profile`, payload);
        return data;
    },

    // Upload + persistance immédiate : le partenaire existe déjà (contrairement aux offres),
    // pas besoin de round-trip séparé via updateProfile.
    async uploadPartnerLogo(file: File): Promise<{ logoUrl: string }> {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await api.post<{ logoUrl: string }>(`/partner-portal/profile/logo`, formData, {
            headers: { "Content-Type": undefined },
        });
        return data;
    },

    async listLocations(): Promise<PartnerLocation[]> {
        const partner = await partnerPortalService.getProfile();
        return partner.locations ?? [];
    },

    async createLocation(payload: LocationInput): Promise<PartnerLocation> {
        const { data } = await api.post<PartnerLocation>(`/partner-portal/locations`, payload);
        return data;
    },

    async updateLocation(id: string, payload: LocationInput): Promise<PartnerLocation> {
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

    // Catégories réelles de l'organisation hôte à laquelle les offres partenaires
    // sont rattachées — remplace l'ancienne liste de catégories codée en dur.
    async listOfferCategories(): Promise<{ id: string; name: string }[]> {
        const { data } = await api.get<{ id: string; name: string }[]>(`/partner-portal/offers/categories`);
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

    async toggleOfferActive(id: string, isActive: boolean): Promise<PartnerOffer> {
        const { data } = await api.patch<PartnerOffer>(`/partner-portal/offers/${id}/toggle-active`, { isActive });
        return data;
    },

    // Upload indépendant de toute offre existante (nécessaire pour permettre l'image dès la
    // création : on l'upload d'abord pour obtenir l'URL, incluse ensuite dans createOffer/updateOffer).
    async uploadOfferImage(file: File): Promise<{ imageUrl: string }> {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await api.post<{ imageUrl: string }>(`/partner-portal/offers/image`, formData, {
            headers: { "Content-Type": undefined },
        });
        return data;
    },

    async getSettings(): Promise<PartnerSettings> {
        const { data } = await api.get<PartnerSettings>(`/partner-portal/settings`);
        return data;
    },

    async updateCurrency(currencyCode: string): Promise<{ currencyCode: string }> {
        const { data } = await api.patch(`/partner-portal/settings/currency`, { currencyCode });
        return data;
    },

    async updateApiIntegration(payload: ApiIntegrationInput): Promise<Pick<PartnerSettings, "apiEnabled" | "apiBaseUrl" | "apiFormat" | "hasApiKey">> {
        const { data } = await api.patch(`/partner-portal/settings/api-integration`, payload);
        return data;
    },

    async listPaymentMethods(): Promise<PartnerPaymentMethod[]> {
        const { data } = await api.get<PartnerPaymentMethod[]>(`/partner-portal/settings/payment-methods`);
        return data;
    },

    async createPaymentMethod(payload: PaymentMethodInput): Promise<PartnerPaymentMethod> {
        const { data } = await api.post<PartnerPaymentMethod>(`/partner-portal/settings/payment-methods`, payload);
        return data;
    },

    async updatePaymentMethod(id: string, payload: Partial<Pick<PaymentMethodInput, "label" | "details">> & { isActive?: boolean }): Promise<PartnerPaymentMethod> {
        const { data } = await api.patch<PartnerPaymentMethod>(`/partner-portal/settings/payment-methods/${id}`, payload);
        return data;
    },

    async deletePaymentMethod(id: string): Promise<void> {
        await api.delete(`/partner-portal/settings/payment-methods/${id}`);
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

    async getFinances(page = 1, limit = 20): Promise<FinanceSummary> {
        const { data } = await api.get<FinanceSummary>(`/partner-portal/finances`, { params: { page, limit } });
        return data;
    },

    async requestPayout(): Promise<{ id: string; netAmount: number; status: string }> {
        const { data } = await api.post(`/partner-portal/finances/payout-requests`);
        return data;
    },
};
