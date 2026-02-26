// ============================================================
// Compliance Rules — Australian Fair Work Act compliance checks
// Each rule implements a check() method that returns violations
// ============================================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Shift } from '../entities/shift.entity';
import { GuardLicense } from '../entities/guard-license.entity';
import { ComplianceViolation, ViolationType, ViolationSeverity } from '../entities/compliance-violation.entity';
import { COMPLIANCE_THRESHOLDS } from '../common/constants';

export interface ComplianceCheckResult {
    userId: string;
    type: ViolationType;
    severity: ViolationSeverity;
    description: string;
    details: Record<string, unknown>;
    shiftId?: string;
}

@Injectable()
export class ComplianceRulesEngine {
    constructor(
        @InjectRepository(Shift) private shiftsRepo: Repository<Shift>,
        @InjectRepository(GuardLicense) private licensesRepo: Repository<GuardLicense>,
        @InjectRepository(ComplianceViolation) private violationsRepo: Repository<ComplianceViolation>,
    ) { }

    /**
     * Run all compliance checks for a tenant
     */
    async runAllChecks(tenantId: string): Promise<ComplianceCheckResult[]> {
        const violations: ComplianceCheckResult[] = [];

        const [overtime, rest, fatigue, licenses] = await Promise.all([
            this.checkOvertimeViolations(tenantId),
            this.checkRestPeriodViolations(tenantId),
            this.checkFatigueViolations(tenantId),
            this.checkLicenseExpiry(tenantId),
        ]);

        violations.push(...overtime, ...rest, ...fatigue, ...licenses);
        return violations;
    }

    /**
     * Overtime Check — Flag if weekly hours exceed 38 ordinary hours
     */
    async checkOvertimeViolations(tenantId: string): Promise<ComplianceCheckResult[]> {
        const results: ComplianceCheckResult[] = [];
        const weekStart = this.getWeekStart();
        const weekEnd = new Date();

        // Get all completed shifts this week grouped by user
        const shifts = await this.shiftsRepo.find({
            where: {
                tenantId,
                status: 'completed' as any,
                startTime: Between(weekStart, weekEnd),
            },
        });

        // Group by userId and sum hours
        const userHours = new Map<string, number>();
        for (const shift of shifts) {
            const hours = this.calculateShiftHours(shift);
            userHours.set(shift.userId, (userHours.get(shift.userId) || 0) + hours);
        }

        for (const [userId, totalHours] of userHours) {
            if (totalHours > COMPLIANCE_THRESHOLDS.MAX_ORDINARY_HOURS_PER_WEEK) {
                results.push({
                    userId,
                    type: ViolationType.OVERTIME,
                    severity: totalHours > 50 ? ViolationSeverity.CRITICAL : ViolationSeverity.WARNING,
                    description: `Guard worked ${totalHours.toFixed(1)}h this week (max ${COMPLIANCE_THRESHOLDS.MAX_ORDINARY_HOURS_PER_WEEK}h ordinary)`,
                    details: {
                        hoursWorked: totalHours,
                        maxAllowed: COMPLIANCE_THRESHOLDS.MAX_ORDINARY_HOURS_PER_WEEK,
                        weekStart: weekStart.toISOString(),
                    },
                });
            }
        }

        return results;
    }

    /**
     * Rest Period Check — Minimum 10-hour break between shifts
     */
    async checkRestPeriodViolations(tenantId: string): Promise<ComplianceCheckResult[]> {
        const results: ComplianceCheckResult[] = [];
        const lookback = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48h lookback

        const shifts = await this.shiftsRepo.find({
            where: {
                tenantId,
                startTime: MoreThanOrEqual(lookback),
            },
            order: { userId: 'ASC', startTime: 'ASC' },
        });

        // Check consecutive shifts per user
        let prevShift: typeof shifts[0] | null = null;
        for (const shift of shifts) {
            if (prevShift && prevShift.userId === shift.userId) {
                const prevEnd = prevShift.endTime || prevShift.startTime;
                const restHours = (shift.startTime.getTime() - prevEnd.getTime()) / (1000 * 60 * 60);

                if (restHours < COMPLIANCE_THRESHOLDS.MIN_REST_BETWEEN_SHIFTS_HOURS) {
                    results.push({
                        userId: shift.userId,
                        type: ViolationType.REST_PERIOD,
                        severity: restHours < 6 ? ViolationSeverity.CRITICAL : ViolationSeverity.VIOLATION,
                        description: `Only ${restHours.toFixed(1)}h rest between shifts (min ${COMPLIANCE_THRESHOLDS.MIN_REST_BETWEEN_SHIFTS_HOURS}h)`,
                        details: {
                            restHours,
                            requiredRest: COMPLIANCE_THRESHOLDS.MIN_REST_BETWEEN_SHIFTS_HOURS,
                            previousShiftEnd: prevEnd.toISOString(),
                            nextShiftStart: shift.startTime.toISOString(),
                        },
                        shiftId: shift.id,
                    });
                }
            }
            prevShift = shift;
        }

        return results;
    }

