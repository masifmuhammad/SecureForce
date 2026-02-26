// ============================================================
// CheckIn Entity — GPS-verified check-in/check-out records
// Stores coordinates, verification status, and anti-spoof data
// ============================================================
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Shift } from './shift.entity';

export enum CheckInType {
    CHECK_IN = 'check_in',
    CHECK_OUT = 'check_out',
}

export enum VerificationStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    FLAGGED = 'flagged',
    REJECTED = 'rejected',
}

@Entity('checkins')
export class CheckIn {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    tenantId: string;

    @ManyToOne(() => Shift)
    @JoinColumn({ name: 'shiftId' })
    shift: Shift;

    @Column()
    shiftId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column({ type: 'enum', enum: CheckInType })
    type: CheckInType;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    longitude: number;

    @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
    accuracyMeters: number; // GPS accuracy from device

    @Column({
        type: 'enum',
        enum: VerificationStatus,
        default: VerificationStatus.PENDING,
    })
    verificationStatus: VerificationStatus;

    @Column({ nullable: true, type: 'text' })
    verificationNotes: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    distanceFromSite: number; // Calculated distance in meters

    @Column({ nullable: true })
    deviceFingerprint: string; // Anti-spoofing: device ID

    @Column({ nullable: true })
    ipAddress: string;

    @Column({ nullable: true })
    photoUrl: string; // Optional check-in photo

    @CreateDateColumn()
    timestamp: Date;
}
