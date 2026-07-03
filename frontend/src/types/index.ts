export type Role =
    | "SUPER_ADMIN"
    | "ADMIN"
    | "MANAGER"
    | "RH"
    | "FINANCE"
    | "EMPLOYE";

export type OrgStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";
export type Plan = "STARTER" | "BUSINESS" | "ENTERPRISE";

export interface Organization {
    id: string;
    name: string;
    slug?: string;
    status?: OrgStatus;
    plan?: Plan;
    hasVoyage: boolean;
    hasCSE: boolean;
    isHost: boolean;
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
    backgroundColor?: string | null;
    faviconUrl?: string | null;
    welcomeMessage?: string | null;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    role: Role;
    profileCompleted: boolean;
    organizationId: string | null;
    organization: Organization | null;
}

export type NotificationType =
    | "APPROVAL_REQUEST"
    | "REQUEST_APPROVED"
    | "REQUEST_REJECTED"
    | "TRIP_REMINDER"
    | "NEW_EVENT"
    | "MESSAGE_RECEIVED"
    | "SYSTEM_UPDATE";

export interface Notification {
    id: string;
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    link?: string | null;
    read: boolean;
    createdAt: string;
}

// ── Partenaires ──────────────────────────────────────────────────────────────

export type PartnerStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type PartnerScope  = "CSE" | "VOYAGE" | "BOTH";
export type OfferType     = "VOUCHER" | "BOOKING" | "DISCOUNT_CODE";

export interface Partner {
    id:               string;
    name:             string;
    sector:           string;
    logoUrl?:         string | null;
    contactEmail?:    string | null;
    websiteUrl?:      string | null;
    notes?:           string | null;
    status:           PartnerStatus;
    scopeType:        PartnerScope;
    apiEnabled:       boolean;
    apiBaseUrl?:      string | null;
    hasApiKey:        boolean;
    apiFormat?:       string | null;
    syncFrequencyH?:  number | null;
    isGlobal:         boolean;
    warningCount:     number;
    flaggedAt?:       string | null;
    createdAt:        string;
    updatedAt:        string;
    _count?: { offers: number };
}

export interface PartnerSyncLog {
    id:             string;
    partnerId:      string;
    type:           string;
    status:         string;
    offersCreated:  number;
    offersUpdated:  number;
    errors:         number;
    errorMessage?:  string | null;
    createdAt:      string;
}

// ── Catalogue d'offres ────────────────────────────────────────────────────────

export interface CatalogItem {
    id:                   string;
    organizationId:       string;
    title:                string;
    description?:         string | null;
    imageUrl?:            string | null;
    category:             string;
    subsidyPct:           number;
    employeePrice:        number;
    companyPrice:         number;
    validUntil?:          string | null;
    isActive:             boolean;
    offerType:            OfferType;
    isFeatured:           boolean;
    isCommitteeChoice:    boolean;
    boostUntil?:          string | null;
    boostLabel?:          string | null;
    subsidyAmount?:       number | null;
    city?:                string | null;
    region?:              string | null;
    country?:             string | null;
    requiresTicket:       boolean;
    requiresFamilyMember: boolean;
    stock?:               number | null;
    publishedAt?:         string | null;
    createdAt:            string;
    partner?: {
        id:      string;
        name:    string;
        logoUrl: string | null;
    } | null;
}

// ── Membres de famille ────────────────────────────────────────────────────────

export type FamilyRelationship = "SPOUSE" | "CHILD" | "PARENT" | "SIBLING" | "OTHER";

export interface FamilyMember {
    id:           string;
    userId:       string;
    firstName:    string;
    lastName:     string;
    relationship: FamilyRelationship;
    birthDate?:   string | null;
    documentUrl?: string | null;
    isActive:     boolean;
    createdAt:    string;
}

// ── Tickets QR ───────────────────────────────────────────────────────────────

export type TicketStatus = "VALID" | "USED" | "CANCELLED" | "EXPIRED";

