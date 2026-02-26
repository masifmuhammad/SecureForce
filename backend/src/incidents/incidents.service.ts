// ============================================================
// Incidents Service — CRUD + SLA engine + escalation
// ============================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Incident } from '../entities/incident.entity';
import { IncidentTimeline, TimelineAction } from '../entities/incident-timeline.entity';
import { IncidentSeverity, IncidentStatus, SLA_DEFAULTS } from '../common/constants';
import { QUEUE_INCIDENTS } from '../shared/queues/queue.module';
import { EVENTS, IncidentCreatedEvent, IncidentEscalatedEvent } from '../shared/events/domain-events';

@Injectable()
export class IncidentsService {
    constructor(
        @InjectRepository(Incident) private incidentsRepo: Repository<Incident>,
        @InjectRepository(IncidentTimeline) private timelineRepo: Repository<IncidentTimeline>,
        @InjectQueue(QUEUE_INCIDENTS) private escalationQueue: Queue,
        private eventEmitter: EventEmitter2,
    ) { }

    /**
     * Create a new incident with SLA deadline calculation
     */
    async create(tenantId: string, data: Partial<Incident>, reportedById: string): Promise<Incident> {
        const severity = data.severity || IncidentSeverity.MEDIUM;
        const slaConfig = SLA_DEFAULTS[severity];
        const slaDeadline = new Date(Date.now() + slaConfig.response * 60 * 1000);

        const incident = this.incidentsRepo.create({
            ...data,
            tenantId,
            reportedById,
            severity,
            status: IncidentStatus.OPEN,
            slaDeadline,
            slaBreached: false,
            escalationLevel: 0,
        });

        const saved = await this.incidentsRepo.save(incident);

        // Create initial timeline entry
        await this.addTimelineEntry(saved.id, tenantId, reportedById, TimelineAction.CREATED, 'Incident reported');

        // Schedule auto-escalation if configured
        if (slaConfig.autoEscalate) {
            await this.escalationQueue.add(
                'check-escalation',
                { incidentId: saved.id, tenantId },
                { delay: slaConfig.autoEscalate * 60 * 1000 },
            );
        }

        // Emit event
        this.eventEmitter.emit(
            EVENTS.INCIDENT_CREATED,
            new IncidentCreatedEvent(tenantId, saved.id, severity, saved.locationId, reportedById),
        );

        return saved;
    }

    /**
     * Get all incidents for a tenant with optional filters
     */
    async findAll(tenantId: string, opts?: {
        status?: IncidentStatus; severity?: IncidentSeverity;
        locationId?: string; limit?: number;
    }): Promise<Incident[]> {
        const where: any = { tenantId };
        if (opts?.status) where.status = opts.status;
        if (opts?.severity) where.severity = opts.severity;
        if (opts?.locationId) where.locationId = opts.locationId;

        return this.incidentsRepo.find({
            where,
            relations: ['reportedBy', 'location', 'assignedTo'],
            order: { createdAt: 'DESC' },
            take: opts?.limit || 50,
        });
    }

    /**
     * Get a single incident with full timeline
     */
    async findOne(tenantId: string, id: string): Promise<Incident> {
        const incident = await this.incidentsRepo.findOne({
            where: { id, tenantId },
            relations: ['reportedBy', 'location', 'assignedTo', 'timeline', 'timeline.user'],
        });
        if (!incident) throw new NotFoundException('Incident not found');
        return incident;
    }

    /**
     * Acknowledge an incident (stops SLA clock)
     */
    async acknowledge(tenantId: string, id: string, userId: string): Promise<Incident> {
        const incident = await this.findOne(tenantId, id);
        incident.acknowledgedAt = new Date();
        incident.status = IncidentStatus.INVESTIGATING;
        const saved = await this.incidentsRepo.save(incident);

        await this.addTimelineEntry(id, tenantId, userId, TimelineAction.ACKNOWLEDGED, 'Incident acknowledged');
        return saved;
    }

