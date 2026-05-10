"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Share2, Heart, Clock, Check, Loader2 } from "lucide-react";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";

// Mock détail
const MOCK_DETAIL = {
    id: "1",
    title: "Parc Astérix – Billets d'entrée",
    category: "Billetterie & Loisirs",
    description: `Profitez d'une journée inoubliable au Parc Astérix, le parc d'attractions français qui vous plonge dans l'univers des célèbres Gaulois ! Situé à seulement 35 km de Paris, le parc propose plus de 40 attractions pour toute la famille.

    Découvrez des montagnes russes sensationnelles comme Oziris & Tonnerre de Zeus, des spectacles époustouflants et des zones thématiques immersives. Le parc accueille également de nombreux restaurants et boutiques pour prolonger le visite.`,
    includes: [
        "Accès illimité à toutes les attractions",
        "Spectacles et animations inclus",
        "Parking gratuit",
        "Plan du parc et programme des spectacles",
    ],
    publicPrice: 59,
    employeePrice: 29,
    subsidy: 30,
    subsidyPct: 51,
    validUntil: "31/12/2024",
    eligible: 847,
    maxPerFamily: 6,
    eligibility: [
        { icon: "✅", label: "Salariés", desc: "Tous les salariés en CDI ou CDD" },
        { icon: "👨‍👩‍👧", label: "Famille",  desc: "Conjoint(e) et enfants à charge" },
        { icon: "⚠️", label: "Limite",   desc: "Maximum 6 billets par famille" },
    ],
    practical: [
        { label: "Validité",  value: "Billets valables 1 an à partir de la date d'achat" },
        { label: "Horaires",  value: "10h00 – 19h00 (variable selon saison)" },
        { label: "Contact",   value: "Service CSE : cse@entreprise.com" },
    ],
    images: ["🎡", "🎢", "🎪"],
};

