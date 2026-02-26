// ============================================================
// Event Module — NestJS Event Emitter for domain events
// ============================================================
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
    imports: [
        EventEmitterModule.forRoot({
            wildcard: true,           // Allow wildcard event patterns (e.g., 'shift.*')
            delimiter: '.',           // Namespace delimiter
            maxListeners: 20,         // Max listeners per event
            verboseMemoryLeak: true,  // Warn on potential memory leaks
        }),
    ],
})
export class EventModule { }
