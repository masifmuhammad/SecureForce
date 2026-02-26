// ============================================================
// Shifts Module — Roster/shift scheduling
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shift, User } from '../entities';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Shift, User])],
    controllers: [ShiftsController],
    providers: [ShiftsService],
    exports: [ShiftsService],
})
export class ShiftsModule { }
