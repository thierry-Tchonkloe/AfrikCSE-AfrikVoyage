"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Pencil, Clock, CheckCircle2, XCircle, ImageOff } from "lucide-react";
import type { PartnerOffer } from "@/services/partner/partner-portal.service";

// "Active" retiré du libellé APPROVED : la visibilité réelle de l'offre
// (isActive) est désormais un état séparé et bascule indépendamment — un
// badge de revue disant "Active" alors que le partenaire vient de la masquer
// via le toggle ci-dessous serait directement contradictoire.
export const REVIEW_BADGE: Record<PartnerOffer["reviewStatus"], { label: string; className: string; icon: typeof Clock }> = {
    PENDING:  { label: "En attente de validation", className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
    APPROVED: { label: "Approuvée",                className: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
    REJECTED: { label: "Refusée",                   className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",         icon: XCircle },
};

const fmt = (v: number) => new Intl.NumberFormat("fr-FR").format(v);

export const offerCardVariants = {
    hidden: { opacity: 0, y: 12 },
    show:   { opacity: 1, y: 0 },
};

export function OfferCard({ offer, onEdit, onToggleActive }: {
    offer: PartnerOffer;
    onEdit: (offer: PartnerOffer) => void;
    onToggleActive: (offer: PartnerOffer) => void;
}) {
    const review = REVIEW_BADGE[offer.reviewStatus];
    const ReviewIcon = review.icon;
    // Activer n'est permis que si l'offre est déjà approuvée (vérifié aussi
    // côté serveur) ; désactiver reste toujours possible pour la masquer.
    const canActivate = offer.reviewStatus === "APPROVED";

    return (
        <motion.div
            variants={offerCardVariants}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25 }}
            className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col shadow-sm hover:shadow-lg will-change-transform"
        >
            {/* Image + overlay catégorie */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
                {offer.imageUrl ? (
                    <Image
                        src={offer.imageUrl}
                        alt={offer.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                        <ImageOff size={24} />
                    </div>
                )}

                {offer.category && (
                    <span className="absolute top-3 left-3 text-xs font-medium text-white bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
                        {offer.category}
                    </span>
                )}

                <span className={`absolute top-3 right-3 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${review.className}`}>
                    <ReviewIcon size={12} /> {review.label}
                </span>
            </div>

            {/* Contenu texte */}
            <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <p className="font-display font-semibold text-sm text-gray-900 dark:text-white truncate">{offer.title}</p>
                    <button onClick={() => onEdit(offer)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 shrink-0">
                        <Pencil size={14} />
                    </button>
                </div>

                {offer.description && <p className="text-xs text-gray-500 line-clamp-2">{offer.description}</p>}

                {offer.reviewStatus === "REJECTED" && offer.reviewNote && (
                    <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-2.5 py-1.5">
                        Motif du refus : {offer.reviewNote}
                    </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 mt-auto">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {fmt(offer.employeePrice)} <span className="text-xs font-normal text-gray-400">XOF employé</span>
                        <span className="text-xs font-normal text-gray-400"> · {fmt(offer.companyPrice)} entreprise</span>
                    </p>
                </div>

                <div className="flex items-center justify-between pt-1"
                    title={!offer.isActive && !canActivate ? "Cette offre doit être approuvée par le Super Admin avant de pouvoir être activée" : undefined}>
                    <span className="text-xs text-gray-500">
                        {offer.isActive ? "Visible par les employés" : "Masquée"}
                    </span>
                    <button
                        type="button"
                        onClick={() => (offer.isActive || canActivate) && onToggleActive(offer)}
                        disabled={!offer.isActive && !canActivate}
                        className="relative w-9 h-5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: offer.isActive ? "#16a34a" : "#d1d5db" }}
                    >
                        <span
                            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                            style={{ transform: offer.isActive ? "translateX(18px)" : "translateX(2px)" }}
                        />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
