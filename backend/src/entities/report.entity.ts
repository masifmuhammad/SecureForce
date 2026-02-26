// ============================================================
// Report Entity — Incident and shift reports
// Supports photo attachments and shift linkage
// ============================================================
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Shift } from './shift.entity';

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

@Entity('reports')
export class Report {
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

    @ManyToOne(() => Shift, { nullable: true })
    @JoinColumn({ name: 'shiftId' })
    shift: Shift;

    @Column({ nullable: true })
    shiftId: string;

    @Column({ length: 300 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'enum', enum: ReportType, default: ReportType.DAILY })
    type: ReportType;

    @Column({ type: 'enum', enum: ReportPriority, default: ReportPriority.MEDIUM })
    priority: ReportPriority;

    @Column({ type: 'simple-array', nullable: true })
    photoUrls: string[];

    @CreateDateColumn()
    createdAt: Date;
}
