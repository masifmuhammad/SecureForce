// ============================================================
// Base Entity — Common columns for all tenant-scoped entities
// Provides id, tenantId, createdAt, updatedAt
// ============================================================
import {
    PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, Index,
} from 'typeorm';

export abstract class BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    tenantId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
