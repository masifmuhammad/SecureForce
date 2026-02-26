// ============================================================
// Analytics Module — KPI aggregation, snapshots, trends
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsSnapshot } from '../entities/analytics-snapshot.entity';
import { Shift } from '../entities';
import { CheckIn } from '../entities';
import { Incident } from '../entities';
import { ComplianceViolation } from '../entities';
import { User } from '../entities';
import { Tenant } from '../core/tenant/tenant.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsProcessor } from './analytics.processor';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            AnalyticsSnapshot,
            Shift,
            CheckIn,
            Incident,
            ComplianceViolation,
            User,
            Tenant,
        ]),
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService, AnalyticsProcessor],
    exports: [AnalyticsService],
})
export class AnalyticsModule { }
