// ============================================================
// Notifications Controller — REST endpoints for in-app notifications
// ============================================================
import { Controller, Get, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../core/auth/guards/roles.guard';
import { CurrentTenant } from '../core/tenant/decorators/current-tenant.decorator';
import { NotificationsService } from './notifications.service';

@Controller({ path: 'notifications', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    /** GET /api/v1/notifications — list user's notifications */
    @Get()
    findAll(
        @CurrentTenant() tenantId: string,
        @Req() req: any,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
    ) {
        return this.notificationsService.findByUser(
            tenantId,
            req.user.id,
            parseInt(page, 10),
            parseInt(limit, 10),
        );
    }

    /** GET /api/v1/notifications/unread-count */
    @Get('unread-count')
    getUnreadCount(
        @CurrentTenant() tenantId: string,
        @Req() req: any,
    ) {
        return this.notificationsService.getUnreadCount(tenantId, req.user.id);
    }

    /** PATCH /api/v1/notifications/:id/read */
    @Patch(':id/read')
    markAsRead(
        @CurrentTenant() tenantId: string,
        @Param('id') id: string,
    ) {
        return this.notificationsService.markAsRead(tenantId, id);
    }

    /** PATCH /api/v1/notifications/read-all */
    @Patch('read-all')
    markAllAsRead(
        @CurrentTenant() tenantId: string,
        @Req() req: any,
    ) {
        return this.notificationsService.markAllAsRead(tenantId, req.user.id);
    }
}
