// ============================================================
// Auto-Seed Service — Seeds database on first boot
// Runs automatically via NestJS OnModuleInit lifecycle hook
// No shell access needed — perfect for Render free tier
// ============================================================
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { Location } from './entities/location.entity';

@Injectable()
export class SeedService implements OnModuleInit {
    private readonly logger = new Logger('SeedService');

    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Location) private locationRepo: Repository<Location>,
    ) { }

    async onModuleInit() {
        const userCount = await this.userRepo.count();
        if (userCount > 0) {
            this.logger.log('Database already seeded — skipping.');
            return;
        }

        this.logger.log('Empty database detected — auto-seeding...');

        // ── Admin User ──
        const hash = await bcrypt.hash('secureforce123', 10);
        const admin = this.userRepo.create({
            email: 'admin@secureforce.com.au',
            passwordHash: hash,
            firstName: 'System',
            lastName: 'Admin',
            role: UserRole.ADMIN,
            isActive: true,
        });
        await this.userRepo.save(admin);
        this.logger.log('✅ Admin user created (admin@secureforce.com.au / secureforce123)');

        // ── Sample Employees ──
        const employees = [
            { email: 'james.wilson@secureforce.com.au', firstName: 'James', lastName: 'Wilson', role: UserRole.EMPLOYEE },
            { email: 'sarah.chen@secureforce.com.au', firstName: 'Sarah', lastName: 'Chen', role: UserRole.MANAGER },
            { email: 'mike.torres@secureforce.com.au', firstName: 'Mike', lastName: 'Torres', role: UserRole.EMPLOYEE },
        ];

        for (const emp of employees) {
            const empHash = await bcrypt.hash('secureforce123', 10);
            const user = this.userRepo.create({ ...emp, passwordHash: empHash, isActive: true });
            await this.userRepo.save(user);
            this.logger.log(`  ✅ Employee: ${emp.firstName} ${emp.lastName}`);
        }

        // ── Sample Locations ──
        const locations = [
            {
                name: 'Westfield Sydney CBD', address: '188 Pitt Street, Sydney NSW 2000',
                suburb: 'Sydney', state: 'NSW', postcode: '2000',
                latitude: -33.8708, longitude: 151.2073, radiusMeters: 150,
                contactName: 'David Park', contactPhone: '+61 2 9000 1234',
            },
            {
                name: 'Melbourne Central Tower', address: '360 Elizabeth Street, Melbourne VIC 3000',
                suburb: 'Melbourne', state: 'VIC', postcode: '3000',
                latitude: -37.8106, longitude: 144.9630, radiusMeters: 100,
                contactName: 'Emma Li', contactPhone: '+61 3 9100 5678',
            },
            {
                name: 'Brisbane Airport Terminal', address: '11 The Circuit, Brisbane Airport QLD 4008',
                suburb: 'Brisbane Airport', state: 'QLD', postcode: '4008',
                latitude: -27.3842, longitude: 153.1175, radiusMeters: 200,
                contactName: 'Tom Hayes', contactPhone: '+61 7 3800 9012',
            },
            {
                name: 'Barangaroo Office Precinct', address: '1 Sussex Street, Barangaroo NSW 2000',
                suburb: 'Barangaroo', state: 'NSW', postcode: '2000',
                latitude: -33.8615, longitude: 151.2006, radiusMeters: 120,
                contactName: 'Priya Sharma', contactPhone: '+61 2 9200 3456',
            },
        ];

        for (const loc of locations) {
            const location = this.locationRepo.create({ ...loc, isActive: true });
            await this.locationRepo.save(location);
            this.logger.log(`  ✅ Location: ${loc.name}`);
        }

        this.logger.log('🎉 Auto-seed complete!');
    }
}
