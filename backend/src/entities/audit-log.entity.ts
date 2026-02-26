// ============================================================
// AuditLog Entity — System-wide audit trail
// Tracks all CRUD operations for security compliance
// ============================================================
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    tenantId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ nullable: true })
    userId: string;

    @Column({ length: 50 })
    action: string; // CREATE, UPDATE, DELETE, LOGIN, CHECKIN, etc.

    @Column({ length: 100 })
    entity: string; // user, shift, location, checkin, etc.

    @Column({ nullable: true })
    entityId: string;

    @Column({ type: 'jsonb', nullable: true })
    details: Record<string, unknown>; // Changed fields, old/new values

    @Column({ nullable: true })
    ipAddress: string;

    @Column({ nullable: true })
    userAgent: string;

    @CreateDateColumn()
    timestamp: Date;
}
