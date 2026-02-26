// ============================================================
// Queue Module — Shared BullMQ infrastructure
// Configures Redis connection and registers named queues
// ============================================================
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Queue name constants
export const QUEUE_COMPLIANCE = 'compliance-checks';
export const QUEUE_NOTIFICATIONS = 'notifications';
export const QUEUE_REPORTS = 'report-generation';
export const QUEUE_ANALYTICS = 'analytics';
export const QUEUE_INCIDENTS = 'incident-escalation';
export const QUEUE_GPS = 'gps-processing';

@Module({
    imports: [
        // Global BullMQ connection using Redis
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: {
                    host: config.get('REDIS_HOST', 'localhost'),
                    port: config.get<number>('REDIS_PORT', 6379),
                },
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 1000 },
                    removeOnComplete: { count: 100 },
                    removeOnFail: { count: 500 },
                },
            }),
        }),

        // Register individual queues
        BullModule.registerQueue(
            { name: QUEUE_COMPLIANCE },
            { name: QUEUE_NOTIFICATIONS },
            { name: QUEUE_REPORTS },
            { name: QUEUE_ANALYTICS },
            { name: QUEUE_INCIDENTS },
            { name: QUEUE_GPS },
        ),
    ],
    exports: [BullModule],
})
export class QueueModule { }
