// ============================================================
// ComplianceViolation Entity — Tracks compliance rule breaches
// Overtime, rest periods, expired licenses, fatigue, etc.
// ============================================================
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Shift } from './shift.entity';

export enum ViolationType {
    OVERTIME = 'overtime',
    REST_PERIOD = 'rest_period',
    LICENSE_EXPIRED = 'license_expired',
    LICENSE_EXPIRING = 'license_expiring',
    FATIGUE = 'fatigue',
    MAX_CONSECUTIVE_DAYS = 'max_consecutive_days',
    MAX_SHIFT_LENGTH = 'max_shift_length',
    CERTIFICATION = 'certification',
}

export enum ViolationSeverity {
    WARNING = 'warning',
    VIOLATION = 'violation',
    CRITICAL = 'critical',
}

@Entity('compliance_violations')
export class ComplianceViolation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    tenantId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column({ type: 'enum', enum: ViolationType })
    type: ViolationType;

    @Column({ type: 'enum', enum: ViolationSeverity })
    severity: ViolationSeverity;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'jsonb', nullable: true })
    details: Record<string, unknown>;
    // e.g., { hoursWorked: 42, maxAllowed: 38, weekStartDate: '2026-01-05' }

    @ManyToOne(() => Shift, { nullable: true })
    @JoinColumn({ name: 'shiftId' })
    shift: Shift;

    @Column({ nullable: true })
    shiftId: string;

    @Column({ default: false })
    isResolved: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    resolvedAt: Date;

    @Column({ nullable: true })
    resolvedBy: string; // userId who resolved

    @Column({ nullable: true, type: 'text' })
    resolutionNotes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
