// ============================================================
// Tenant Service — CRUD + lookup for tenant management
// ============================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantService {
    constructor(
        @InjectRepository(Tenant) private tenantsRepo: Repository<Tenant>,
    ) { }

    async findById(id: string): Promise<Tenant> {
        const tenant = await this.tenantsRepo.findOne({ where: { id } });
        if (!tenant) throw new NotFoundException('Tenant not found');
        return tenant;
    }

    async findBySlug(slug: string): Promise<Tenant> {
        const tenant = await this.tenantsRepo.findOne({ where: { slug } });
        if (!tenant) throw new NotFoundException('Tenant not found');
        return tenant;
    }

    async findAll(): Promise<Tenant[]> {
        return this.tenantsRepo.find({ order: { name: 'ASC' } });
    }

    async create(data: Partial<Tenant>): Promise<Tenant> {
        const tenant = this.tenantsRepo.create(data);
        return this.tenantsRepo.save(tenant);
    }

    async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
        await this.tenantsRepo.update(id, data as any);
        return this.findById(id);
    }

    /** Check if tenant has reached its user limit */
    async checkUserLimit(tenantId: string, currentUserCount: number): Promise<boolean> {
        const tenant = await this.findById(tenantId);
        return currentUserCount < tenant.maxUsers;
    }
}
