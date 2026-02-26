// ============================================================
// Analytics Processor — BullMQ worker for nightly snapshots
// ============================================================
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../core/tenant/tenant.entity';
import { AnalyticsService } from './analytics.service';
import { QUEUE_ANALYTICS } from '../shared/queues/queue.module';

@Processor(QUEUE_ANALYTICS)
export class AnalyticsProcessor extends WorkerHost {
    private readonly logger = new Logger(AnalyticsProcessor.name);

    constructor(
        private readonly analyticsService: AnalyticsService,
        @InjectRepository(Tenant)
        private tenantRepo: Repository<Tenant>,
    ) {
        super();
    }

    async process(job: Job) {
        this.logger.log(`Processing analytics job: ${job.name}`);

        if (job.name === 'daily-snapshot') {
            // Compute snapshots for all active tenants
            const tenants = await this.tenantRepo.find({ where: { isActive: true } });
            let processed = 0;

            for (const tenant of tenants) {
                try {
                    await this.analyticsService.computeDailySnapshot(tenant.id);
                    processed++;
                } catch (err) {
                    this.logger.error(`Snapshot failed for tenant ${tenant.id}:`, err);
                }
            }

            this.logger.log(`Daily snapshots complete: ${processed}/${tenants.length} tenants`);
            return { processed, total: tenants.length };
        }

        if (job.name === 'tenant-snapshot') {
            // Single tenant snapshot (on demand)
            const { tenantId } = job.data;
            return this.analyticsService.computeDailySnapshot(tenantId);
        }

        this.logger.warn(`Unknown job name: ${job.name}`);
    }
}
