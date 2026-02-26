// Audit Service — Creates audit log entries
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities';

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
    ) { }

    async log(
        userId: string | null,
        action: string,
        entity: string,
        entityId?: string,
        details?: Record<string, unknown>,
        ip?: string,
        userAgent?: string,
    ): Promise<AuditLog> {
        const entry = this.auditRepo.create({
            userId: userId || undefined,
            action,
            entity,
            entityId,
            details,
            ipAddress: ip,
            userAgent,
        });
        return this.auditRepo.save(entry);
    }

    async findAll(page = 1, limit = 50) {
        const [items, total] = await this.auditRepo.findAndCount({
            relations: ['user'],
            order: { timestamp: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, totalPages: Math.ceil(total / limit) };
    }

    async findByUser(userId: string, page = 1, limit = 50) {
        const [items, total] = await this.auditRepo.findAndCount({
            where: { userId },
            order: { timestamp: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, totalPages: Math.ceil(total / limit) };
    }
}
