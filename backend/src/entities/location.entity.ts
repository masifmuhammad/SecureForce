// ============================================================
// Location Entity — Security Sites/Premises
// Includes GPS coordinates and geofence radius
// ============================================================
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, Index,
} from 'typeorm';

@Entity('locations')
export class Location {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    tenantId: string;

    @Column({ length: 200 })
    name: string;

    @Column({ type: 'text' })
    address: string;

    @Column({ nullable: true })
    suburb: string;

    @Column({ nullable: true })
    state: string; // NSW, VIC, QLD, etc.

    @Column({ nullable: true })
    postcode: string;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    longitude: number;

    @Column({ type: 'int', default: 100 })
    radiusMeters: number; // Geofence radius for check-in validation

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true, type: 'text' })
    notes: string;

    @Column({ nullable: true })
    contactName: string;

    @Column({ nullable: true })
    contactPhone: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
