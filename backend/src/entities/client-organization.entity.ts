// ============================================================
// ClientOrganization Entity — External client companies
// Clients log into a separate portal to view their sites
// ============================================================
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, Index,
} from 'typeorm';

@Entity('client_organizations')
export class ClientOrganization {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    tenantId: string;

    @Column({ length: 200 })
    name: string;

    @Column({ nullable: true })
    abn: string; // Australian Business Number

    @Column({ nullable: true })
    industry: string;

    @Column({ nullable: true })
    primaryContactName: string;

    @Column({ nullable: true })
    primaryContactEmail: string;

    @Column({ nullable: true })
    primaryContactPhone: string;

    @Column({ type: 'date', nullable: true })
    contractStartDate: Date;

    @Column({ type: 'date', nullable: true })
    contractEndDate: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    billingRate: number; // Hourly rate for billing

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    logoUrl: string;

    @Column({ type: 'jsonb', default: {} })
    settings: Record<string, unknown>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
