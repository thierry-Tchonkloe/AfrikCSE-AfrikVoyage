import { z } from "zod";
import { prisma } from "../../../core/config/prisma";

const catalogItemFields = {
    title:               z.string().min(2, "Titre requis"),
    description:         z.string().optional(),
    imageUrl:            z.string().url().optional(),
    category:            z.string().min(1, "Catégorie requise"),
    subsidyPct:          z.number().min(0).max(100),
    employeePrice:       z.number().min(0),
    companyPrice:        z.number().min(0),
    validUntil:          z.coerce.date().optional(),
    maxPerFamily:        z.number().int().min(1).optional(),
    isActive:            z.boolean().optional(),
    partnerId:           z.string().optional(),
    offerType:           z.enum(["VOUCHER", "BOOKING", "DISCOUNT_CODE"]).optional(),
    isFeatured:          z.boolean().optional(),
    isCommitteeChoice:   z.boolean().optional(),
    boostUntil:          z.coerce.date().optional(),
    boostLabel:          z.string().optional(),
    subsidyAmount:       z.number().min(0).optional(),
    subsidyStart:        z.coerce.date().optional(),
    subsidyEnd:          z.coerce.date().optional(),
    city:                z.string().optional(),
    region:              z.string().optional(),
    country:             z.string().optional(),
    latitude:            z.number().min(-90).max(90).optional(),
    longitude:           z.number().min(-180).max(180).optional(),
    requiresTicket:      z.boolean().optional(),
    requiresFamilyMember: z.boolean().optional(),
    publishedAt:         z.coerce.date().optional(),
    unpublishedAt:       z.coerce.date().optional(),
    validFrom:           z.coerce.date().optional(),
    stock:               z.number().int().min(0).optional(),
};

/** Rejette toute catégorie qui ne correspond à aucune BenefitCategory active
 *  de CETTE organisation — la liste réelle vient du même sélecteur que le
 *  frontend (GET /benefits/categories), donc un texte libre ne peut plus
 *  jamais désynchroniser catalogue et budget. */
async function categoryExistsForOrg(category: string, orgId: string): Promise<boolean> {
    const cat = await prisma.benefitCategory.findFirst({
        where: { organizationId: orgId, name: category, isActive: true },
        select: { id: true },
    });
    return !!cat;
}

export function createCatalogItemSchema(orgId: string) {
    return z.object(catalogItemFields).refine(
        (data) => categoryExistsForOrg(data.category, orgId),
        { message: "Cette catégorie n'existe pas pour votre organisation", path: ["category"] }
    );
}

export function updateCatalogItemSchema(orgId: string) {
    return z.object(catalogItemFields).partial().refine(
        (data) => data.category === undefined || categoryExistsForOrg(data.category, orgId),
        { message: "Cette catégorie n'existe pas pour votre organisation", path: ["category"] }
    );
}

export const filterCatalogSchema = z.object({
    category:   z.string().optional(),
    search:     z.string().optional(),
    sortBy:     z.string().optional(),
    featured:   z.coerce.boolean().optional(),
    city:       z.string().optional(),
    region:     z.string().optional(),
    partnerId:  z.string().optional(),
    offerType:  z.enum(["VOUCHER", "BOOKING", "DISCOUNT_CODE"]).optional(),
    subsidized: z.coerce.boolean().optional(),
    lat:        z.coerce.number().min(-90).max(90).optional(),
    lng:        z.coerce.number().min(-180).max(180).optional(),
    radius:     z.coerce.number().min(1).max(500).optional(),
});
