import {
    Controller, Get, Post, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Roles, RolesGuard } from '../common/roles.guard';
import { UserRole, ReportType, ReportPriority } from '../entities';
import { CurrentTenant } from '../core/tenant/decorators/current-tenant.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('reports')
export class ReportsController {
    constructor(private reportsService: ReportsService) { }

    @Post()
    @ApiOperation({ summary: 'Submit a new report' })
    create(@Request() req: any, @Body() data: any) {
        return this.reportsService.create(req.user.id, data);
    }

    @Get()
    @ApiOperation({ summary: 'List all reports (paginated, filterable)' })
    findAll(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('type') type?: ReportType,
        @Query('priority') priority?: ReportPriority,
    ) {
        return this.reportsService.findAll(page, limit, { type, priority });
    }

    @Get('stats')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get report statistics' })
    getStats() {
        return this.reportsService.getStats();
    }

    @Get('compliance')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Compliance violation report' })
    getComplianceReport(@CurrentTenant() tenantId: string) {
        return this.reportsService.getComplianceReport(tenantId);
    }

    @Get('incidents')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Incident summary report' })
    getIncidentSummary(
        @CurrentTenant() tenantId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.reportsService.getIncidentSummary(tenantId, startDate, endDate);
    }

    @Get('coverage')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Shift coverage analysis' })
    getCoverageAnalysis(@CurrentTenant() tenantId: string) {
        return this.reportsService.getCoverageAnalysis(tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get report by ID' })
    findOne(@Param('id') id: string) {
        return this.reportsService.findOne(id);
    }
}

