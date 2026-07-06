"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { partnerSessionStore, PartnerSession } from "@/services/partner/partner-portal.service";

export function usePartnerAuth() {
    const [session, setSession] = useState<PartnerSession | null>(null);
    const [loading, setLoading] = useState(true);
    const router                = useRouter();

    useEffect(() => {
        const s = partnerSessionStore.get();
        setSession(s);
        setLoading(false);
    }, []);

    const logout = () => {
        partnerSessionStore.clear();
        router.push("/login");
    };

    return { session, loading, logout };
}
