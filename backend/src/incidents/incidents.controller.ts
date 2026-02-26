// ============================================================
// Incidents Controller — Incident management REST API
// ============================================================
import {
    Controller, Get, Post, Put, Body, Param, Query,
    UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { Incident } from '../entities/incident.entity';
import { IncidentSeverity, IncidentStatus } from '../common/constants';

@ApiTags('incidents')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'incidents', version: '1' })
export class IncidentsController {
    constructor(private incidentsService: IncidentsService) { }

    @Post()
    @ApiOperation({ summary: 'Report a new incident' })
    async create(@Request() req: any, @Body() data: Partial<Incident>) {
        return this.incidentsService.create(req.user.tenantId, data, req.user.sub);
    }

    @Get()
    @ApiOperation({ summary: 'List incidents with optional filters' })
    async findAll(
        @Request() req: any,
        @Query('status') status?: IncidentStatus,
        @Query('severity') severity?: IncidentSeverity,
        @Query('locationId') locationId?: string,
        @Query('limit') limit?: number,
    ) {
        return this.incidentsService.findAll(req.user.tenantId, { status, severity, locationId, limit });
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get incident dashboard statistics' })
    async getStats(@Request() req: any) {
        return this.incidentsService.getStats(req.user.tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get incident with full timeline' })
    async findOne(@Request() req: any, @Param('id') id: string) {
        return this.incidentsService.findOne(req.user.tenantId, id);
    }

    @Post(':id/acknowledge')
    @ApiOperation({ summary: 'Acknowledge an incident (stops SLA clock)' })
    async acknowledge(@Request() req: any, @Param('id') id: string) {
        return this.incidentsService.acknowledge(req.user.tenantId, id, req.user.sub);
    }

    @Post(':id/assign')
    @ApiOperation({ summary: 'Assign incident to a user' })
    async assign(@Request() req: any, @Param('id') id: string, @Body('assignedToId') assignedToId: string) {
        return this.incidentsService.assign(req.user.tenantId, id, assignedToId, req.user.sub);
    }

    @Put(':id/status')
    @ApiOperation({ summary: 'Update incident status' })
    async updateStatus(
        @Request() req: any, @Param('id') id: string,
        @Body('status') status: IncidentStatus, @Body('comment') comment?: string,
    ) {
        return this.incidentsService.updateStatus(req.user.tenantId, id, status, req.user.sub, comment);
    }

    @Post(':id/escalate')
    @ApiOperation({ summary: 'Manually escalate incident' })
    async escalate(@Request() req: any, @Param('id') id: string) {
        return this.incidentsService.escalate(req.user.tenantId, id, req.user.sub);
    }

    @Post(':id/notes')
    @ApiOperation({ summary: 'Add a note to the incident timeline' })
    async addNote(@Request() req: any, @Param('id') id: string, @Body('comment') comment: string) {
        return this.incidentsService.addNote(req.user.tenantId, id, req.user.sub, comment);
    }

    @Post('sla/check')
    @ApiOperation({ summary: 'Check and process SLA breaches' })
    async checkSla(@Request() req: any) {
        return this.incidentsService.checkSlaBreaches(req.user.tenantId);
    }
}
