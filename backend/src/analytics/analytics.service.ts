// ============================================================
// Analytics Service — Dashboard KPIs, trends, snapshot computation
// ============================================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { AnalyticsSnapshot, MetricType } from '../entities/analytics-snapshot.entity';
import { Shift, ShiftStatus } from '../entities';
import { CheckIn } from '../entities';
import { Incident } from '../entities';
import { ComplianceViolation } from '../entities';
import { User } from '../entities';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(AnalyticsSnapshot)
        private snapshotRepo: Repository<AnalyticsSnapshot>,
        @InjectRepository(Shift)
        private shiftRepo: Repository<Shift>,
        @InjectRepository(CheckIn)
        private checkinRepo: Repository<CheckIn>,
        @InjectRepository(Incident)
        private incidentRepo: Repository<Incident>,
        @InjectRepository(ComplianceViolation)
        private violationRepo: Repository<ComplianceViolation>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    /** Real-time dashboard KPIs */
    async getDashboardStats(tenantId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [
            totalGuards,
            activeGuards,
            shiftsToday,
            activeShifts,
            totalIncidents,
            openIncidents,
            recentViolations,
            totalCheckins,
        ] = await Promise.all([
            this.userRepo.count({ where: { tenantId } }),
            this.userRepo.count({ where: { tenantId, isActive: true } }),
            this.shiftRepo.count({
                where: { tenantId, startTime: Between(today, tomorrow) },
            }),
            this.shiftRepo.count({
                where: { tenantId, status: ShiftStatus.IN_PROGRESS },
            }),
            this.incidentRepo.count({ where: { tenantId } }),
            this.incidentRepo.count({ where: { tenantId, status: 'open' as any } }),
            this.violationRepo.count({
                where: { tenantId, createdAt: MoreThanOrEqual(today) },
            }),
            this.checkinRepo.count({
                where: { tenantId, timestamp: Between(today, tomorrow) },
            }),
        ]);

        // Compliance score: inversely proportional to violations
        const complianceScore = Math.max(0, Math.min(100,
            totalGuards > 0 ? Math.round(100 - (recentViolations / totalGuards) * 100) : 100
        ));

        return {
            totalGuards,
            activeGuards,
            shiftsToday,
            activeShifts,
            totalIncidents,
            openIncidents,
            complianceScore,
            checkinsToday: totalCheckins,
        };
    }

    /** Trend data from snapshots */
    async getTrends(tenantId: string, period: '7d' | '30d' | '90d' = '7d') {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const since = new Date();
        since.setDate(since.getDate() - days);

        const snapshots = await this.snapshotRepo.find({
            where: {
                tenantId,
                date: MoreThanOrEqual(since),
            },
            order: { date: 'ASC' },
        });

        // Group by date and metric type
        const grouped: Record<string, Record<string, any>> = {};
        for (const snap of snapshots) {
            const dateKey = new Date(snap.date).toISOString().split('T')[0];
            if (!grouped[dateKey]) grouped[dateKey] = { date: dateKey };
            grouped[dateKey][snap.metricType] = snap.value;
        }

        return {
            period,
            data: Object.values(grouped),
        };
    }

    /** Compute and store daily snapshot (called by BullMQ processor) */
    async computeDailySnapshot(tenantId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const stats = await this.getDashboardStats(tenantId);

        const snapshots: Partial<AnalyticsSnapshot>[] = [
            {
                tenantId,
                date: today,
                metricType: MetricType.COVERAGE,
                value: {
                    shiftsToday: stats.shiftsToday,
                    activeShifts: stats.activeShifts,
                    checkinsToday: stats.checkinsToday,
                },
            },
            {
                tenantId,
                date: today,
                metricType: MetricType.COMPLIANCE,
                value: {
                    score: stats.complianceScore,
                    totalGuards: stats.totalGuards,
                },
            },
            {
                tenantId,
                date: today,
                metricType: MetricType.INCIDENT_TREND,
                value: {
                    total: stats.totalIncidents,
                    open: stats.openIncidents,
                },
            },
        ];

        for (const snap of snapshots) {
            await this.snapshotRepo.save(this.snapshotRepo.create(snap));
        }

        return { computed: snapshots.length, date: today.toISOString() };
    }
}
