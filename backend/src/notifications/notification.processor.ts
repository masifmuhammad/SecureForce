// ============================================================
// Notification Processor — BullMQ worker for domain events
// Creates notification records when events fire
// ============================================================
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities';
import { NotificationsService } from './notifications.service';
import { NotificationType } from '../entities/notification.entity';
import { QUEUE_NOTIFICATIONS } from '../shared/queues/queue.module';

@Processor(QUEUE_NOTIFICATIONS)
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(
        private readonly notificationsService: NotificationsService,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) {
        super();
    }

    async process(job: Job) {
        this.logger.log(`Processing notification job: ${job.name}`);
        const { tenantId } = job.data;

        switch (job.name) {
            case 'incident.created': {
                const { severity, incidentId } = job.data;
                // Notify all managers in the tenant
                const managers = await this.userRepo.find({
                    where: { tenantId, role: 'manager' as any, isActive: true },
                });
                for (const mgr of managers) {
                    await this.notificationsService.create({
                        tenantId,
                        userId: mgr.id,
                        type: NotificationType.INCIDENT,
                        title: `New ${severity} Incident`,
                        message: `A ${severity} severity incident has been reported and requires your attention.`,
                        metadata: { incidentId },
                    });
                }
                break;
            }

            case 'compliance.violation': {
                const { userId, violationType } = job.data;
                await this.notificationsService.create({
                    tenantId,
                    userId,
                    type: NotificationType.COMPLIANCE,
                    title: 'Compliance Violation',
                    message: `A ${violationType} compliance violation has been recorded on your profile.`,
                    metadata: { violationType },
                });
                break;
            }

            case 'shift.assigned': {
                const { userId, shiftId } = job.data;
                await this.notificationsService.create({
                    tenantId,
                    userId,
                    type: NotificationType.SHIFT,
                    title: 'New Shift Assigned',
                    message: 'You have been assigned a new shift. Check your schedule for details.',
                    metadata: { shiftId },
                });
                break;
            }

            case 'license.expiring': {
                const { userId, daysUntilExpiry, licenseId } = job.data;
                await this.notificationsService.create({
                    tenantId,
                    userId,
                    type: NotificationType.ALERT,
                    title: 'License Expiring Soon',
                    message: `Your guard license expires in ${daysUntilExpiry} days. Please renew it promptly.`,
                    metadata: { licenseId, daysUntilExpiry },
                });
                break;
            }

            default:
                this.logger.warn(`Unknown notification job: ${job.name}`);
        }
    }
}