export interface Ticket {
    id:             string;
    code:           string;
    status:         TicketStatus;
    qrPayload:      string;
    expiresAt?:     string | null;
    usedAt?:        string | null;
    createdAt:      string;
    offer?: {
        id:        string;
        title:     string;
        imageUrl?: string | null;
        offerType: OfferType;
        partner?: { name: string; logoUrl?: string | null } | null;
    } | null;
    familyMember?: {
        id:           string;
        firstName:    string;
        lastName:     string;
        relationship: FamilyRelationship;
    } | null;
}

// ── Politique de voyage ──────────────────────────────────

export interface TravelPolicy {
    id:                     string;
    organizationId:         string;
    name:                   string;
    description?:           string | null;
    isDefault:              boolean;
    isActive:               boolean;
    maxFlightBudget?:       number | null;
    maxHotelBudgetPerNight?: number | null;
    maxDailyAllowance?:     number | null;
    currency:               string;
    allowedFlightClass?:    string | null;
    maxAdvanceBookingDays?: number | null;
    requiresApproval:       boolean;
    approvalThreshold?:     number | null;
    allowedDestinations:    string[];
    restrictedDestinations: string[];
    appliesToDepartments:   string[];
    createdAt:              string;
    updatedAt:              string;
    _count?: { travelRequests: number };
}

// ── Voyage de groupe ──────────────────────────────────────

export type GroupTravelStatus = "DRAFT" | "OPEN" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type ParticipantStatus = "INVITED" | "CONFIRMED" | "DECLINED" | "CANCELLED";

export interface GroupTravelParticipant {
    id:            string;
    groupTravelId: string;
    userId:        string;
    status:        ParticipantStatus;
    note?:         string | null;
    invitedAt:     string;
    respondedAt?:  string | null;
    user: { id: string; firstName: string; lastName: string; avatar?: string | null };
}

export interface GroupTravel {
    id:              string;
    organizationId:  string;
    leaderId:        string;
    title:           string;
    description?:    string | null;
    destination:     string;
    departureDate:   string;
    returnDate:      string;
    estimatedCost?:  number | null;
    maxParticipants?: number | null;
    status:          GroupTravelStatus;
    currency:        string;
    notes?:          string | null;
    createdAt:       string;
    updatedAt:       string;
    leader: { id: string; firstName: string; lastName: string; avatar?: string | null };
    participants:    GroupTravelParticipant[];
    _count?: { participants: number };
}

// ── Récompenses voyage ────────────────────────────────────

export type RewardStatus = "EARNED" | "REDEEMED" | "EXPIRED" | "CANCELLED";

export interface TravelReward {
    id:              string;
    userId:          string;
    points:          number;
    reason:          string;
    status:          RewardStatus;
    estimatedCost?:  number | null;
    actualCost?:     number | null;
    savedAmount?:    number | null;
    currency:        string;
    expiresAt?:      string | null;
    createdAt:       string;
    travelRequest?: { id: string; destination: string; departureDate: string } | null;
}

// ── Photos événement ─────────────────────────────────────

export type PhotoStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface EventPhoto {
    id:             string;
    eventId:        string;
    organizationId: string;
    uploadedBy:     string;
    url:            string;
    caption?:       string | null;
    status:         PhotoStatus;
    createdAt:      string;
    uploader: { id: string; firstName: string; lastName: string; avatar?: string | null };
    _count:   { likes: number };
}

// ── FAQ ───────────────────────────────────────────────────

export type FaqStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface FaqEntry {
    id:             string;
    organizationId: string;
    question:       string;
    answer:         string;
    category?:      string | null;
    order:          number;
    status:         FaqStatus;
    createdById:    string;
    createdAt:      string;
    updatedAt:      string;
    _count?: { votes: number };
    createdBy?: { id: string; firstName: string; lastName: string };
}

export interface AuthResponse {
    // access/refresh peuvent être absents car les cookies HTTP-only sont posés
    accessToken?: string;
    refreshToken?: string;
    // jeton court signé fourni pour le middleware (lisible par le frontend)
    sessionToken?: string;
    user: User;
}