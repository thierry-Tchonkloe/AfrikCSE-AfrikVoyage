export type Role =
    | "SUPER_ADMIN"
    | "ADMIN"
    | "MANAGER"
    | "RH"
    | "FINANCE"
    | "EMPLOYE"
    | "PLATFORM_MANAGER"
    | "PARTNER_ADMIN"
    | "PARTNER_STAFF";

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
    | "SYSTEM_UPDATE"
    | "NEW_PARTNER_OFFER"
    | "PHOTO_PENDING_MODERATION"
    | "BOOKING_CONFIRMED"
    | "BOOKING_CANCELLED"
    | "BOOKING_COMPLETED"
    | "BOOKING_REJECTED"
    | "WALLET_CREDITED"
    | "CASHBACK_CREDITED"
    | "ORDER_CONFIRMED"
    | "ORDER_CANCELLED";

export type NotificationChannel    = "IN_APP" | "EMAIL" | "SMS";
export type NotificationLogStatus  = "PENDING" | "SENT" | "FAILED" | "SKIPPED";

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

export interface NotificationTemplate {
    id:           string;
    event:        NotificationType;
    channels:     NotificationChannel[];
    emailSubject: string | null;
    emailBody:    string | null;
    smsBody:      string | null;
    inAppTitle:   string | null;
    inAppBody:    string | null;
    isActive:     boolean;
    createdAt:    string;
    updatedAt:    string;
}

export interface NotificationLog {
    id:        string;
    userId:    string | null;
    email:     string | null;
    phone:     string | null;
    event:     NotificationType;
    channel:   NotificationChannel;
    status:    NotificationLogStatus;
    error:     string | null;
    sentAt:    string | null;
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
    sessionToken?: string;
    user: User;
}

// ── Auth partenaire (portail dédié — cookies partnerAccessToken/partnerRefreshToken) ──

export interface PartnerSessionUser {
    id:          string;
    email:       string;
    firstName:   string;
    lastName:    string;
    role:        "PARTNER_ADMIN" | "PARTNER_STAFF";
    partnerId:   string;
    partnerName: string;
}

// ── Wallet ────────────────────────────────────────────────────────────────────

export type WalletEntryType =
    | "ALLOCATION"
    | "DEBIT"
    | "SUBSIDY_CREDIT"
    | "CASHBACK_CREDIT"
    | "CASHBACK_REVERSAL"
    | "REFUND"
    | "EXPIRY"
    | "REWARD_CREDIT";

export interface WalletEntry {
    id:              string;
    walletId:        string;
    type:            WalletEntryType;
    amount:          string; // Decimal serialized as string
    runningBalance:  string;
    idempotencyKey:  string;
    description?:    string | null;
    referenceId?:    string | null;
    referenceType?:  string | null;
    expiresAt?:      string | null;
    createdAt:       string;
}

export interface Wallet {
    id:             string;
    userId:         string;
    organizationId: string;
    currencyCode:   string;
    createdAt:      string;
    _count?: { entries: number };
    user?: { id: string; firstName: string; lastName: string; email: string; department?: string | null };
}

export interface WalletWithBalance extends Wallet {
    balance: string; // Decimal serialized as string
}

// ── Cashback ──────────────────────────────────────────────────────────────────

export type CashbackType   = "MERCHANT" | "EMPLOYER" | "HYBRID" | "CAMPAIGN";
export type CashbackStatus = "CALCULATED" | "CREDITED" | "PENDING_REVIEW" | "REVERSED" | "EXPIRED";

export interface CashbackRule {
    id:              string;
    organizationId?: string | null;
    partnerId?:      string | null;
    type:            CashbackType;
    rate:            string;
    fixedAmount?:    string | null;
    maxPerEmployee?: string | null;
    maxPerPeriod?:   string | null;
    startDate?:      string | null;
    endDate?:        string | null;
    isActive:        boolean;
    category?:       string | null;
    currencyCode:    string;
    createdAt:       string;
    partner?: { id: string; name: string } | null;
    _count?: { transactions: number; offers: number };
}

export interface CashbackTransaction {
    id:              string;
    userId:          string;
    organizationId:  string;
    orderId?:        string | null;
    ticketId?:       string | null;
    ruleId:          string;
    rawAmount:       string;
    creditedAmount:  string;
    status:          CashbackStatus;
    fraudScore?:     string | null;
    currencyCode:    string;
    createdAt:       string;
    user?: { id: string; firstName: string; lastName: string };
    rule?: { id: string; type: CashbackType; rate: string };
}

