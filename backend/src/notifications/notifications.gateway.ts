// ============================================================
// WebSocket Gateway — Real-time push notifications
// Sends shift updates, check-in alerts, flagged events
// ============================================================
import {
    WebSocketGateway, WebSocketServer, SubscribeMessage,
    OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedClients = new Map<string, Socket>();

    handleConnection(client: Socket) {
        console.log(`🔌 Client connected: ${client.id}`);
        this.connectedClients.set(client.id, client);
    }

    handleDisconnect(client: Socket) {
        console.log(`❌ Client disconnected: ${client.id}`);
        this.connectedClients.delete(client.id);
    }

    @SubscribeMessage('join')
    handleJoin(client: Socket, userId: string) {
        client.join(`user:${userId}`);
        console.log(`👤 User ${userId} joined their channel`);
    }

    /**
     * Send a notification to a specific user
     */
    sendToUser(userId: string, event: string, data: any) {
        this.server.to(`user:${userId}`).emit(event, data);
    }

    /**
     * Broadcast to all connected managers/admins
     */
    broadcastToManagers(event: string, data: any) {
        this.server.emit(event, data); // In production, filter by role
    }

    /**
     * Notify about a shift change
     */
    notifyShiftUpdate(userId: string, shift: any) {
        this.sendToUser(userId, 'shift:updated', shift);
    }

    /**
     * Alert managers about a flagged check-in
     */
    notifyFlaggedCheckIn(checkIn: any) {
        this.broadcastToManagers('checkin:flagged', checkIn);
    }
}
