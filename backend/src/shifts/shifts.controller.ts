import {
    Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { Roles, RolesGuard } from '../common/roles.guard';
import { UserRole, ShiftStatus } from '../entities';

@ApiTags('shifts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('shifts')
export class ShiftsController {
    constructor(private shiftsService: ShiftsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Create a new shift' })
    create(@Body() data: any) {
        return this.shiftsService.create(data);
    }

    @Get()
    @ApiOperation({ summary: 'List shifts (with filters)' })
    findAll(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('userId') userId?: string,
        @Query('locationId') locationId?: string,
        @Query('status') status?: ShiftStatus,
    ) {
        return this.shiftsService.findAll(page, limit, { userId, locationId, status });
    }

    @Get('stats')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get shift statistics' })
    getStats() {
        return this.shiftsService.getStats();
    }

    @Get('open')
    @ApiOperation({ summary: 'Get available open shifts' })
    getOpenShifts() {
        return this.shiftsService.findOpenShifts();
    }

    @Get('my-upcoming')
    @ApiOperation({ summary: 'Get my upcoming shifts' })
    getUpcoming(@Request() req: any) {
        return this.shiftsService.findUpcomingForUser(req.user.id);
    }

    @Get('assignments')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get shift assignments for tracking' })
    getAssignments(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('status') status?: ShiftStatus,
        @Query('showOpen') showOpen?: string,
    ) {
        return this.shiftsService.findAssignments(page, limit, {
            status,
            showOpen: showOpen === 'true',
        });
    }

    @Get('range')
    @ApiOperation({ summary: 'Get shifts in a date range' })
    getByRange(@Query('start') start: string, @Query('end') end: string) {
        return this.shiftsService.findByDateRange(new Date(start), new Date(end));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get shift by ID' })
    findOne(@Param('id') id: string) {
        return this.shiftsService.findOne(id);
    }

    @Post(':id/accept')
    @ApiOperation({ summary: 'Accept an open shift' })
    acceptShift(@Param('id') id: string, @Request() req: any) {
        return this.shiftsService.acceptShift(id, req.user.id);
    }

    @Post(':id/decline')
    @ApiOperation({ summary: 'Decline an open shift' })
    declineShift(@Param('id') id: string, @Request() req: any) {
        return this.shiftsService.declineShift(id, req.user.id);
    }

    @Post(':id/assign')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Assign a guard to an open shift' })
    assignShift(@Param('id') id: string, @Body('userId') userId: string) {
        return this.shiftsService.assignShift(id, userId);
    }

    @Put(':id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Update shift' })
    update(@Param('id') id: string, @Body() data: any) {
        return this.shiftsService.update(id, data);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Cancel shift' })
    cancel(@Param('id') id: string) {
        return this.shiftsService.cancel(id);
    }
}
