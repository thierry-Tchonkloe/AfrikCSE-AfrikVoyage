"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Download, CreditCard } from "lucide-react";
import { employeeService } from "@/services/employes/employee.service";
import { toast } from "sonner";

interface MemberCardData {
    memberId:    string;
    firstName:   string;
    lastName:    string;
    email:       string;
    avatar:      string | null;
    orgName:     string;
    orgLogoUrl:  string | null;
    memberSince: string;
    qrData:      string;
}

export default function CarteMembre() {
    const [card, setCard]     = useState<MemberCardData | null>(null);
    const [loading, setLoading] = useState(true);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await employeeService.getMemberCard();
                setCard(data);
            } catch {
                toast.error("Erreur chargement de la carte membre");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleDownload = () => {
        if (!card) return;
        const svgEl = cardRef.current?.querySelector("svg");
        if (!svgEl) { toast.error("QR code introuvable"); return; }
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qr-carte-membre-${card.memberId}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Carte de membre</h1>
                    <p className="text-sm text-gray-500">Votre carte CSE numérique</p>
                </div>
                <div className="max-w-sm mx-auto h-56 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
        );
    }

    if (!card) return null;

    const initials = `${card.firstName?.[0] ?? ""}${card.lastName?.[0] ?? ""}`.toUpperCase();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Carte de membre</h1>
                    <p className="text-sm text-gray-500">Votre carte CSE numérique</p>
                </div>
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                >
                    <Download size={15} /> Télécharger
                </button>
            </div>

            {/* Carte */}
            <div className="flex justify-center">
                <div
                    ref={cardRef}
                    className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl select-none"
                    style={{
                        background: "linear-gradient(135deg, #0f766e 0%, #134e4a 60%, #1e3a5f 100%)",
                        minHeight: 200,
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-5 pb-3">
                        <div className="flex items-center gap-2">
                            {card.orgLogoUrl ? (
                                <img src={card.orgLogoUrl} alt={card.orgName} className="h-7 w-auto object-contain rounded" />
                            ) : (
                                <CreditCard size={20} className="text-teal-200" />
                            )}
                            <span className="text-teal-100 font-semibold text-sm">{card.orgName}</span>
                        </div>
                        <span className="text-teal-200 text-xs font-mono">{card.memberId}</span>
                    </div>

                    {/* Infos membre */}
                    <div className="px-6 pb-4 flex items-center gap-4">
                        {card.avatar ? (
                            <img
                                src={card.avatar}
                                alt={card.firstName}
                                className="w-14 h-14 rounded-full object-cover border-2 border-teal-300/40"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-teal-600/40 flex items-center justify-center border-2 border-teal-300/40">
                                <span className="text-xl font-bold text-white">{initials}</span>
                            </div>
                        )}
                        <div>
                            <p className="text-white font-bold text-lg leading-tight">
                                {card.firstName} {card.lastName}
                            </p>
                            <p className="text-teal-200 text-xs">{card.email}</p>
                            <p className="text-teal-300 text-xs mt-0.5">
                                Membre depuis {new Date(card.memberSince).toLocaleDateString("fr-FR", {
                                    month: "long", year: "numeric",
                                })}
                            </p>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="bg-white/10 px-6 py-4 flex items-center justify-between gap-4">
                        <div className="bg-white rounded-xl p-2">
                            <QRCode
                                value={card.qrData}
                                size={80}
                                bgColor="transparent"
                                fgColor="#0f766e"
                            />
                        </div>
                        <div className="flex-1 text-right">
                            <p className="text-teal-200 text-xs">Scannez ce QR code</p>
                            <p className="text-teal-100 text-xs">pour vérifier votre identité</p>
                            <p className="text-white font-mono text-xs mt-2 opacity-60">
                                AfrikCSE · {new Date().getFullYear()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Infos complémentaires */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-sm mx-auto">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Informations</h3>
                <div className="space-y-2">
                    {[
                        { label: "Numéro de membre", value: card.memberId },
                        { label: "Organisation",      value: card.orgName },
                        { label: "Membre depuis",     value: new Date(card.memberSince).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) },
                    ].map((row) => (
                        <div key={row.label} className="flex justify-between text-sm">
                            <span className="text-gray-500">{row.label}</span>
                            <span className="font-medium text-gray-900">{row.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
