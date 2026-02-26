import {
    Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request, Ip,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CheckinsService } from './checkins.service';
import { Roles, RolesGuard } from '../common/roles.guard';
import { UserRole, VerificationStatus } from '../entities';

@ApiTags('checkins')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('checkins')
export class CheckinsController {
    constructor(private checkinsService: CheckinsService) { }

    @Post()
    @ApiOperation({ summary: 'Submit a GPS-verified check-in or check-out' })
    create(@Request() req: any, @Body() data: any, @Ip() ip: string) {
        return this.checkinsService.create(req.user.id, data, ip);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'List all check-ins (paginated)' })
    findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
        return this.checkinsService.findAll(page, limit);
    }

    @Get('flagged')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get flagged/suspicious check-ins' })
    getFlagged(@Query('page') page = 1, @Query('limit') limit = 20) {
        return this.checkinsService.getFlagged(page, limit);
    }

    @Get('shift/:shiftId')
    @ApiOperation({ summary: 'Get check-ins for a specific shift' })
    findByShift(@Param('shiftId') shiftId: string) {
        return this.checkinsService.findByShift(shiftId);
    }

    @Put(':id/verify')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Update check-in verification status' })
    updateVerification(
        @Param('id') id: string,
        @Body('status') status: VerificationStatus,
        @Body('notes') notes?: string,
    ) {
        return this.checkinsService.updateVerification(id, status, notes);
    }
}
