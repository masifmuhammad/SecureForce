// ============================================================
// Reports Module — Incident and shift reports
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report, ComplianceViolation, Incident, Shift } from '../entities';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Report, ComplianceViolation, Incident, Shift])],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService],
})
export class ReportsModule { }
