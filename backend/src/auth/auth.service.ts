// ============================================================
// Auth Service — Handles login, register, JWT, refresh, 2FA
// Enhanced with backup code support
// ============================================================
import {
    Injectable, UnauthorizedException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { User, UserRole } from '../entities';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private usersRepo: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private auditService: AuditService,
    ) { }

    /**
     * Register a new user (admin-only in production)
     */
    async register(dto: RegisterDto) {
        const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
        if (exists) throw new ConflictException('Email already registered');

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = this.usersRepo.create({
            ...dto,
            passwordHash,
            role: dto.role || UserRole.EMPLOYEE,
        });

        const saved = await this.usersRepo.save(user);
        await this.auditService.log(null, 'REGISTER', 'user', saved.id, { email: dto.email });

        return this.buildTokenResponse(saved);
    }

    /**
     * Login with email + password, optionally verify 2FA code or backup code
     */
    async login(dto: LoginDto, ip?: string) {
        const user = await this.usersRepo.findOne({ where: { email: dto.email } });
        if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        // If 2FA enabled, require a TOTP code or backup code
        if (user.isTwoFactorEnabled) {
            if (!dto.twoFactorCode) {
                return { requiresTwoFactor: true, message: 'Please provide your 2FA code' };
            }

            // Try TOTP first
            const isValid2FA = authenticator.verify({
                token: dto.twoFactorCode,
                secret: user.twoFactorSecret!,
            });

            if (!isValid2FA) {
                // Try backup code
                const backupValid = await this.consumeBackupCode(user, dto.twoFactorCode);
                if (!backupValid) {
                    throw new UnauthorizedException('Invalid 2FA code');
                }
            }
        }

        await this.auditService.log(user.id, 'LOGIN', 'user', user.id, { ip });
        return this.buildTokenResponse(user);
    }

    /**
     * Generate a new access token from a valid refresh token
     */
    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
            if (!user || !user.isActive) throw new UnauthorizedException();
            return this.buildTokenResponse(user);
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    /**
     * Enable 2FA — generates a secret and returns QR code
     */
    async enableTwoFactor(userId: string) {
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');

        const secret = authenticator.generateSecret();
        const appName = this.configService.get('TWO_FACTOR_APP_NAME', 'SecureForce');
        const otpAuthUrl = authenticator.keyuri(user.email, appName, secret);
        const qrCode = await QRCode.toDataURL(otpAuthUrl);

        await this.usersRepo.update(userId, { twoFactorSecret: secret });

        return { secret, qrCode, otpAuthUrl };
    }

    /**
     * Verify & activate 2FA with a code
     */
    async verifyTwoFactor(userId: string, code: string) {
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user || !user.twoFactorSecret) throw new BadRequestException('2FA not set up');

        const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
        if (!isValid) throw new BadRequestException('Invalid 2FA code');

        await this.usersRepo.update(userId, { isTwoFactorEnabled: true });
        await this.auditService.log(userId, '2FA_ENABLED', 'user', userId, {});

        return { message: '2FA enabled successfully' };
    }

    /**
     * Generate 8 backup codes for 2FA recovery
     * Returns plain codes once; stores hashed versions
     */
    async generateBackupCodes(userId: string) {
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');
        if (!user.isTwoFactorEnabled) {
            throw new BadRequestException('2FA must be enabled first');
        }

        // Generate 8 random backup codes
        const plainCodes: string[] = [];
        const hashedCodes: string[] = [];

        for (let i = 0; i < 8; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g., "A1B2C3D4"
            plainCodes.push(code);
            hashedCodes.push(await bcrypt.hash(code, 10));
        }

        await this.usersRepo.update(userId, { twoFactorBackupCodes: hashedCodes });
        await this.auditService.log(userId, 'BACKUP_CODES_GENERATED', 'user', userId, {});

        return {
            codes: plainCodes,
            message: 'Save these backup codes in a safe place. Each code can only be used once.',
        };
    }

    /**
     * Try to consume a backup code during login
     */
    private async consumeBackupCode(user: User, code: string): Promise<boolean> {
        if (!user.twoFactorBackupCodes || user.twoFactorBackupCodes.length === 0) {
            return false;
        }

        for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
            const match = await bcrypt.compare(code.toUpperCase(), user.twoFactorBackupCodes[i]);
            if (match) {
                // Remove the used code
                const updatedCodes = [...user.twoFactorBackupCodes];
                updatedCodes.splice(i, 1);
                await this.usersRepo.update(user.id, { twoFactorBackupCodes: updatedCodes });
                await this.auditService.log(user.id, 'BACKUP_CODE_USED', 'user', user.id, {});
                return true;
            }
        }

        return false;
    }

    /**
     * Build JWT access + refresh token pair
     */
    private buildTokenResponse(user: User) {
        const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };

        return {
            accessToken: this.jwtService.sign(payload),
            refreshToken: this.jwtService.sign(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
            }),
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isTwoFactorEnabled: user.isTwoFactorEnabled,
            },
        };
    }
}
