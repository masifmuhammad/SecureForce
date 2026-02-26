// ============================================================
// Compliance Controller — License management & compliance scans
// ============================================================
import {
    Controller, Get, Post, Put, Delete, Body, Param, Query,
    UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { GuardLicense } from '../entities/guard-license.entity';

@ApiTags('compliance')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'compliance', version: '1' })
export class ComplianceController {
    constructor(private complianceService: ComplianceService) { }

    // — Licenses —

    @Get('licenses')
    @ApiOperation({ summary: 'Get all licenses for the tenant' })
    async getAllLicenses(@Request() req: any) {
        return this.complianceService.getAllLicenses(req.user.tenantId);
    }

    @Get('licenses/user/:userId')
    @ApiOperation({ summary: 'Get licenses by guard' })
    async getLicensesByUser(@Request() req: any, @Param('userId') userId: string) {
        return this.complianceService.getLicensesByUser(req.user.tenantId, userId);
    }

    @Post('licenses')
    @ApiOperation({ summary: 'Create a new guard license' })
    async createLicense(@Request() req: any, @Body() data: Partial<GuardLicense>) {
        return this.complianceService.createLicense(req.user.tenantId, data);
    }

    @Put('licenses/:id')
    @ApiOperation({ summary: 'Update a license' })
    async updateLicense(@Request() req: any, @Param('id') id: string, @Body() data: Partial<GuardLicense>) {
        return this.complianceService.updateLicense(req.user.tenantId, id, data);
    }

    @Delete('licenses/:id')
    @ApiOperation({ summary: 'Delete a license' })
    async deleteLicense(@Request() req: any, @Param('id') id: string) {
        return this.complianceService.deleteLicense(req.user.tenantId, id);
    }

    // — Violations —

    @Get('violations')
    @ApiOperation({ summary: 'Get compliance violations' })
    async getViolations(
        @Request() req: any,
        @Query('resolved') resolved?: string,
        @Query('userId') userId?: string,
    ) {
        return this.complianceService.getViolations(req.user.tenantId, {
            resolved: resolved !== undefined ? resolved === 'true' : undefined,
            userId,
        });
    }

    @Post('violations/:id/resolve')
    @ApiOperation({ summary: 'Resolve a violation' })
    async resolveViolation(
        @Request() req: any,
        @Param('id') id: string,
        @Body('notes') notes?: string,
    ) {
        return this.complianceService.resolveViolation(req.user.tenantId, id, req.user.sub, notes);
    }

    // — Compliance Scan —

    @Post('scan')
    @ApiOperation({ summary: 'Run a full compliance scan (overtime, rest, fatigue, licenses)' })
    async runScan(@Request() req: any) {
        return this.complianceService.runComplianceScan(req.user.tenantId);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get compliance dashboard statistics' })
    async getStats(@Request() req: any) {
        return this.complianceService.getComplianceStats(req.user.tenantId);
    }
}
