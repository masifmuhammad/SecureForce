import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles, RolesGuard } from '../common/roles.guard';
import { UserRole } from '../entities';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('audit')
export class AuditController {
    constructor(private auditService: AuditService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get all audit logs (paginated)' })
    findAll(@Query('page') page = 1, @Query('limit') limit = 50) {
        return this.auditService.findAll(page, limit);
    }
}
