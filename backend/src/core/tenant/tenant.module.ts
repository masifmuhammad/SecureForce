// ============================================================
// Tenant Module — Multi-tenancy infrastructure
// Provides TenantService, TenantController, TenantMiddleware
// ============================================================
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Tenant } from './tenant.entity';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { TenantMiddleware } from './tenant.middleware';
import { User } from '../../entities';

@Module({
    imports: [
        TypeOrmModule.forFeature([Tenant, User]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get('JWT_SECRET'),
            }),
        }),
    ],
    controllers: [TenantController],
    providers: [TenantService],
    exports: [TenantService],
})
export class TenantModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(TenantMiddleware)
            .forRoutes('*'); // Apply to all routes
    }
}