export default function AvantageDetailPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [item, setItem]       = useState(MOCK_DETAIL);
    const [loading, setLoading] = useState(false);
    const [isFav, setIsFav]     = useState(false);
    const [using, setUsing]     = useState(false);
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        // Charge le vrai item si dispo
        employeeService.getCatalogItem(id)
        .then((data) => { if (data) setItem({ ...MOCK_DETAIL, ...data }); })
        .catch(() => {}); // garde le mock
    }, [id]);

    const handleUse = async () => {
        setUsing(true);
        await new Promise((r) => setTimeout(r, 1000));
        setUsing(false);
        toast.success("Avantage utilisé ! Votre billet sera envoyé par email.");
    };

    return (
        <div className="max-w-3xl space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
            <button onClick={() => router.push("/employes/avantages")}
            className="hover:underline">Avantages</button>
            <span>/</span>
            <button onClick={() => router.push("/employes/avantages")}
            className="hover:underline">Billetterie & Loisirs</button>
            <span>/</span>
            <span className="text-gray-900">{item.title}</span>
        </div>

        {/* Card principale */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: "#fff7ed" }}
                >
                🎡
                </div>
                <div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "#fff7ed", color: "#f59e0b" }}>
                    {item.category}
                </span>
                <h1 className="text-lg font-bold text-gray-900 mt-1">{item.title}</h1>
                <p className="text-xs text-gray-500">
                    ✅ Validé jusqu&#39;au {item.validUntil} &nbsp;·&nbsp;
                    👥 {item.eligible} bénéficiaires éligibles
                </p>
                </div>
            </div>
            <button
                onClick={() => toast.info("Lien copié !")}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
                <Share2 size={13} /> Partager
            </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Gauche : image + description */}
            <div className="lg:col-span-2 space-y-4">
                {/* Image principale */}
                <div
                className="h-52 rounded-xl flex items-center justify-center text-7xl"
                style={{ background: "#fff7ed" }}
                >
                {item.images[activeImage]}
                </div>

                {/* Thumbnails */}
                <div className="flex gap-2">
                {item.images.map((img, i) => (
                    <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className="w-16 h-12 rounded-lg flex items-center justify-center text-2xl border-2 transition-all"
                    style={{
                        borderColor: activeImage === i ? "#f59e0b" : "#e5e7eb",
                        background: "#fff7ed",
                    }}
                    >
                    {img}
                    </button>
                ))}
                </div>

                {/* Description */}
                <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description de l&#39;offre</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                    {item.description}
                </p>
                </div>

                {/* Inclus */}
                <div>
                <h3 className="font-semibold text-gray-900 mb-2">Inclus dans votre billet :</h3>
                <ul className="space-y-1.5">
                    {item.includes.map((inc) => (
                    <li key={inc} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check size={15} style={{ color: "#0f766e" }} /> {inc}
                    </li>
                    ))}
                </ul>
                </div>
            </div>

            {/* Droite : prix + actions */}
            <div className="space-y-4">
                {/* Prix */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div>
                    <p className="text-3xl font-bold text-gray-900">€{item.employeePrice}</p>
                    <p className="text-xs text-gray-400 line-through">
                    Prix public €{item.publicPrice}
                    </p>
                    <p className="text-sm font-semibold" style={{ color: "#10b981" }}>
                    Économisez €{item.subsidy} ({item.subsidyPct}%)
                    </p>
                </div>
                <div className="space-y-1.5 text-sm border-t border-gray-100 pt-3">
                    {[
                    { label: "Subvention CSE",   value: `€${item.subsidy}`, color: "#0f766e" },
                    { label: "Votre participation", value: `€${item.employeePrice}`, color: "#111" },
                    { label: "Total à payer",    value: `€${item.employeePrice}`, color: "#111", bold: true },
                    ].map((row) => (
                    <div key={row.label} className="flex justify-between">
                        <span className="text-gray-500 text-xs">{row.label}</span>
                        <span
                        className={`text-xs ${row.bold ? "font-bold" : "font-medium"}`}
                        style={{ color: row.color }}
                        >
                        {row.value}
                        </span>
                    </div>
                    ))}
                </div>

                <button
                    onClick={handleUse}
                    disabled={using}
                    className="w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ background: "#0f766e" }}
                >
                    {using
                    ? <Loader2 size={15} className="animate-spin" />
                    : "🎁"}
                    Utiliser l&#39;avantage
                </button>

                <button
                    onClick={() => setIsFav(!isFav)}
                    className="w-full py-2 rounded-lg border border-gray-200 text-sm flex items-center justify-center gap-2"
                    style={{ color: isFav ? "#ef4444" : "#6b7280" }}
                >
                    <Heart size={15} fill={isFav ? "#ef4444" : "none"} />
                    {isFav ? "Retiré des favoris" : "Ajouter aux favoris"}
                </button>

                <div
                    className="flex items-center gap-2 text-xs p-2.5 rounded-lg"
                    style={{ background: "#fffbeb", color: "#92400e" }}
                >
                    <Clock size={13} />
                    Offre limitée – Plus que 15 jours
                </div>
                </div>

                {/* Éligibilité */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-sm text-gray-900">Conditions d&#39;éligibilité</h4>
                {item.eligibility.map((e) => (
                    <div key={e.label} className="flex items-start gap-2">
                    <span className="text-base shrink-0">{e.icon}</span>
                    <div>
                        <p className="text-xs font-semibold text-gray-900">{e.label}</p>
                        <p className="text-xs text-gray-500">{e.desc}</p>
                    </div>
                    </div>
                ))}
                </div>

                {/* Infos pratiques */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                <h4 className="font-semibold text-sm text-gray-900">Informations pratiques</h4>
                {item.practical.map((p) => (
                    <div key={p.label}>
                    <p className="text-xs font-medium text-gray-700">{p.label}</p>
                    <p className="text-xs text-gray-500">{p.value}</p>
                    </div>
                ))}
                </div>
            </div>
            </div>
        </div>
        </div>
    );
}