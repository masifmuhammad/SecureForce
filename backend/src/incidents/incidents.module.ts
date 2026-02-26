// ============================================================
// Incidents Module — Incident management with SLA
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incident } from '../entities/incident.entity';
import { IncidentTimeline } from '../entities/incident-timeline.entity';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { IncidentProcessor } from './incidents.processor';
import { QueueModule } from '../shared/queues/queue.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Incident, IncidentTimeline]),
        QueueModule,
    ],
    controllers: [IncidentsController],
    providers: [IncidentsService, IncidentProcessor],
    exports: [IncidentsService],
})
export class IncidentsModule { }
