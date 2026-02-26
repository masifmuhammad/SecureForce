// ============================================================
// SecureForce Backend — Application Bootstrap
// NestJS entry point with Swagger, CORS, validation & Helmet
// ============================================================
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global prefix for all routes
    app.setGlobalPrefix('api');

    // API Versioning — URI-based (/api/v1/...)
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    // Security headers
    app.use(helmet());

    // CORS — allow frontend origin(s)
    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
        .split(',')
        .map((o) => o.trim());
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });

    // Global validation pipe — auto-validate DTOs
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    // Swagger API Documentation
    const swaggerConfig = new DocumentBuilder()
        .setTitle('SecureForce API')
        .setDescription('Enterprise Security Workforce Management Platform API')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('auth', 'Authentication & 2FA')
        .addTag('users', 'Employee management')
        .addTag('shifts', 'Shift scheduling')
        .addTag('locations', 'Site management')
        .addTag('checkins', 'GPS check-in/check-out')
        .addTag('reports', 'Reporting & analytics')
        .addTag('audit', 'Audit logs')
        .addTag('incidents', 'Incident management & SLA')
        .addTag('compliance', 'License & compliance tracking')
        .addTag('client-portal', 'Client portal access')
        .addTag('analytics', 'Business intelligence')
        .addTag('command-center', 'Real-time operations')
        .addTag('tenants', 'Multi-tenant management')
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 SecureForce API running on http://localhost:${port}`);
    console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
