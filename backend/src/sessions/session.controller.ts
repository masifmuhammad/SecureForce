// ============================================================
// Session Controller — Manage active user sessions
// ============================================================
import {
    Controller, Get, Post, Delete, Param,
    UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SessionService } from './session.service';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'sessions', version: '1' })
export class SessionController {
    constructor(private sessionService: SessionService) { }

    @Get()
    @ApiOperation({ summary: 'Get all active sessions for the current user' })
    async getMySessions(@Request() req: any) {
        return this.sessionService.getUserSessions(req.user.tenantId, req.user.sub);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Revoke a specific session (remote logout)' })
    async revokeSession(@Request() req: any, @Param('id') id: string) {
        await this.sessionService.revokeSession(req.user.tenantId, id);
        return { message: 'Session revoked' };
    }

    @Post('revoke-all')
    @ApiOperation({ summary: 'Revoke all sessions except current' })
    async revokeAll(@Request() req: any) {
        await this.sessionService.revokeAllSessions(req.user.tenantId, req.user.sub);
        return { message: 'All sessions revoked' };
    }
}
