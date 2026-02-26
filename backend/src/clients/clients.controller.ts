// ============================================================
// Clients Controller — REST API for client organizations
// ============================================================
import {
    Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { Roles, RolesGuard } from '../common/roles.guard';
import { UserRole } from '../entities';
import { CurrentTenant } from '../core/tenant/decorators/current-tenant.decorator';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('clients')
export class ClientsController {
    constructor(private clientsService: ClientsService) { }

    @Get()
    @ApiOperation({ summary: 'List all client organizations (paginated)' })
    findAll(
        @CurrentTenant() tenantId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.clientsService.findAll(tenantId, page, limit);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get client statistics' })
    getStats(@CurrentTenant() tenantId: string) {
        return this.clientsService.getStats(tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get client organization by ID' })
    findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
        return this.clientsService.findOne(id, tenantId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new client organization' })
    create(@Body() data: any, @CurrentTenant() tenantId: string) {
        return this.clientsService.create(data, tenantId);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update client organization' })
    update(
        @Param('id') id: string,
        @Body() data: any,
        @CurrentTenant() tenantId: string,
    ) {
        return this.clientsService.update(id, data, tenantId);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Deactivate client organization' })
    deactivate(@Param('id') id: string, @CurrentTenant() tenantId: string) {
        return this.clientsService.deactivate(id, tenantId);
    }
}
