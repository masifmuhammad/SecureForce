// ============================================================
// Users Controller — Employee CRUD with tenant isolation
// ============================================================
import {
    Controller, Get, Put, Patch, Post, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles, RolesGuard } from '../common/roles.guard';
import { UserRole } from '../entities';
import { CurrentTenant } from '../core/tenant/decorators/current-tenant.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'List all employees (paginated, tenant-scoped)' })
    findAll(
        @CurrentTenant() tenantId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.usersService.findAll(tenantId, page, limit);
    }

    @Get('stats')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get user statistics' })
    getStats(@CurrentTenant() tenantId: string) {
        return this.usersService.getStats(tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID' })
    findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
        return this.usersService.findOne(id, tenantId);
    }

    @Put(':id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Update user details' })
    update(
        @Param('id') id: string,
        @Body() data: any,
        @CurrentTenant() tenantId: string,
    ) {
        return this.usersService.update(id, data, tenantId);
    }

    @Post('invite')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Invite a new employee (generates temporary password)' })
    invite(@Body() data: any, @CurrentTenant() tenantId: string) {
        return this.usersService.inviteUser(data, tenantId);
    }

    @Patch(':id/role')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Change user role (admin only)' })
    updateRole(
        @Param('id') id: string,
        @Body('role') role: UserRole,
        @CurrentTenant() tenantId: string,
    ) {
        return this.usersService.updateRole(id, role, tenantId);
    }

    @Patch(':id/reactivate')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Reactivate a deactivated user' })
    reactivate(@Param('id') id: string, @CurrentTenant() tenantId: string) {
        return this.usersService.reactivate(id, tenantId);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Deactivate user (soft delete)' })
    deactivate(@Param('id') id: string, @CurrentTenant() tenantId: string) {
        return this.usersService.deactivate(id, tenantId);
    }
}