// ── Partner portal ────────────────────────────────────────────────────────────

export interface PartnerUser {
    id:          string;
    partnerId:   string;
    email:       string;
    firstName:   string;
    lastName:    string;
    role:        "PARTNER_ADMIN" | "PARTNER_STAFF";
    isActive:    boolean;
    lastLoginAt?: string | null;
    createdAt:   string;
}

export interface PartnerLocation {
    id:        string;
    partnerId: string;
    name:      string;
    address:   string;
    city:      string;
    country:   string;
    latitude?: string | null;
    longitude?: string | null;
    phone?:    string | null;
    isMain:    boolean;
    createdAt: string;
    updatedAt: string;
    availabilities?: PartnerAvailability[];
}

export interface PartnerAvailability {
    id:            string;
    locationId:    string;
    dayOfWeek?:    number | null;
    openTime:      string;
    closeTime:     string;
    isClosed:      boolean;
    exceptionDate?: string | null;
    note?:         string | null;
    createdAt:     string;
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED" | "NO_SHOW";

export interface BookingRating {
    score:    number;
    comment?: string | null;
}

export interface Booking {
    id:              string;
    userId:          string;
    organizationId:  string;
    partnerId:       string;
    offerId?:        string | null;
    locationId?:     string | null;
    orderId?:        string | null;
    status:          BookingStatus;
    bookingDate:     string;
    numberOfPersons: number;
    notes?:          string | null;
    partnerNotes?:   string | null;
    idempotencyKey:  string;
    confirmedAt?:    string | null;
    completedAt?:    string | null;
    cancelledAt?:    string | null;
    cancelReason?:   string | null;
    createdAt:       string;
    updatedAt:       string;
    partner?: { id: string; name: string; logoUrl?: string | null };
    offer?:   { id: string; title: string; category: string; imageUrl?: string | null } | null;
    location?: { id: string; name: string; address: string; city: string } | null;
    rating?:  BookingRating | null;
    commissionEntry?: { id: string; commissionAmount: string; netAmount: string; status: string } | null;
}

// ── Commissions ───────────────────────────────────────────────────────────────

export type CommissionType   = "PERCENTAGE" | "FIXED" | "MAX_OF_BOTH";
export type CommissionStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "REVERSED";
export type PayoutStatus     = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface CommissionRule {
    id:           string;
    partnerId?:   string | null;
    category?:    string | null;
    type:         CommissionType;
    rate:         string;
    fixedAmount?: string | null;
    currencyCode: string;
    isActive:     boolean;
    createdAt:    string;
    partner?: { id: string; name: string } | null;
}

export interface CommissionEntry {
    id:               string;
    bookingId:        string;
    ruleId:           string;
    partnerId:        string;
    grossAmount:      string;
    commissionAmount: string;
    netAmount:        string;
    currencyCode:     string;
    status:           CommissionStatus;
    payoutId?:        string | null;
    createdAt:        string;
    partner?: { id: string; name: string };
    booking?: { id: string; bookingDate: string; status: BookingStatus; organization?: { id: string; name: string } };
}

export interface PartnerPayout {
    id:              string;
    partnerId:       string;
    period:          string;
    totalGross:      string;
    totalCommission: string;
    netAmount:       string;
    currencyCode:    string;
    status:          PayoutStatus;
    paymentMethod?:  string | null;
    paidAt?:         string | null;
    notes?:          string | null;
    createdAt:       string;
    partner?: { id: string; name: string };
    entries?: CommissionEntry[];
}

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderStatus        = "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED" | "COMPLETED";
export type OrderPaymentStatus = "UNPAID" | "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED" | "FAILED";

export interface Order {
    id:              string;
    userId:          string;
    organizationId:  string;
    partnerId?:      string | null;
    offerId?:        string | null;
    amount:          string;
    discountAmount:  string;
    subsidyAmount:   string;
    cashbackAmount:  string;
    finalAmount:     string;
    currencyCode:    string;
    paymentMethod?:  string | null;
    paymentStatus:   OrderPaymentStatus;
    transactionId?:  string | null;
    idempotencyKey:  string;
    status:          OrderStatus;
    cancelledAt?:    string | null;
    cancelReason?:   string | null;
    createdAt:       string;
    updatedAt:       string;
}