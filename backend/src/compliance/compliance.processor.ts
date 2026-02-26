// ============================================================
// Compliance Processor — BullMQ background job handler
// Runs nightly compliance scans per tenant
// ============================================================
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ComplianceService } from './compliance.service';
import { QUEUE_COMPLIANCE } from '../shared/queues/queue.module';

@Processor(QUEUE_COMPLIANCE)
export class ComplianceProcessor extends WorkerHost {
    private readonly logger = new Logger(ComplianceProcessor.name);

    constructor(private complianceService: ComplianceService) {
        super();
    }

    async process(job: Job<{ tenantId: string }>): Promise<any> {
        const { tenantId } = job.data;
        this.logger.log(`[Compliance Scan] Starting for tenant ${tenantId}`);

        try {
            const result = await this.complianceService.runComplianceScan(tenantId);
            this.logger.log(`[Compliance Scan] Found ${result.violations} violations for tenant ${tenantId}`);
            return result;
        } catch (error) {
            this.logger.error(`[Compliance Scan] Failed for tenant ${tenantId}`, error);
            throw error;
        }
    }
}
