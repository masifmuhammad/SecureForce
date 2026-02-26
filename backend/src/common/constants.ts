// ============================================================
// Application Constants
// ============================================================

export const TENANT_HEADER = 'x-tenant-id';
export const REQUEST_TENANT_KEY = 'tenantId';

// Plans
export enum TenantPlan {
    STARTER = 'starter',
    PROFESSIONAL = 'professional',
    ENTERPRISE = 'enterprise',
}

// Compliance
export enum AustralianState {
    NSW = 'NSW',
    VIC = 'VIC',
    QLD = 'QLD',
    SA = 'SA',
    WA = 'WA',
    TAS = 'TAS',
    NT = 'NT',
    ACT = 'ACT',
}

export enum SecurityLicenseClass {
    CLASS_1A = '1A', // Unarmed guard
    CLASS_1B = '1B', // Crowd controller
    CLASS_1C = '1C', // Bodyguard
    CLASS_1D = '1D', // Dog handler
    CLASS_2A = '2A', // Armed guard — firearms
    CLASS_2B = '2B', // Armed guard — bodyguard with firearms
    CLASS_2C = '2C', // Armed guard — cash-in-transit
    MASTER = 'master',
}

// Incident
export enum IncidentSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export enum IncidentStatus {
    OPEN = 'open',
    INVESTIGATING = 'investigating',
    ESCALATED = 'escalated',
    RESOLVED = 'resolved',
    CLOSED = 'closed',
}

// SLA defaults (in minutes)
export const SLA_DEFAULTS = {
    [IncidentSeverity.CRITICAL]: { response: 15, resolution: 120, autoEscalate: 10 },
    [IncidentSeverity.HIGH]: { response: 30, resolution: 240, autoEscalate: 25 },
    [IncidentSeverity.MEDIUM]: { response: 120, resolution: 1440, autoEscalate: 90 },
    [IncidentSeverity.LOW]: { response: 480, resolution: 4320, autoEscalate: null },
} as const;

// Compliance thresholds (Australian Fair Work)
export const COMPLIANCE_THRESHOLDS = {
    MAX_ORDINARY_HOURS_PER_WEEK: 38,
    MIN_REST_BETWEEN_SHIFTS_HOURS: 10,
    MAX_SHIFT_LENGTH_HOURS: 14,
    WARN_SHIFT_LENGTH_HOURS: 10,
    MAX_CONSECUTIVE_DAYS: 5,
    LICENSE_ALERT_DAYS: [90, 60, 30, 7],
} as const;
