import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Report, ReportType, ReportPriority } from '../entities';
import { ComplianceViolation } from '../entities';
import { Incident } from '../entities';
import { Shift, ShiftStatus } from '../entities';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Report) private reportsRepo: Repository<Report>,
        @InjectRepository(ComplianceViolation) private violationRepo: Repository<ComplianceViolation>,
        @InjectRepository(Incident) private incidentRepo: Repository<Incident>,
        @InjectRepository(Shift) private shiftRepo: Repository<Shift>,
    ) { }

    async create(userId: string, data: Partial<Report>) {
        const report = this.reportsRepo.create({ ...data, userId });
        return this.reportsRepo.save(report);
    }

    async findAll(page = 1, limit = 20, filters?: { type?: ReportType; priority?: ReportPriority }) {
        const where: any = {};
        if (filters?.type) where.type = filters.type;
        if (filters?.priority) where.priority = filters.priority;

        const [items, total] = await this.reportsRepo.findAndCount({
            where,
            relations: ['user'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, totalPages: Math.ceil(total / limit) };
    }

    async findOne(id: string) {
        const report = await this.reportsRepo.findOne({
            where: { id },
            relations: ['user', 'shift'],
        });
        if (!report) throw new NotFoundException('Report not found');
        return report;
    }

    async getStats() {
        const total = await this.reportsRepo.count();
        const critical = await this.reportsRepo.count({ where: { priority: ReportPriority.CRITICAL } });
        const high = await this.reportsRepo.count({ where: { priority: ReportPriority.HIGH } });
        return { total, critical, high };
    }

    /** Compliance report — violation summary */
    async getComplianceReport(tenantId: string) {
        const violations = await this.violationRepo.find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
            take: 100,
        });

        const bySeverity: Record<string, number> = {};
        const byType: Record<string, number> = {};
        for (const v of violations) {
            bySeverity[v.severity] = (bySeverity[v.severity] || 0) + 1;
            byType[v.type] = (byType[v.type] || 0) + 1;
        }

        return {
            total: violations.length,
            bySeverity,
            byType,
            recent: violations.slice(0, 10),
        };
    }

    /** Incident summary — by date range, severity, status */
    async getIncidentSummary(tenantId: string, startDate?: string, endDate?: string) {
        const where: any = { tenantId };
        if (startDate && endDate) {
            where.createdAt = Between(new Date(startDate), new Date(endDate));
        }

        const incidents = await this.incidentRepo.find({
            where,
            order: { createdAt: 'DESC' },
            take: 200,
        });

        const bySeverity: Record<string, number> = {};
        const byStatus: Record<string, number> = {};
        for (const i of incidents) {
            bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
            byStatus[i.status] = (byStatus[i.status] || 0) + 1;
        }

        return {
            total: incidents.length,
            bySeverity,
            byStatus,
            recent: incidents.slice(0, 10),
        };
    }

    /** Shift coverage analysis — hours by location */
    async getCoverageAnalysis(tenantId: string) {
        const shifts = await this.shiftRepo.find({
            where: { tenantId },
            relations: ['location'],
            order: { startTime: 'DESC' },
            take: 500,
        });

        const byLocation: Record<string, { name: string; shifts: number; hours: number }> = {};
        for (const s of shifts) {
            const locId = s.locationId || 'unassigned';
            const locName = s.location?.name || 'Unassigned';
            if (!byLocation[locId]) byLocation[locId] = { name: locName, shifts: 0, hours: 0 };
            byLocation[locId].shifts++;
            const hours = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 3600000;
            byLocation[locId].hours += Math.round(hours * 10) / 10;
        }

        return {
            totalShifts: shifts.length,
            byLocation: Object.values(byLocation),
        };
    }
}

