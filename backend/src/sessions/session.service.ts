// ============================================================
// Session Service — Tracks user sessions and devices
// Integrates with auth flow for session creation/revocation
// ============================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { UserSession } from '../entities/user-session.entity';

@Injectable()
export class SessionService {
    constructor(
        @InjectRepository(UserSession) private sessionsRepo: Repository<UserSession>,
    ) { }

    /**
     * Create a new session on login
     */
    async createSession(data: {
        userId: string;
        tenantId: string;
        refreshToken: string;
        ipAddress?: string;
        userAgent?: string;
        deviceFingerprint?: string;
    }): Promise<UserSession> {
        const session = this.sessionsRepo.create({
            userId: data.userId,
            tenantId: data.tenantId,
            refreshTokenHash: this.hashToken(data.refreshToken),
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            deviceFingerprint: data.deviceFingerprint,
            lastActiveAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        return this.sessionsRepo.save(session);
    }

    /**
     * Get all active sessions for a user
     */
    async getUserSessions(tenantId: string, userId: string): Promise<UserSession[]> {
        return this.sessionsRepo.find({
            where: { tenantId, userId, isRevoked: false },
            order: { lastActiveAt: 'DESC' },
        });
    }

    /**
     * Revoke a specific session (e.g., user logs out from a device)
     */
    async revokeSession(tenantId: string, sessionId: string): Promise<void> {
        await this.sessionsRepo.update({ id: sessionId, tenantId }, { isRevoked: true });
    }

    /**
     * Revoke all sessions for a user (e.g., password change)
     */
    async revokeAllSessions(tenantId: string, userId: string): Promise<void> {
        await this.sessionsRepo.update({ userId, tenantId }, { isRevoked: true });
    }

    /**
     * Validate a refresh token against stored session
     */
    async validateRefreshToken(userId: string, refreshToken: string): Promise<UserSession | null> {
        const hash = this.hashToken(refreshToken);
        const session = await this.sessionsRepo.findOne({
            where: { userId, refreshTokenHash: hash, isRevoked: false },
        });

        if (!session || session.expiresAt < new Date()) {
            return null;
        }

        // Update last active
        session.lastActiveAt = new Date();
        await this.sessionsRepo.save(session);
        return session;
    }

    /**
     * Rotate refresh token (invalidate old, issue new)
     */
    async rotateRefreshToken(sessionId: string, newRefreshToken: string): Promise<void> {
        await this.sessionsRepo.update(sessionId, {
            refreshTokenHash: this.hashToken(newRefreshToken),
            lastActiveAt: new Date(),
        });
    }

    /**
     * Cleanup expired sessions
     */
    async cleanupExpired(): Promise<number> {
        const result = await this.sessionsRepo
            .createQueryBuilder()
            .delete()
            .where('expiresAt < :now', { now: new Date() })
            .orWhere('isRevoked = true AND lastActiveAt < :cutoff', {
                cutoff: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            })
            .execute();
        return result.affected || 0;
    }

    private hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
}
