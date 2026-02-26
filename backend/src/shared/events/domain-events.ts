// ============================================================
// Domain Events — Typed event classes for decoupled architecture
// ============================================================

// — Shift Events —
export class ShiftAssignedEvent {
    constructor(
        public readonly tenantId: string,
        public readonly shiftId: string,
        public readonly userId: string,
        public readonly locationId: string,
    ) { }
}

export class ShiftCompletedEvent {
    constructor(
        public readonly tenantId: string,
        public readonly shiftId: string,
        public readonly userId: string,
        public readonly actualHours: number,
    ) { }
}

// — CheckIn Events —
export class CheckInCreatedEvent {
    constructor(
        public readonly tenantId: string,
        public readonly checkInId: string,
        public readonly userId: string,
        public readonly shiftId: string,
        public readonly latitude: number,
        public readonly longitude: number,
    ) { }
}

// — Incident Events —
export class IncidentCreatedEvent {
    constructor(
        public readonly tenantId: string,
        public readonly incidentId: string,
        public readonly severity: string,
        public readonly locationId: string,
        public readonly reportedById: string,
    ) { }
}

export class IncidentEscalatedEvent {
    constructor(
        public readonly tenantId: string,
        public readonly incidentId: string,
        public readonly escalationLevel: number,
        public readonly assignedToId: string | null,
    ) { }
}

// — Compliance Events —
export class LicenseExpiringEvent {
    constructor(
        public readonly tenantId: string,
        public readonly userId: string,
        public readonly licenseId: string,
        public readonly daysUntilExpiry: number,
    ) { }
}

export class ComplianceViolationDetectedEvent {
    constructor(
        public readonly tenantId: string,
        public readonly violationId: string,
        public readonly userId: string,
        public readonly type: string,
        public readonly severity: string,
    ) { }
}

// — User Events —
export class UserLoginEvent {
    constructor(
        public readonly tenantId: string,
        public readonly userId: string,
        public readonly ipAddress: string,
        public readonly userAgent: string,
    ) { }
}

// Event name constants for listeners
export const EVENTS = {
    SHIFT_ASSIGNED: 'shift.assigned',
    SHIFT_COMPLETED: 'shift.completed',
    CHECKIN_CREATED: 'checkin.created',
    INCIDENT_CREATED: 'incident.created',
    INCIDENT_ESCALATED: 'incident.escalated',
    LICENSE_EXPIRING: 'compliance.license_expiring',
    VIOLATION_DETECTED: 'compliance.violation_detected',
    USER_LOGIN: 'user.login',
} as const;
