// ============================================================
// AnalyticsSnapshot Entity — Precomputed daily metrics
// Guard performance, site risk, revenue, coverage KPIs
// ============================================================
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    Index,
} from 'typeorm';

export enum MetricType {
    GUARD_PERFORMANCE = 'guard_performance',
    SITE_RISK = 'site_risk',
    INCIDENT_TREND = 'incident_trend',
    REVENUE = 'revenue',
    COVERAGE = 'coverage',
    COMPLIANCE = 'compliance',
}

@Entity('analytics_snapshots')
@Index(['tenantId', 'date', 'metricType'])
export class AnalyticsSnapshot {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    tenantId: string;

    @Column({ type: 'date' })
    date: Date;

    @Column({ type: 'enum', enum: MetricType })
    metricType: MetricType;

    @Column({ type: 'uuid', nullable: true })
    entityId: string; // Guard ID or Location ID or null for aggregate

    @Column({ type: 'jsonb' })
    value: Record<string, unknown>;
    // e.g., { onTimeRate: 0.95, shiftCompletion: 0.98, score: 87 }

    @CreateDateColumn()
    computedAt: Date;
}
