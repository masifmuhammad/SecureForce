// ============================================================
// Notifications Service — CRUD + unread count
// ============================================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notifRepo: Repository<Notification>,
    ) { }

    /** Create a notification */
    async create(data: {
        tenantId: string;
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        metadata?: Record<string, unknown>;
    }) {
        const notif = this.notifRepo.create(data);
        return this.notifRepo.save(notif);
    }

    /** Get notifications for a user (paginated) */
    async findByUser(tenantId: string, userId: string, page = 1, limit = 20) {
        const [items, total] = await this.notifRepo.findAndCount({
            where: { tenantId, userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, totalPages: Math.ceil(total / limit) };
    }

    /** Get unread count */
    async getUnreadCount(tenantId: string, userId: string) {
        const count = await this.notifRepo.count({
            where: { tenantId, userId, isRead: false },
        });
        return { unread: count };
    }

    /** Mark one as read */
    async markAsRead(tenantId: string, id: string) {
        await this.notifRepo.update({ id, tenantId }, { isRead: true });
        return { success: true };
    }

    /** Mark all as read */
    async markAllAsRead(tenantId: string, userId: string) {
        await this.notifRepo.update(
            { tenantId, userId, isRead: false },
            { isRead: true },
        );
        return { success: true };
    }
}
