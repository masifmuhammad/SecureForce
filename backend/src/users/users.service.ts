// ============================================================
// Users Service — CRUD operations for employees
// Enhanced with tenant isolation, invite flow, role management
// ============================================================
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserRole } from '../entities';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private usersRepo: Repository<User>,
    ) { }

    async findAll(tenantId: string, page = 1, limit = 20) {
        const where: any = {};
        if (tenantId) where.tenantId = tenantId;

        const [items, total] = await this.usersRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, totalPages: Math.ceil(total / limit) };
    }

    async findByTenant(tenantId: string) {
        return this.usersRepo.find({
            where: { tenantId },
            order: { firstName: 'ASC' },
        });
    }

    async findOne(id: string, tenantId?: string) {
        const where: any = { id };
        if (tenantId) where.tenantId = tenantId;
        const user = await this.usersRepo.findOne({ where });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async update(id: string, data: Partial<User>, tenantId?: string) {
        // Ensure user belongs to tenant
        await this.findOne(id, tenantId);
        // Don't allow updating sensitive fields through generic update
        const { passwordHash, twoFactorSecret, twoFactorBackupCodes, role, ...safeData } = data as any;
        await this.usersRepo.update(id, safeData);
        return this.findOne(id, tenantId);
    }

    async updateRole(id: string, role: UserRole, tenantId: string) {
        const user = await this.findOne(id, tenantId);
        if (!Object.values(UserRole).includes(role)) {
            throw new BadRequestException('Invalid role');
        }
        await this.usersRepo.update(id, { role });
        return this.findOne(id, tenantId);
    }

    async inviteUser(data: {
        email: string;
        firstName: string;
        lastName: string;
        role?: UserRole;
        phone?: string;
        securityLicenseNumber?: string;
    }, tenantId: string) {
        // Check for existing user with same email
        const exists = await this.usersRepo.findOne({ where: { email: data.email } });
        if (exists) throw new ConflictException('A user with this email already exists');

        // Generate a temporary password
        const tempPassword = crypto.randomBytes(12).toString('base64url');
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        const user = this.usersRepo.create({
            ...data,
            tenantId,
            passwordHash,
            role: data.role || UserRole.EMPLOYEE,
            isActive: true,
        });

        const saved = await this.usersRepo.save(user);

        return {
            user: saved,
            temporaryPassword: tempPassword,
            message: 'User invited successfully. Share the temporary password with them.',
        };
    }

    async deactivate(id: string, tenantId?: string) {
        await this.findOne(id, tenantId);
        await this.usersRepo.update(id, { isActive: false });
        return { message: 'User deactivated' };
    }

    async reactivate(id: string, tenantId?: string) {
        const user = await this.findOne(id, tenantId);
        if (user.isActive) {
            throw new BadRequestException('User is already active');
        }
        await this.usersRepo.update(id, { isActive: true });
        return { message: 'User reactivated' };
    }

    async getStats(tenantId?: string) {
        const where: any = {};
        if (tenantId) where.tenantId = tenantId;

        const total = await this.usersRepo.count({ where });
        const active = await this.usersRepo.count({ where: { ...where, isActive: true } });
        return { total, active, inactive: total - active };
    }

    async countByTenant(tenantId: string): Promise<number> {
        return this.usersRepo.count({ where: { tenantId } });
    }
}
