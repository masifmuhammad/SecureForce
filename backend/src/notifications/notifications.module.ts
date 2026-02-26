// ============================================================
// Notifications Module — In-app notifications with persistence
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationProcessor } from './notification.processor';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification, User]),
    ],
    controllers: [NotificationsController],
    providers: [NotificationsGateway, NotificationsService, NotificationProcessor],
    exports: [NotificationsGateway, NotificationsService],
})
export class NotificationsModule { }
