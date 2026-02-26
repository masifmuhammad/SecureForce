// ============================================================
// Notification Entity — Persisted in-app notifications
// ============================================================
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

export enum NotificationType {
    INCIDENT = 'incident',
    COMPLIANCE = 'compliance',
    SHIFT = 'shift',
    SYSTEM = 'system',
    ALERT = 'alert',
}

@Entity('notifications')
@Index(['tenantId', 'userId', 'isRead'])
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid' })
    tenantId: string;

    @Column({ type: 'uuid' })
    userId: string;

    @Column({ type: 'enum', enum: NotificationType, default: NotificationType.SYSTEM })
    type: NotificationType;

    @Column()
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, unknown>;

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
