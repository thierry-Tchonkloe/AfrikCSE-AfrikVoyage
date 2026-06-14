"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { plansService, PublicPlan } from "@/services/admin/plans.service";

function PricingSkeleton() {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-8 animate-pulse">
                    <div className="h-5 w-24 bg-slate-200 rounded mb-4" />
                    <div className="h-8 w-32 bg-slate-200 rounded mb-6" />
                    <div className="space-y-3">
                        {[0, 1, 2, 3].map((j) => (
                            <div key={j} className="h-3 w-full bg-slate-100 rounded" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function PricingPage() {
    const [plans, setPlans] = useState<PublicPlan[] | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        plansService.getPublic()
            .then(setPlans)
            .catch(() => setError(true));
    }, []);

    return (
        <main className="min-h-screen font-sans antialiased bg-white text-slate-900">
            {/* ── HERO ── */}
            <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white py-20 lg:py-28">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                        Tarification transparente
                    </span>
                    <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl leading-[1.05]">
                        Un plan pour chaque{" "}
                        <span className="text-indigo-600">étape de votre croissance</span>
                    </h1>
                    <p className="mt-4 text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        Choisissez le plan adapté à la taille de votre organisation.
                        Tous les plans incluent un accompagnement à l&apos;activation.
                    </p>
                </div>
            </section>

            {/* ── PLANS ── */}
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 font-medium text-center">
                        Impossible de charger les tarifs pour le moment. Veuillez réessayer plus tard.
                    </div>
                )}

                {!plans && !error && <PricingSkeleton />}

                {plans && (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {plans.map((plan) => {
                            const isBusiness = plan.name === "BUSINESS";
                            return (
                                <div
                                    key={plan.name}
                                    className={`relative rounded-2xl border p-8 flex flex-col transition-shadow ${
                                        isBusiness
                                            ? "border-indigo-300 bg-slate-900 text-white shadow-xl shadow-indigo-200/50 lg:scale-105"
                                            : "border-slate-200 bg-white text-slate-900 hover:shadow-sm"
                                    }`}
                                >
                                    {isBusiness && (
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-widest text-white bg-indigo-600 px-3 py-1 rounded-full">
                                            Le plus populaire
                                        </span>
                                    )}
                                    <h2 className={`text-lg font-black tracking-tight ${isBusiness ? "text-white" : "text-slate-900"}`}>
                                        {plan.label}
                                    </h2>
                                    <p className={`mt-3 text-3xl font-black ${isBusiness ? "text-white" : "text-slate-900"}`}>
                                        {plan.price}
                                    </p>
                                    <p className={`mt-2 text-sm ${isBusiness ? "text-slate-300" : "text-slate-500"}`}>
                                        {plan.maxUsers ? `Jusqu'à ${plan.maxUsers} utilisateurs` : "Utilisateurs illimités"}
                                    </p>

                                    <ul className="mt-6 space-y-3 flex-1">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className={`flex items-start gap-2 text-sm ${isBusiness ? "text-slate-200" : "text-slate-600"}`}>
                                                <span className={isBusiness ? "text-emerald-400" : "text-emerald-500"}>✓</span>
                                                {feature}
                                            </li>
                                        ))}
                                        <li className={`flex items-start gap-2 text-sm ${isBusiness ? "text-slate-200" : "text-slate-600"}`}>
                                            <span className={isBusiness ? "text-emerald-400" : "text-emerald-500"}>✓</span>
                                            Module AfrikVoyage {plan.hasVoyage ? "inclus" : "non inclus"}
                                        </li>
                                    </ul>

                                    <Link
                                        href="/infos/contact"
                                        className={`mt-8 block text-center rounded-xl px-6 py-3 text-sm font-bold transition-colors ${
                                            isBusiness
                                                ? "bg-white text-slate-950 hover:bg-slate-100"
                                                : "bg-slate-900 text-white hover:bg-slate-800"
                                        }`}
                                    >
                                        Demander une démo
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