    /**
     * Assign incident to a user
     */
    async assign(tenantId: string, id: string, assignedToId: string, assignedById: string): Promise<Incident> {
        const incident = await this.findOne(tenantId, id);
        incident.assignedToId = assignedToId;
        const saved = await this.incidentsRepo.save(incident);

        await this.addTimelineEntry(id, tenantId, assignedById, TimelineAction.ASSIGNED, `Assigned to user ${assignedToId}`);
        return saved;
    }

    /**
     * Update incident status
     */
    async updateStatus(tenantId: string, id: string, status: IncidentStatus, userId: string, comment?: string): Promise<Incident> {
        const incident = await this.findOne(tenantId, id);
        const previousStatus = incident.status;
        incident.status = status;

        if (status === IncidentStatus.RESOLVED) incident.resolvedAt = new Date();
        if (status === IncidentStatus.CLOSED) incident.closedAt = new Date();

        const saved = await this.incidentsRepo.save(incident);

        await this.addTimelineEntry(
            id, tenantId, userId, TimelineAction.STATUS_CHANGED,
            comment || `Status changed from ${previousStatus} to ${status}`,
            { previousStatus, newStatus: status },
        );

        return saved;
    }

    /**
     * Escalate an incident to the next level
     */
    async escalate(tenantId: string, id: string, userId?: string): Promise<Incident> {
        const incident = await this.findOne(tenantId, id);
        incident.escalationLevel = Math.min(incident.escalationLevel + 1, 3);
        incident.status = IncidentStatus.ESCALATED;
        const saved = await this.incidentsRepo.save(incident);

        await this.addTimelineEntry(
            id, tenantId, userId || null, TimelineAction.ESCALATED,
            `Escalated to level ${saved.escalationLevel}`,
        );

        this.eventEmitter.emit(
            EVENTS.INCIDENT_ESCALATED,
            new IncidentEscalatedEvent(tenantId, id, saved.escalationLevel, saved.assignedToId),
        );

        return saved;
    }

    /**
     * Add a note/comment to the incident timeline
     */
    async addNote(tenantId: string, incidentId: string, userId: string, comment: string): Promise<IncidentTimeline> {
        return this.addTimelineEntry(incidentId, tenantId, userId, TimelineAction.NOTE_ADDED, comment);
    }

    /**
     * Check for SLA breaches and auto-escalate
     */
    async checkSlaBreaches(tenantId: string): Promise<Incident[]> {
        const now = new Date();
        const breached = await this.incidentsRepo
            .createQueryBuilder('i')
            .where('i.tenantId = :tenantId', { tenantId })
            .andWhere('i.slaBreached = false')
            .andWhere('i.slaDeadline < :now', { now })
            .andWhere('i.status NOT IN (:...statuses)', { statuses: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] })
            .getMany();

        for (const incident of breached) {
            incident.slaBreached = true;
            await this.incidentsRepo.save(incident);
            await this.addTimelineEntry(incident.id, tenantId, null, TimelineAction.SLA_BREACHED, 'SLA deadline exceeded');
            await this.escalate(tenantId, incident.id);
        }

        return breached;
    }

    /**
     * Dashboard stats
     */
    async getStats(tenantId: string): Promise<Record<string, number>> {
        const [open, investigating, escalated, breached] = await Promise.all([
            this.incidentsRepo.count({ where: { tenantId, status: IncidentStatus.OPEN } }),
            this.incidentsRepo.count({ where: { tenantId, status: IncidentStatus.INVESTIGATING } }),
            this.incidentsRepo.count({ where: { tenantId, status: IncidentStatus.ESCALATED } }),
            this.incidentsRepo.count({ where: { tenantId, slaBreached: true, status: IncidentStatus.OPEN as any } }),
        ]);

        return { open, investigating, escalated, slaBreached: breached, total: open + investigating + escalated };
    }

    // — Private Helpers —

    private async addTimelineEntry(
        incidentId: string, tenantId: string, userId: string | null | undefined,
        action: TimelineAction, comment: string, metadata?: Record<string, unknown>,
    ): Promise<IncidentTimeline> {
        const entry = this.timelineRepo.create({
            incidentId, tenantId, userId: userId || undefined, action, comment, metadata,
        });
        return this.timelineRepo.save(entry);
    }
}
