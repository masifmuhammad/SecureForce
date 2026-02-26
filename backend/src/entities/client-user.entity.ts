// ============================================================
// ClientUser Entity — Login credentials for client portal
// Scoped to a ClientOrganization for data isolation
// ============================================================
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ClientOrganization } from './client-organization.entity';

export enum ClientUserRole {
    VIEWER = 'viewer',
    ADMIN = 'admin',
}

@Entity('client_users')
export class ClientUser {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    tenantId: string;

    @ManyToOne(() => ClientOrganization)
    @JoinColumn({ name: 'clientOrgId' })
    clientOrg: ClientOrganization;

    @Column()
    clientOrgId: string;

    @Column({ unique: true })
    email: string;

    @Exclude()
    @Column()
    passwordHash: string;

    @Column({ length: 100 })
    firstName: string;

    @Column({ length: 100 })
    lastName: string;

    @Column({ type: 'enum', enum: ClientUserRole, default: ClientUserRole.VIEWER })
    role: ClientUserRole;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    lastLoginAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
