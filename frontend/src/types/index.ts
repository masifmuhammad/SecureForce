// ============================================================
// TypeScript interfaces matching backend entities
// ============================================================

export enum UserRole {
    ADMIN = 'admin',
    MANAGER = 'manager',
    EMPLOYEE = 'employee',
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: UserRole;
    isActive: boolean;
    securityLicenseNumber?: string;
    isTwoFactorEnabled: boolean;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export enum ShiftStatus {
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    NO_SHOW = 'no_show',
}

export interface Location {
    id: string;
    name: string;
    address: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    isActive: boolean;
    notes?: string;
    contactName?: string;
    contactPhone?: string;
    createdAt: string;
}

export interface Shift {
    id: string;
    userId?: string;
    user?: User;
    locationId: string;
    location?: Location;
    startTime: string;
    endTime: string;
    status: ShiftStatus;
    isOpen: boolean;
    notes?: string;
    createdAt: string;
}

export enum CheckInType {
    CHECK_IN = 'check_in',
    CHECK_OUT = 'check_out',
}

export enum VerificationStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    FLAGGED = 'flagged',
    REJECTED = 'rejected',
}

export interface CheckIn {
    id: string;
    shiftId: string;
    shift?: Shift;
    userId: string;
    user?: User;
    type: CheckInType;
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    verificationStatus: VerificationStatus;
    verificationNotes?: string;
    distanceFromSite?: number;
    timestamp: string;
}

export enum ReportType {
    INCIDENT = 'incident',
    DAILY = 'daily',
    OBSERVATION = 'observation',
    MAINTENANCE = 'maintenance',
}

export enum ReportPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export interface Report {
    id: string;
    userId: string;
    user?: User;
    shiftId?: string;
    title: string;
    description: string;
    type: ReportType;
    priority: ReportPriority;
    photoUrls?: string[];
    createdAt: string;
}

export interface AuditLog {
    id: string;
    userId?: string;
    user?: User;
    action: string;
    entity: string;
    entityId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    totalPages: number;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        isTwoFactorEnabled: boolean;
    };
}

export interface ClientOrganization {
    id: string;
    tenantId: string;
    name: string;
    abn?: string;
    industry?: string;
    primaryContactName?: string;
    primaryContactEmail?: string;
    primaryContactPhone?: string;
    contractStartDate?: string;
    contractEndDate?: string;
    billingRate?: number;
    isActive: boolean;
    logoUrl?: string;
    settings: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface TenantInfo {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    abn?: string;
    plan: string;
    isActive: boolean;
    maxUsers: number;
    settings: Record<string, unknown>;
    logoUrl?: string;
    primaryContactName?: string;
    primaryContactEmail?: string;
    primaryContactPhone?: string;
    createdAt: string;
    updatedAt: string;
    usage: {
        currentUsers: number;
        maxUsers: number;
        usagePercent: number;
    };
}

// ── Phase 4 — Analytics ──
export interface AnalyticsDashboard {
    totalGuards: number;
    activeGuards: number;
    shiftsToday: number;
    activeShifts: number;
    totalIncidents: number;
    openIncidents: number;
    complianceScore: number;
    checkinsToday: number;
}

export interface AnalyticsTrend {
    period: string;
    data: Array<{
        date: string;
        [key: string]: unknown;
    }>;
}

// ── Phase 4 — Notifications ──
export enum NotificationType {
    INCIDENT = 'incident',
    COMPLIANCE = 'compliance',
    SHIFT = 'shift',
    SYSTEM = 'system',
    ALERT = 'alert',
}

export interface AppNotification {
    id: string;
    tenantId: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
    isRead: boolean;
    createdAt: string;
}

