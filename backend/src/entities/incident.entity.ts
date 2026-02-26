// ============================================================
// Incident Entity — Advanced incident management with SLA
// Supports severity levels, escalation, digital signatures
// ============================================================
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Location } from './location.entity';
import { Shift } from './shift.entity';
import { IncidentTimeline } from './incident-timeline.entity';
import { IncidentSeverity, IncidentStatus } from '../common/constants';

@Entity('incidents')
export class Incident {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    tenantId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'reportedById' })
    reportedBy: User;

    @Column()
    reportedById: string;

    @ManyToOne(() => Location)
    @JoinColumn({ name: 'locationId' })
    location: Location;

    @Column()
    locationId: string;

    @ManyToOne(() => Shift, { nullable: true })
    @JoinColumn({ name: 'shiftId' })
    shift: Shift;

    @Column({ nullable: true })
    shiftId: string;

    @Column({ nullable: true })
    clientOrgId: string; // FK to ClientOrganization

    @Column({ length: 300 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'enum', enum: IncidentSeverity, default: IncidentSeverity.MEDIUM })
    severity: IncidentSeverity;

    @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.OPEN })
    status: IncidentStatus;

    @Column({ type: 'timestamptz', nullable: true })
    slaDeadline: Date;

    @Column({ default: false })
    slaBreached: boolean;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'assignedToId' })
    assignedTo: User;

    @Column({ nullable: true })
    assignedToId: string;

    @Column({ type: 'int', default: 0 })
    escalationLevel: number; // 0 = none, 1 = manager, 2 = admin, 3 = exec

    @Column({ type: 'simple-array', nullable: true })
    photoUrls: string[];

    @Column({ nullable: true })
    digitalSignatureUrl: string;

    @Column({ type: 'timestamptz', nullable: true })
    acknowledgedAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    resolvedAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    closedAt: Date;

    @OneToMany(() => IncidentTimeline, (tl) => tl.incident, { cascade: true })
    timeline: IncidentTimeline[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
