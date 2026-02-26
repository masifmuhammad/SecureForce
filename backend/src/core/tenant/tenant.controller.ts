// ============================================================
// Tenant Controller — Admin portal for managing tenant settings
// ============================================================
import {
    Controller, Get, Put, Body, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantService } from './tenant.service';
import { Roles, RolesGuard } from '../../common/roles.guard';
import { UserRole, User } from '../../entities';
import { CurrentTenant } from './decorators/current-tenant.decorator';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('tenants')
export class TenantController {
    constructor(
        private tenantService: TenantService,
        @InjectRepository(User) private usersRepo: Repository<User>,
    ) { }

    @Get('my')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get current tenant info with usage stats' })
    async getMyTenant(@CurrentTenant() tenantId: string) {
        const tenant = await this.tenantService.findById(tenantId);
        const userCount = await this.usersRepo.count({ where: { tenantId } });

        return {
            ...tenant,
            usage: {
                currentUsers: userCount,
                maxUsers: tenant.maxUsers,
                usagePercent: Math.round((userCount / tenant.maxUsers) * 100),
            },
        };
    }

    @Put('my')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update current tenant settings' })
    async updateMyTenant(
        @CurrentTenant() tenantId: string,
        @Body() data: any,
    ) {
        // Only allow updating safe fields
        const allowedFields = [
            'name', 'domain', 'abn', 'logoUrl',
            'primaryContactName', 'primaryContactEmail', 'primaryContactPhone',
            'settings',
        ];

        const safeData: any = {};
        for (const key of allowedFields) {
            if (data[key] !== undefined) {
                safeData[key] = data[key];
            }
        }

        return this.tenantService.update(tenantId, safeData);
    }
}
