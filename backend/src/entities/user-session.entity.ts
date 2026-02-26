// ============================================================
// UserSession Entity — Tracks active user sessions/devices
// Enables session revocation and IP anomaly detection
// ============================================================
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_sessions')
export class UserSession {
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

    @Column({ nullable: true })
    deviceFingerprint: string;

    @Column({ nullable: true })
    ipAddress: string;

    @Column({ nullable: true })
    userAgent: string;

    @Column({ type: 'jsonb', nullable: true })
    geoLocation: Record<string, unknown>; // { country, city, lat, lng }

    @Column()
    refreshTokenHash: string;

    @Column({ default: false })
    isRevoked: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    lastActiveAt: Date;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}
