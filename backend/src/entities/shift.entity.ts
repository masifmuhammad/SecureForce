// ============================================================
// Shift Entity — Scheduled security shifts
// Links employees to locations with time slots
// ============================================================
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, ManyToOne, JoinColumn, Index, VersionColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Location } from './location.entity';

export enum ShiftStatus {
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    NO_SHOW = 'no_show',
}

@Entity('shifts')
export class Shift {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    tenantId: string;

    @ManyToOne(() => User, { eager: true, nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ nullable: true })
    userId: string;

    @Column({ default: true })
    isOpen: boolean;

    @ManyToOne(() => Location, { eager: true })
    @JoinColumn({ name: 'locationId' })
    location: Location;

    @Column()
    locationId: string;

    @Column({ type: 'timestamptz' })
    startTime: Date;

    @Column({ type: 'timestamptz' })
    endTime: Date;

    @Column({ type: 'enum', enum: ShiftStatus, default: ShiftStatus.SCHEDULED })
    status: ShiftStatus;

    @Column({ nullable: true, type: 'text' })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @VersionColumn()
    version: number;

    @Column({ type: 'timestamptz', nullable: true })
    acceptedAt: Date;
}
