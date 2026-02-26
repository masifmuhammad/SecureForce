// ============================================================
// Compliance Module — License tracking & compliance rules
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuardLicense } from '../entities/guard-license.entity';
import { ComplianceViolation } from '../entities/compliance-violation.entity';
import { Shift } from '../entities/shift.entity';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { ComplianceRulesEngine } from './compliance-rules.engine';
import { ComplianceProcessor } from './compliance.processor';
import { QueueModule } from '../shared/queues/queue.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([GuardLicense, ComplianceViolation, Shift]),
        QueueModule,
    ],
    controllers: [ComplianceController],
    providers: [ComplianceService, ComplianceRulesEngine, ComplianceProcessor],
    exports: [ComplianceService],
})
export class ComplianceModule { }
