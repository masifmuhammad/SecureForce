// ============================================================
// Clients Service — CRUD for client organizations
// Tenant-isolated operations
// ============================================================
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientOrganization } from '../entities';

@Injectable()
export class ClientsService {
    constructor(
        @InjectRepository(ClientOrganization) private clientsRepo: Repository<ClientOrganization>,
    ) { }

    async findAll(tenantId: string, page = 1, limit = 20) {
        const [items, total] = await this.clientsRepo.findAndCount({
            where: { tenantId },
            order: { name: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, totalPages: Math.ceil(total / limit) };
    }

    async findOne(id: string, tenantId: string) {
        const client = await this.clientsRepo.findOne({ where: { id, tenantId } });
        if (!client) throw new NotFoundException('Client organization not found');
        return client;
    }

    async create(data: Partial<ClientOrganization>, tenantId: string) {
        const client = this.clientsRepo.create({
            ...data,
            tenantId,
        });
        return this.clientsRepo.save(client);
    }

    async update(id: string, data: Partial<ClientOrganization>, tenantId: string) {
        await this.findOne(id, tenantId);
        const { id: _id, tenantId: _tid, createdAt, updatedAt, ...safeData } = data as any;
        await this.clientsRepo.update(id, safeData);
        return this.findOne(id, tenantId);
    }

    async deactivate(id: string, tenantId: string) {
        await this.findOne(id, tenantId);
        await this.clientsRepo.update(id, { isActive: false });
        return { message: 'Client organization deactivated' };
    }

    async getStats(tenantId: string) {
        const total = await this.clientsRepo.count({ where: { tenantId } });
        const active = await this.clientsRepo.count({ where: { tenantId, isActive: true } });
        return { total, active, inactive: total - active };
    }
}
