// ============================================================
// User Entity — Employees and Managers
// Supports role-based access and 2FA
// ============================================================
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
    ADMIN = 'admin',
    MANAGER = 'manager',
    EMPLOYEE = 'employee',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    tenantId: string;

    @Column({ length: 100 })
    firstName: string;

    @Column({ length: 100 })
    lastName: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Exclude()
    @Column()
    passwordHash: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.EMPLOYEE })
    role: UserRole;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true, length: 200 })
    securityLicenseNumber: string; // Australian security license

    @Column({ nullable: true })
    @Exclude()
    twoFactorSecret: string;

    @Column({ default: false })
    isTwoFactorEnabled: boolean;

    @Exclude()
    @Column({ type: 'jsonb', default: [] })
    twoFactorBackupCodes: string[]; // Hashed backup codes

    @Column({ nullable: true })
    avatarUrl: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Computed property
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }
}
