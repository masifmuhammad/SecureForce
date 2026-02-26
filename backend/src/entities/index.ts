// Barrel export for all entities

// Existing (upgraded with tenantId)
export { User, UserRole } from './user.entity';
export { Location } from './location.entity';
export { Shift, ShiftStatus } from './shift.entity';
export { CheckIn, CheckInType, VerificationStatus } from './checkin.entity';
export { Report, ReportType, ReportPriority } from './report.entity';
export { AuditLog } from './audit-log.entity';

// New — Enterprise
export { Tenant } from '../core/tenant/tenant.entity';
export { UserSession } from './user-session.entity';
export { GuardLicense, LicenseVerificationStatus } from './guard-license.entity';
export { ComplianceViolation, ViolationType, ViolationSeverity } from './compliance-violation.entity';
export { Incident } from './incident.entity';
export { IncidentTimeline, TimelineAction } from './incident-timeline.entity';
export { ClientOrganization } from './client-organization.entity';
export { ClientUser, ClientUserRole } from './client-user.entity';
export { AnalyticsSnapshot, MetricType } from './analytics-snapshot.entity';
export { Notification, NotificationType } from './notification.entity';

