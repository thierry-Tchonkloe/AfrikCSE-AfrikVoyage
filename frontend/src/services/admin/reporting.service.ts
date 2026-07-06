// import axios from "axios";
import api from "@/lib/api";

// const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
//const URL  = `${BASE}/reporting`;

export interface PlatformKpis {
    organizations: { total: number; active: number };
    users:         { total: number; active: number };
    bookings:      { total: number; completed: number };
    orders:        { total: number; totalRevenue: number };
    partners:      { total: number; active: number };
    notifications: { sent: number };
}

export interface BookingStatusItem { status: string; _count: { id: number } }
export interface TrendItem         { month: string; total: number; completed?: number; count?: number; revenue?: number }
export interface TopPartner        { id: string; name: string; category: string | null; _count: { bookings: number; commissionEntries: number } }
export interface CommissionSummary { pendingNet: number; confirmedNet: number; totalCommissions: number }

export interface OrgKpis {
    employees: { total: number; active: number };
    bookings:  { total: number; completed: number };
    wallet:    { totalAllocated: number };
    cashback:  { totalCredited: number };
}

export const reportingService = {
    async platformKpis(): Promise<PlatformKpis> {
        const { data } = await api.get(`/reporting/platform/kpis`, { withCredentials: true });
        return data;
    },
    async bookingsByStatus(): Promise<BookingStatusItem[]> {
        const { data } = await api.get(`/reporting/platform/bookings/status`, { withCredentials: true });
        return data;
    },
    async bookingsTrend(months = 6): Promise<TrendItem[]> {
        const { data } = await api.get(`/reporting/platform/bookings/trend`, { params: { months }, withCredentials: true });
        return data;
    },
    async ordersTrend(months = 6): Promise<TrendItem[]> {
        const { data } = await api.get(`/reporting/platform/orders/trend`, { params: { months }, withCredentials: true });
        return data;
    },
    async topPartners(): Promise<TopPartner[]> {
        const { data } = await api.get(`/reporting/platform/partners/top`, { withCredentials: true });
        return data;
    },
    async commissionSummary(): Promise<CommissionSummary> {
        const { data } = await api.get(`/reporting/platform/commissions`, { withCredentials: true });
        return data;
    },
    async orgKpis(): Promise<OrgKpis> {
        const { data } = await api.get(`/reporting/org/kpis`, { withCredentials: true });
        return data;
    },
    async orgBookingsTrend(months = 6): Promise<TrendItem[]> {
        const { data } = await api.get(`/reporting/org/bookings/trend`, { params: { months }, withCredentials: true });
        return data;
    },
};
