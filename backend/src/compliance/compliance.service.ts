// ============================================================
// Compliance Service — CRUD for licenses and violations
// ============================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GuardLicense } from '../entities/guard-license.entity';
import { ComplianceViolation } from '../entities/compliance-violation.entity';
import { ComplianceRulesEngine } from './compliance-rules.engine';
import { EVENTS, ComplianceViolationDetectedEvent } from '../shared/events/domain-events';

@Injectable()
export class ComplianceService {
    constructor(
        @InjectRepository(GuardLicense) private licensesRepo: Repository<GuardLicense>,
        @InjectRepository(ComplianceViolation) private violationsRepo: Repository<ComplianceViolation>,
        private rulesEngine: ComplianceRulesEngine,
        private eventEmitter: EventEmitter2,
    ) { }

    // — License CRUD —

    async createLicense(tenantId: string, data: Partial<GuardLicense>): Promise<GuardLicense> {
        const license = this.licensesRepo.create({ ...data, tenantId });
        return this.licensesRepo.save(license);
    }

    async getLicensesByUser(tenantId: string, userId: string): Promise<GuardLicense[]> {
        return this.licensesRepo.find({ where: { tenantId, userId }, order: { expiryDate: 'DESC' } });
    }

    async getLicenseById(tenantId: string, id: string): Promise<GuardLicense> {
        const license = await this.licensesRepo.findOne({ where: { tenantId, id } });
        if (!license) throw new NotFoundException('License not found');
        return license;
    }

    async updateLicense(tenantId: string, id: string, data: Partial<GuardLicense>): Promise<GuardLicense> {
        await this.licensesRepo.update({ id, tenantId }, data as any);
        return this.getLicenseById(tenantId, id);
    }

    async deleteLicense(tenantId: string, id: string): Promise<void> {
        await this.licensesRepo.delete({ id, tenantId });
    }

    async getAllLicenses(tenantId: string): Promise<GuardLicense[]> {
        return this.licensesRepo.find({
            where: { tenantId },
            relations: ['user'],
            order: { expiryDate: 'ASC' },
        });
    }

    // — Violations —

    async getViolations(tenantId: string, opts?: { resolved?: boolean; userId?: string }): Promise<ComplianceViolation[]> {
        const where: any = { tenantId };
        if (opts?.resolved !== undefined) where.isResolved = opts.resolved;
        if (opts?.userId) where.userId = opts.userId;

        return this.violationsRepo.find({
            where,
            relations: ['user'],
            order: { createdAt: 'DESC' },
            take: 100,
        });
    }

    async resolveViolation(tenantId: string, id: string, resolvedBy: string, notes?: string): Promise<ComplianceViolation> {
        const violation = await this.violationsRepo.findOne({ where: { id, tenantId } });
        if (!violation) throw new NotFoundException('Violation not found');

        violation.isResolved = true;
        violation.resolvedAt = new Date();
        violation.resolvedBy = resolvedBy;
        violation.resolutionNotes = notes || '';
        return this.violationsRepo.save(violation);
    }

    // — Full Compliance Scan —

    async runComplianceScan(tenantId: string): Promise<{ violations: number; results: ComplianceViolation[] }> {
        const checkResults = await this.rulesEngine.runAllChecks(tenantId);
        const saved = await this.rulesEngine.saveViolations(tenantId, checkResults);

        // Emit events for each violation
        for (const violation of saved) {
            this.eventEmitter.emit(
                EVENTS.VIOLATION_DETECTED,
                new ComplianceViolationDetectedEvent(
                    tenantId, violation.id, violation.userId, violation.type, violation.severity,
                ),
            );
        }

        return { violations: saved.length, results: saved };
    }

    // — Dashboard stats —

    async getComplianceStats(tenantId: string): Promise<Record<string, number>> {
        const [active, critical, expiring] = await Promise.all([
            this.violationsRepo.count({ where: { tenantId, isResolved: false } }),
            this.violationsRepo.count({ where: { tenantId, isResolved: false, severity: 'critical' as any } }),
            this.licensesRepo
                .createQueryBuilder('l')
                .where('l.tenantId = :tenantId', { tenantId })
                .andWhere("l.verificationStatus = 'verified'")
                .andWhere('l.expiryDate <= :date', { date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
                .getCount(),
        ]);

        return { activeViolations: active, criticalViolations: critical, licensesExpiringSoon: expiring };
    }
}
