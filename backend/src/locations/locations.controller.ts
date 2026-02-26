import {
    Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { Roles, RolesGuard } from '../common/roles.guard';
import { UserRole } from '../entities';

@ApiTags('locations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('locations')
export class LocationsController {
    constructor(private locationsService: LocationsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Create a new security site' })
    create(@Body() data: any) {
        return this.locationsService.create(data);
    }

    @Get()
    @ApiOperation({ summary: 'List all locations (paginated)' })
    findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
        return this.locationsService.findAll(page, limit);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get location by ID' })
    findOne(@Param('id') id: string) {
        return this.locationsService.findOne(id);
    }

    @Put(':id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Update location' })
    update(@Param('id') id: string, @Body() data: any) {
        return this.locationsService.update(id, data);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Deactivate location' })
    remove(@Param('id') id: string) {
        return this.locationsService.remove(id);
    }
}