    /**
     * Fatigue Check — Flag shifts longer than 12h or >5 consecutive days
     */
    async checkFatigueViolations(tenantId: string): Promise<ComplianceCheckResult[]> {
        const results: ComplianceCheckResult[] = [];
        const lookback = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7d lookback

        const shifts = await this.shiftsRepo.find({
            where: {
                tenantId,
                startTime: MoreThanOrEqual(lookback),
            },
            order: { userId: 'ASC', startTime: 'ASC' },
        });

        // Check shift length
        for (const shift of shifts) {
            const hours = this.calculateShiftHours(shift);
            if (hours > COMPLIANCE_THRESHOLDS.MAX_SHIFT_LENGTH_HOURS) {
                results.push({
                    userId: shift.userId,
                    type: ViolationType.MAX_SHIFT_LENGTH,
                    severity: ViolationSeverity.CRITICAL,
                    description: `Shift is ${hours.toFixed(1)}h (max ${COMPLIANCE_THRESHOLDS.MAX_SHIFT_LENGTH_HOURS}h)`,
                    details: { shiftHours: hours, maxAllowed: COMPLIANCE_THRESHOLDS.MAX_SHIFT_LENGTH_HOURS },
                    shiftId: shift.id,
                });
            } else if (hours > COMPLIANCE_THRESHOLDS.WARN_SHIFT_LENGTH_HOURS) {
                results.push({
                    userId: shift.userId,
                    type: ViolationType.FATIGUE,
                    severity: ViolationSeverity.WARNING,
                    description: `Shift is ${hours.toFixed(1)}h (warning threshold ${COMPLIANCE_THRESHOLDS.WARN_SHIFT_LENGTH_HOURS}h)`,
                    details: { shiftHours: hours, warnThreshold: COMPLIANCE_THRESHOLDS.WARN_SHIFT_LENGTH_HOURS },
                    shiftId: shift.id,
                });
            }
        }

        // Check consecutive days
        const userDays = new Map<string, Set<string>>();
        for (const shift of shifts) {
            const dayKey = shift.startTime.toISOString().slice(0, 10);
            if (!userDays.has(shift.userId)) userDays.set(shift.userId, new Set());
            userDays.get(shift.userId)!.add(dayKey);
        }

        for (const [userId, days] of userDays) {
            const sortedDays = [...days].sort();
            let consecutiveCount = 1;
            for (let i = 1; i < sortedDays.length; i++) {
                const prev = new Date(sortedDays[i - 1]);
                const curr = new Date(sortedDays[i]);
                const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
                if (diffDays === 1) {
                    consecutiveCount++;
                    if (consecutiveCount > COMPLIANCE_THRESHOLDS.MAX_CONSECUTIVE_DAYS) {
                        results.push({
                            userId,
                            type: ViolationType.MAX_CONSECUTIVE_DAYS,
                            severity: ViolationSeverity.VIOLATION,
                            description: `Guard has worked ${consecutiveCount} consecutive days (max ${COMPLIANCE_THRESHOLDS.MAX_CONSECUTIVE_DAYS})`,
                            details: { consecutiveDays: consecutiveCount, maxAllowed: COMPLIANCE_THRESHOLDS.MAX_CONSECUTIVE_DAYS },
                        });
                        break; // One violation per user
                    }
                } else {
                    consecutiveCount = 1;
                }
            }
        }

        return results;
    }

    /**
     * License Expiry Check — Alert at 90/60/30/7 days before expiry
     */
    async checkLicenseExpiry(tenantId: string): Promise<ComplianceCheckResult[]> {
        const results: ComplianceCheckResult[] = [];
        const now = new Date();

        for (const days of COMPLIANCE_THRESHOLDS.LICENSE_ALERT_DAYS) {
            const alertDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

            const expiringLicenses = await this.licensesRepo.find({
                where: {
                    tenantId,
                    verificationStatus: 'verified' as any,
                    expiryDate: LessThanOrEqual(alertDate),
                },
                relations: ['user'],
            });

            for (const license of expiringLicenses) {
                const daysUntilExpiry = Math.ceil(
                    (license.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                );

                if (daysUntilExpiry < 0) {
                    results.push({
                        userId: license.userId,
                        type: ViolationType.LICENSE_EXPIRED,
                        severity: ViolationSeverity.CRITICAL,
                        description: `Security license ${license.licenseNumber} expired ${Math.abs(daysUntilExpiry)} days ago`,
                        details: {
                            licenseId: license.id,
                            licenseNumber: license.licenseNumber,
                            licenseClass: license.licenseClass,
                            expiryDate: license.expiryDate.toISOString(),
                            daysOverdue: Math.abs(daysUntilExpiry),
                        },
                    });
                } else if (daysUntilExpiry <= days) {
                    results.push({
                        userId: license.userId,
                        type: ViolationType.LICENSE_EXPIRING,
                        severity: daysUntilExpiry <= 7 ? ViolationSeverity.CRITICAL : ViolationSeverity.WARNING,
                        description: `Security license ${license.licenseNumber} expires in ${daysUntilExpiry} days`,
                        details: {
                            licenseId: license.id,
                            licenseNumber: license.licenseNumber,
                            licenseClass: license.licenseClass,
                            expiryDate: license.expiryDate.toISOString(),
                            daysUntilExpiry,
                        },
                    });
                }
            }
        }

        // Deduplicate (a license might match multiple alert thresholds)
        const seen = new Set<string>();
        return results.filter((r) => {
            const key = `${r.userId}-${r.type}-${(r.details as any).licenseId || ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    /**
     * Save detected violations to the database
     */
    async saveViolations(tenantId: string, violations: ComplianceCheckResult[]): Promise<ComplianceViolation[]> {
        const entities = violations.map((v) =>
            this.violationsRepo.create({
                tenantId,
                userId: v.userId,
                type: v.type,
                severity: v.severity,
                description: v.description,
                details: v.details,
                shiftId: v.shiftId,
            }),
        );
        return this.violationsRepo.save(entities);
    }

    // — Helpers —

    private calculateShiftHours(shift: Shift): number {
        if (!shift.endTime) return 0;
        return (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
    }

    private getWeekStart(): Date {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        const weekStart = new Date(now);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }
}
