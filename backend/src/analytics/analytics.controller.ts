// ============================================================
// Analytics Controller — Dashboard KPIs + trend endpoints
// ============================================================
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../core/auth/decorators/roles.decorator';
import { RolesGuard } from '../core/auth/guards/roles.guard';
import { CurrentTenant } from '../core/tenant/decorators/current-tenant.decorator';
import { AnalyticsService } from './analytics.service';

@Controller({ path: 'analytics', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    /** GET /api/v1/analytics/dashboard — Real-time KPIs */
    @Get('dashboard')
    getDashboard(@CurrentTenant() tenantId: string) {
        return this.analyticsService.getDashboardStats(tenantId);
    }

    /** GET /api/v1/analytics/trends?period=7d — Trend data */
    @Get('trends')
    getTrends(
        @CurrentTenant() tenantId: string,
        @Query('period') period: '7d' | '30d' | '90d' = '7d',
    ) {
        return this.analyticsService.getTrends(tenantId, period);
    }
}
