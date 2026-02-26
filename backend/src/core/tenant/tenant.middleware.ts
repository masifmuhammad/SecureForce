// ============================================================
// Tenant Middleware — Extracts tenantId from JWT and attaches
// to the request for downstream use by repositories/services
// ============================================================
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { REQUEST_TENANT_KEY } from '../../common/constants';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    use(req: Request, _res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.slice(7);
                const payload = this.jwtService.verify(token, {
                    secret: this.configService.get('JWT_SECRET'),
                });
                if (payload.tenantId) {
                    (req as any)[REQUEST_TENANT_KEY] = payload.tenantId;
                }
            }
        } catch {
            // Token invalid or missing — let auth guards handle it
        }
        next();
    }
}
