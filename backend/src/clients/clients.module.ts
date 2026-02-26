// ============================================================
// Clients Module — Client Organization Management
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientOrganization } from '../entities';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ClientOrganization])],
    controllers: [ClientsController],
    providers: [ClientsService],
    exports: [ClientsService],
})
export class ClientsModule { }
