import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { Location } from './entities/location.entity';
import { Shift } from './entities/shift.entity';
import { CheckIn } from './entities/checkin.entity';
import { Report } from './entities/report.entity';
import { AuditLog } from './entities/audit-log.entity';

async function seed() {
    const ds = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'secureforce',
        password: process.env.DB_PASSWORD || 'secureforce_pass',
        database: process.env.DB_NAME || 'secureforce',
        entities: [User, Location, Shift, CheckIn, Report, AuditLog],
        synchronize: false,
    });

    await ds.initialize();
    console.log('Connected to database for seeding...');

    const userRepo = ds.getRepository(User);
    const locationRepo = ds.getRepository(Location);

    // ── Seed Admin User ──
    const existingAdmin = await userRepo.findOne({ where: { email: 'admin@secureforce.com.au' } });
    if (!existingAdmin) {
        const hash = await bcrypt.hash('secureforce123', 10);
        const admin = userRepo.create({
            email: 'admin@secureforce.com.au',
            passwordHash: hash,
            firstName: 'System',
            lastName: 'Admin',
            role: UserRole.ADMIN,
            isActive: true,
        });
        await userRepo.save(admin);
        console.log('Admin user created.');
    } else {
        console.log('Admin user already exists.');
    }

    // ── Seed Sample Employees ──
    const employees = [
        { email: 'james.wilson@secureforce.com.au', firstName: 'James', lastName: 'Wilson', role: UserRole.EMPLOYEE },
        { email: 'sarah.chen@secureforce.com.au', firstName: 'Sarah', lastName: 'Chen', role: UserRole.MANAGER },
        { email: 'mike.torres@secureforce.com.au', firstName: 'Mike', lastName: 'Torres', role: UserRole.EMPLOYEE },
    ];

    for (const emp of employees) {
        const exists = await userRepo.findOne({ where: { email: emp.email } });
        if (!exists) {
            const hash = await bcrypt.hash('secureforce123', 10);
            const user = userRepo.create({ ...emp, passwordHash: hash, isActive: true });
            await userRepo.save(user);
            console.log(`  Employee created: ${emp.firstName} ${emp.lastName}`);
        }
    }

    // ── Seed Locations ──
    const locations = [
        {
            name: 'Westfield Sydney CBD',
            address: '188 Pitt Street, Sydney NSW 2000',
            suburb: 'Sydney',
            state: 'NSW',
            postcode: '2000',
            latitude: -33.8708,
            longitude: 151.2073,
            radiusMeters: 150,
            contactName: 'David Park',
            contactPhone: '+61 2 9000 1234',
        },
        {
            name: 'Melbourne Central Tower',
            address: '360 Elizabeth Street, Melbourne VIC 3000',
            suburb: 'Melbourne',
            state: 'VIC',
            postcode: '3000',
            latitude: -37.8106,
            longitude: 144.9630,
            radiusMeters: 100,
            contactName: 'Emma Li',
            contactPhone: '+61 3 9100 5678',
        },
        {
            name: 'Brisbane Airport Terminal',
            address: '11 The Circuit, Brisbane Airport QLD 4008',
            suburb: 'Brisbane Airport',
            state: 'QLD',
            postcode: '4008',
            latitude: -27.3842,
            longitude: 153.1175,
            radiusMeters: 200,
            contactName: 'Tom Hayes',
            contactPhone: '+61 7 3800 9012',
        },
        {
            name: 'Barangaroo Office Precinct',
            address: '1 Sussex Street, Barangaroo NSW 2000',
            suburb: 'Barangaroo',
            state: 'NSW',
            postcode: '2000',
            latitude: -33.8615,
            longitude: 151.2006,
            radiusMeters: 120,
            contactName: 'Priya Sharma',
            contactPhone: '+61 2 9200 3456',
        },
    ];

    for (const loc of locations) {
        const exists = await locationRepo.findOne({ where: { name: loc.name } });
        if (!exists) {
            const location = locationRepo.create({ ...loc, isActive: true });
            await locationRepo.save(location);
            console.log(`  Location created: ${loc.name}`);
        }
    }

    console.log('\nSeeding complete.');
    await ds.destroy();
    process.exit(0);
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
