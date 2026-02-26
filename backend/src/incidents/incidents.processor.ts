// ============================================================
// Incident Escalation Processor — BullMQ delayed job handler
// Auto-escalates incidents that haven't been acknowledged
// ============================================================
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IncidentsService } from './incidents.service';
import { QUEUE_INCIDENTS } from '../shared/queues/queue.module';

@Processor(QUEUE_INCIDENTS)
export class IncidentProcessor extends WorkerHost {
    private readonly logger = new Logger(IncidentProcessor.name);

    constructor(private incidentsService: IncidentsService) {
        super();
    }

    async process(job: Job<{ incidentId: string; tenantId: string }>): Promise<any> {
        const { incidentId, tenantId } = job.data;

        if (job.name === 'check-escalation') {
            return this.handleEscalationCheck(tenantId, incidentId);
        }

        if (job.name === 'sla-breach-scan') {
            return this.handleSlaScan(tenantId);
        }
    }

    private async handleEscalationCheck(tenantId: string, incidentId: string) {
        this.logger.log(`[Escalation Check] Incident ${incidentId}`);
        try {
            const incident = await this.incidentsService.findOne(tenantId, incidentId);

            // If still open and not acknowledged, auto-escalate
            if (!incident.acknowledgedAt && incident.status === 'open') {
                await this.incidentsService.escalate(tenantId, incidentId);
                this.logger.warn(`[Auto-Escalated] Incident ${incidentId} — no acknowledgement within SLA`);
            }
        } catch (error) {
            this.logger.error(`[Escalation Check] Failed for incident ${incidentId}`, error);
            throw error;
        }
    }

    private async handleSlaScan(tenantId: string) {
        this.logger.log(`[SLA Scan] Running for tenant ${tenantId}`);
        const breached = await this.incidentsService.checkSlaBreaches(tenantId);
        this.logger.log(`[SLA Scan] Found ${breached.length} breached incidents`);
        return { breached: breached.length };
    }
}
