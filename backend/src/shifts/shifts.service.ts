import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, IsNull } from 'typeorm';
import { Shift, ShiftStatus, User } from '../entities';

@Injectable()
export class ShiftsService {
    constructor(
        @InjectRepository(Shift) private shiftsRepo: Repository<Shift>,
        @InjectRepository(User) private usersRepo: Repository<User>,
    ) { }

    async create(data: Partial<Shift>) {
        // If userId is empty string or missing, treat as open shift
        if (!data.userId || data.userId === '') {
            data.userId = null as any;
        }
        const isOpen = !data.userId;
        const shift = this.shiftsRepo.create({ ...data, isOpen });
        return this.shiftsRepo.save(shift);
    }

    async findAll(page = 1, limit = 20, filters?: { userId?: string; locationId?: string; status?: ShiftStatus }) {
        const where: any = {};
        if (filters?.userId) where.userId = filters.userId;
        if (filters?.locationId) where.locationId = filters.locationId;
        if (filters?.status) where.status = filters.status;

        const [items, total] = await this.shiftsRepo.findAndCount({
            where,
            relations: ['user', 'location'],
            order: { startTime: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, totalPages: Math.ceil(total / limit) };
    }

    async findByDateRange(start: Date, end: Date) {
        return this.shiftsRepo.find({
            where: { startTime: Between(start, end) },
            relations: ['user', 'location'],
            order: { startTime: 'ASC' },
        });
    }

    async findUpcomingForUser(userId: string) {
        return this.shiftsRepo.find({
            where: {
                userId,
                startTime: MoreThanOrEqual(new Date()),
                status: ShiftStatus.SCHEDULED,
            },
            relations: ['location'],
            order: { startTime: 'ASC' },
            take: 10,
        });
    }

    /** Get all open shifts that haven't started yet */
    async findOpenShifts() {
        return this.shiftsRepo.find({
            where: {
                isOpen: true,
                status: ShiftStatus.SCHEDULED,
                startTime: MoreThanOrEqual(new Date()),
            },
            relations: ['location'],
            order: { startTime: 'ASC' },
        });
    }

    /** Guard accepts an open shift */
    async acceptShift(shiftId: string, userId: string) {
        const shift = await this.shiftsRepo.findOne({ where: { id: shiftId } });
        if (!shift) throw new NotFoundException('Shift not found');
        if (!shift.isOpen) throw new BadRequestException('This shift has already been taken');

        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        shift.userId = userId;
        shift.isOpen = false;
        return this.shiftsRepo.save(shift);
    }

    /** Guard declines — currently a no-op, returns success */
    async declineShift(shiftId: string, _userId: string) {
        const shift = await this.shiftsRepo.findOne({ where: { id: shiftId } });
        if (!shift) throw new NotFoundException('Shift not found');
        return { message: 'Shift declined' };
    }

    /** Get assigned shifts for the assignments tracking page */
    async findAssignments(page = 1, limit = 20, filters?: { status?: ShiftStatus; showOpen?: boolean }) {
        const qb = this.shiftsRepo.createQueryBuilder('shift')
            .leftJoinAndSelect('shift.user', 'user')
            .leftJoinAndSelect('shift.location', 'location')
            .orderBy('shift.startTime', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (filters?.status) {
            qb.andWhere('shift.status = :status', { status: filters.status });
        }

        if (filters?.showOpen) {
            qb.andWhere('shift.isOpen = :isOpen', { isOpen: true });
        } else {
            qb.andWhere('shift.isOpen = :isOpen', { isOpen: false });
        }

        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, totalPages: Math.ceil(total / limit) };
    }

    /** Admin/manager assigns a guard to an open shift */
    async assignShift(shiftId: string, userId: string) {
        const shift = await this.shiftsRepo.findOne({ where: { id: shiftId } });
        if (!shift) throw new NotFoundException('Shift not found');

        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        shift.userId = userId;
        shift.isOpen = false;
        return this.shiftsRepo.save(shift);
    }

    async findOne(id: string) {
        const shift = await this.shiftsRepo.findOne({
            where: { id },
            relations: ['user', 'location'],
        });
        if (!shift) throw new NotFoundException('Shift not found');
        return shift;
    }

    async update(id: string, data: Partial<Shift>) {
        await this.shiftsRepo.update(id, data);
        return this.findOne(id);
    }

    async cancel(id: string) {
        await this.shiftsRepo.update(id, { status: ShiftStatus.CANCELLED });
        return { message: 'Shift cancelled' };
    }

    async getStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const total = await this.shiftsRepo.count();
        const todayCount = await this.shiftsRepo.count({
            where: { startTime: Between(today, tomorrow) },
        });
        const activeCount = await this.shiftsRepo.count({
            where: { status: ShiftStatus.IN_PROGRESS },
        });
        const openCount = await this.shiftsRepo.count({
            where: { isOpen: true, status: ShiftStatus.SCHEDULED },
        });

        return { total, today: todayCount, active: activeCount, open: openCount };
    }



}
