// ============================================================
// Auth Controller — Login, Register, Refresh, 2FA endpoints
// Enhanced with backup code support
// ============================================================
import {
    Controller, Post, Body, UseGuards, Request, Get, Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register new user' })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Login with email & password (+ optional 2FA or backup code)' })
    login(@Body() dto: LoginDto, @Ip() ip: string) {
        return this.authService.login(dto, ip);
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh access token' })
    refresh(@Body('refreshToken') refreshToken: string) {
        return this.authService.refreshToken(refreshToken);
    }

    @Post('2fa/enable')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Generate 2FA secret & QR code' })
    enableTwoFactor(@Request() req: any) {
        return this.authService.enableTwoFactor(req.user.id);
    }

    @Post('2fa/verify')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Verify & activate 2FA' })
    verifyTwoFactor(@Request() req: any, @Body('code') code: string) {
        return this.authService.verifyTwoFactor(req.user.id, code);
    }

    @Post('2fa/backup-codes')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Generate 2FA backup codes (one-time display)' })
    generateBackupCodes(@Request() req: any) {
        return this.authService.generateBackupCodes(req.user.id);
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    getProfile(@Request() req: any) {
        return req.user;
    }
}
