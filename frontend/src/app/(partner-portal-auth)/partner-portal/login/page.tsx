"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /login gère désormais tous les types de comptes (User ET Partenaire) via un
 * point d'entrée unique côté backend — voir auth.service.ts::login().
 */
export default function PartnerLoginRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace("/login"); }, [router]);
    return null;
}
