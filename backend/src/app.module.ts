// ============================================================
// Root Application Module
// Imports all feature modules + global config
// ============================================================
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ShiftsModule } from './shifts/shifts.module';
import { LocationsModule } from './locations/locations.module';
import { CheckinsModule } from './checkins/checkins.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TenantModule } from './core/tenant/tenant.module';
import { ComplianceModule } from './compliance/compliance.module';
import { IncidentsModule } from './incidents/incidents.module';
import { SessionModule } from './sessions/session.module';
import { EventModule } from './shared/events/event.module';
import { QueueModule } from './shared/queues/queue.module';
import { ClientsModule } from './clients/clients.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthController } from './health.controller';

@Module({
    imports: [
        // Environment config
        ConfigModule.forRoot({ isGlobal: true }),

        // PostgreSQL via TypeORM
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.get('DB_HOST', 'localhost'),
                port: config.get<number>('DB_PORT', 5432),
                username: config.get('DB_USERNAME', 'secureforce'),
                password: config.get('DB_PASSWORD', 'secureforce_pass'),
                database: config.get('DB_NAME', 'secureforce'),
                autoLoadEntities: true,
                synchronize: config.get('NODE_ENV') !== 'production', // Auto-sync in dev only
                logging: config.get('NODE_ENV') === 'development',
            }),
        }),

        // Rate limiting — 60 requests per minute per IP
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),

        // Infrastructure modules
        EventModule,
        QueueModule,

        // Core modules
        TenantModule,
        AuthModule,
        UsersModule,
        ShiftsModule,
        LocationsModule,
        CheckinsModule,
        ReportsModule,
        AuditModule,
        NotificationsModule,

        // Phase 2 — Enterprise modules
        ComplianceModule,
        IncidentsModule,
        SessionModule,

        // Phase 3 — User Management & Clients
        ClientsModule,

        // Phase 4 — Analytics
        AnalyticsModule,
    ],
    controllers: [HealthController],
    providers: [
        // Apply rate limiting globally
        { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
})
export class AppModule { }
