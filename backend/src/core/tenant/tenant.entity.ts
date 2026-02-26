// ============================================================
// Tenant Entity — Represents a security company on the platform
// Each company is a tenant with isolated data
// ============================================================
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { TenantPlan } from '../../common/constants';

@Entity('tenants')
export class Tenant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 200 })
    name: string; // Company name

    @Column({ unique: true, length: 100 })
    slug: string; // URL-safe identifier (e.g., "acme-security")

    @Column({ nullable: true })
    domain: string; // Custom domain (e.g., "acme.secureforce.com.au")

    @Column({ nullable: true })
    abn: string; // Australian Business Number

    @Column({ type: 'enum', enum: TenantPlan, default: TenantPlan.STARTER })
    plan: TenantPlan;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'int', default: 50 })
    maxUsers: number; // Plan-based user limit

    @Column({ type: 'jsonb', default: {} })
    settings: Record<string, unknown>;
    // e.g., { timezone: 'Australia/Sydney', currency: 'AUD', ... }

    @Column({ nullable: true })
    logoUrl: string;

    @Column({ nullable: true })
    primaryContactName: string;

    @Column({ nullable: true })
    primaryContactEmail: string;

    @Column({ nullable: true })
    primaryContactPhone: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
