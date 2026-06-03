// "use client";

// import { useState, useEffect } from "react";
// import { useRouter, usePathname } from "next/navigation";
// import { useAuth } from "@/hooks/useAuth";
// import {
//     LayoutDashboard, Plane, FileText, BarChart2,
//     Bell, Settings, ChevronLeft, ChevronRight,
//     LogOut, Menu, Moon, Sun, Gift, ArrowLeftRight,Shield,
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { toast } from "sonner";

// // const NAV_ITEMS = [
// //     { href: "/companies/AfrikVoyage/dashboard",    label: "Tableau de bord", icon: LayoutDashboard },
// //     { href: "/companies/AfrikVoyage/reservations", label: "Réservations",    icon: Plane },
// //     { href: "/companies/AfrikVoyage/frais",        label: "Notes de frais",  icon: FileText },
// //     { href: "/companies/AfrikVoyage/reporting",    label: "Reporting",       icon: BarChart2 },
// //     { href: "/companies/AfrikVoyage/settings",     label: "Paramètres",      icon: Settings },
// // ];

// const NAV_ITEMS = [
//     { href: "/companies/AfrikVoyage/dashboard",    label: "Tableau de bord", icon: LayoutDashboard },
"use client";

import React from "react";

// Minimal layout to ensure this file is a module and fix TS errors during build.
export default function AfrikVoyageLayout({ children }: { children: React.ReactNode }) {
	return (
        <>
            <div className=" px-4 py-6 lg:px-8">
                {children}
            </div>
        </>
    );
}