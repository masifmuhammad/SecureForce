// ============================================================
// IncidentTimeline Entity — Tracks all actions on an incident
// Creates an immutable audit trail for incident lifecycle
// ============================================================
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Incident } from './incident.entity';

export enum TimelineAction {
    CREATED = 'created',
    ASSIGNED = 'assigned',
    NOTE_ADDED = 'note_added',
    STATUS_CHANGED = 'status_changed',
    ESCALATED = 'escalated',
    ACKNOWLEDGED = 'acknowledged',
    RESOLVED = 'resolved',
    CLOSED = 'closed',
    PHOTO_ADDED = 'photo_added',
    SIGNATURE_ADDED = 'signature_added',
    SLA_BREACHED = 'sla_breached',
}

@Entity('incident_timeline')
export class IncidentTimeline {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    tenantId: string;

    @ManyToOne(() => Incident, (incident) => incident.timeline)
    @JoinColumn({ name: 'incidentId' })
    incident: Incident;

    @Column()
    incidentId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ nullable: true })
    userId: string;

    @Column({ type: 'enum', enum: TimelineAction })
    action: TimelineAction;

    @Column({ nullable: true, type: 'text' })
    comment: string;

    @Column({ type: 'simple-array', nullable: true })
    attachments: string[]; // URLs

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, unknown>;
    // e.g., { previousStatus: 'open', newStatus: 'investigating' }

    @CreateDateColumn()
    timestamp: Date;
}
