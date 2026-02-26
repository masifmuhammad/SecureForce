// ============================================================
// CheckIns Service — GPS verification with anti-spoofing
// Validates check-ins against location geofences
// ============================================================
import {
    Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    CheckIn, CheckInType, VerificationStatus,
    Shift, ShiftStatus, Location,
} from '../entities';
import { AuditService } from '../audit/audit.service';

interface CreateCheckInDto {
    shiftId: string;
    type: CheckInType;
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    deviceFingerprint?: string;
    photoUrl?: string;
}

@Injectable()
export class CheckinsService {
    constructor(
        @InjectRepository(CheckIn) private checkinsRepo: Repository<CheckIn>,
        @InjectRepository(Shift) private shiftsRepo: Repository<Shift>,
        @InjectRepository(Location) private locationsRepo: Repository<Location>,
        private auditService: AuditService,
    ) { }

    /**
     * Create a check-in/check-out with GPS verification
     * Anti-spoofing: validates coordinates against the shift's location geofence
     */
    async create(userId: string, dto: CreateCheckInDto, ip?: string) {
        // 1. Validate the shift exists and belongs to the user
        const shift = await this.shiftsRepo.findOne({
            where: { id: dto.shiftId },
            relations: ['location'],
        });
        if (!shift) throw new NotFoundException('Shift not found');
        if (shift.userId !== userId) throw new BadRequestException('This shift is not assigned to you');

        // 2. Validate timing — can only check-in within 30 min of shift start
        const now = new Date();
        const shiftStart = new Date(shift.startTime);
        const earlyLimit = new Date(shiftStart.getTime() - 30 * 60 * 1000); // 30 min early
        if (dto.type === CheckInType.CHECK_IN && now < earlyLimit) {
            throw new BadRequestException('Too early to check in. You can check in 30 minutes before shift start.');
        }

        // 3. GPS distance validation — check if within geofence radius
        const location = shift.location;
        const distance = this.calculateDistance(
            dto.latitude, dto.longitude,
            Number(location.latitude), Number(location.longitude),
        );

        // 4. Determine verification status based on distance
        let verificationStatus = VerificationStatus.VERIFIED;
        let verificationNotes = `Distance from site: ${distance.toFixed(1)}m`;

        if (distance > location.radiusMeters * 2) {
            // Way too far — flag as suspicious
            verificationStatus = VerificationStatus.FLAGGED;
            verificationNotes = `FLAGGED: ${distance.toFixed(1)}m from site (limit: ${location.radiusMeters}m). Possible GPS spoofing.`;
        } else if (distance > location.radiusMeters) {
            // Slightly outside — pending review
            verificationStatus = VerificationStatus.PENDING;
            verificationNotes = `Outside geofence: ${distance.toFixed(1)}m from site (limit: ${location.radiusMeters}m)`;
        }

        // 5. GPS accuracy check — flag if accuracy is too poor
        if (dto.accuracyMeters && dto.accuracyMeters > 100) {
            verificationStatus = VerificationStatus.PENDING;
            verificationNotes += ` | Low GPS accuracy: ${dto.accuracyMeters}m`;
        }

        // 6. Save the check-in record
        const checkIn = this.checkinsRepo.create({
            shiftId: dto.shiftId,
            userId,
            type: dto.type,
            latitude: dto.latitude,
            longitude: dto.longitude,
            accuracyMeters: dto.accuracyMeters,
            verificationStatus,
            verificationNotes,
            distanceFromSite: distance,
            deviceFingerprint: dto.deviceFingerprint,
            ipAddress: ip,
            photoUrl: dto.photoUrl,
        });
        const saved = await this.checkinsRepo.save(checkIn);

        // 7. Update shift status
        if (dto.type === CheckInType.CHECK_IN) {
            await this.shiftsRepo.update(dto.shiftId, { status: ShiftStatus.IN_PROGRESS });
        } else {
            await this.shiftsRepo.update(dto.shiftId, { status: ShiftStatus.COMPLETED });
        }

        // 8. Audit log
        await this.auditService.log(userId, dto.type.toUpperCase(), 'checkin', saved.id, {
            shiftId: dto.shiftId,
            distance: distance.toFixed(1),
            status: verificationStatus,
        }, ip);

        return saved;
    }

    async findByShift(shiftId: string) {
        return this.checkinsRepo.find({
            where: { shiftId },
            order: { timestamp: 'ASC' },
        });
    }

    async findAll(page = 1, limit = 20) {
        const [items, total] = await this.checkinsRepo.findAndCount({
            relations: ['user', 'shift'],
            order: { timestamp: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, totalPages: Math.ceil(total / limit) };
    }

    async getFlagged(page = 1, limit = 20) {
        const [items, total] = await this.checkinsRepo.findAndCount({
            where: { verificationStatus: VerificationStatus.FLAGGED },
            relations: ['user', 'shift'],
            order: { timestamp: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, totalPages: Math.ceil(total / limit) };
    }

    async updateVerification(id: string, status: VerificationStatus, notes?: string) {
        await this.checkinsRepo.update(id, {
            verificationStatus: status,
            verificationNotes: notes,
        });
        return this.checkinsRepo.findOne({ where: { id } });
    }

    /**
     * Haversine formula — calculate distance between two GPS coordinates in meters
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371000; // Earth's radius in meters
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(deg: number): number {
        return (deg * Math.PI) / 180;
    }
}
