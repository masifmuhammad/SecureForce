// ============================================================
// CheckIns Module — GPS-verified check-in/check-out
// Core feature: anti-spoofing + geofence validation
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckIn, Shift, Location } from '../entities';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';

@Module({
    imports: [TypeOrmModule.forFeature([CheckIn, Shift, Location])],
    controllers: [CheckinsController],
    providers: [CheckinsService],
    exports: [CheckinsService],
})
export class CheckinsModule { }
