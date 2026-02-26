import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../entities';

@Injectable()
export class LocationsService {
    constructor(
        @InjectRepository(Location) private locationsRepo: Repository<Location>,
    ) { }

    async create(data: Partial<Location>) {
        const location = this.locationsRepo.create(data);
        return this.locationsRepo.save(location);
    }

    async findAll(page = 1, limit = 20) {
        const [items, total] = await this.locationsRepo.findAndCount({
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, totalPages: Math.ceil(total / limit) };
    }

    async findOne(id: string) {
        const location = await this.locationsRepo.findOne({ where: { id } });
        if (!location) throw new NotFoundException('Location not found');
        return location;
    }

    async update(id: string, data: Partial<Location>) {
        await this.locationsRepo.update(id, data);
        return this.findOne(id);
    }

    async remove(id: string) {
        await this.locationsRepo.update(id, { isActive: false });
        return { message: 'Location deactivated' };
    }
}
