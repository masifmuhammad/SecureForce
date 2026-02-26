// ============================================================
// GuardLicense Entity — Australian security license tracking
// Tracks license type, state, expiry with auto-alert support
// ============================================================
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { AustralianState, SecurityLicenseClass } from '../common/constants';

export enum LicenseVerificationStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    EXPIRED = 'expired',
    SUSPENDED = 'suspended',
    REJECTED = 'rejected',
}

@Entity('guard_licenses')
export class GuardLicense {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    tenantId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column({ type: 'enum', enum: SecurityLicenseClass })
    licenseClass: SecurityLicenseClass;

    @Column({ length: 100 })
    licenseNumber: string;

    @Column({ type: 'enum', enum: AustralianState })
    issuingState: AustralianState;

    @Column({ type: 'date' })
    issueDate: Date;

    @Column({ type: 'date' })
    expiryDate: Date;

    @Column({
        type: 'enum',
        enum: LicenseVerificationStatus,
        default: LicenseVerificationStatus.PENDING,
    })
    verificationStatus: LicenseVerificationStatus;

    @Column({ nullable: true })
    documentUrl: string; // Scanned copy of the license

    @Column({ nullable: true, type: 'text' })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
