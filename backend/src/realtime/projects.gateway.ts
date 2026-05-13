import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
  namespace: '/realtime',
})
export class ProjectsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ProjectsGateway.name);
  private connectedClients = 0;

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(`Client connected: ${client.id} (total: ${this.connectedClients})`);
    this.server.emit('stats', { connectedClients: this.connectedClients });
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:project')
  handleSubscribeProject(@MessageBody() projectId: string, @ConnectedSocket() client: Socket) {
    client.join(`project:${projectId}`);
    this.logger.log(`Client ${client.id} subscribed to project ${projectId}`);
  }

  @SubscribeMessage('unsubscribe:project')
  handleUnsubscribeProject(@MessageBody() projectId: string, @ConnectedSocket() client: Socket) {
    client.leave(`project:${projectId}`);
  }

  @OnEvent('project.updated')
  handleProjectUpdated(project: any) {
    this.server.emit('project:updated', project);
    this.server.to(`project:${project.id}`).emit('project:detail:updated', project);
  }

  @OnEvent('project.created')
  handleProjectCreated(project: any) {
    this.server.emit('project:created', project);
  }

  @OnEvent('project.deleted')
  handleProjectDeleted(data: { id: string }) {
    this.server.emit('project:deleted', data);
  }

  @OnEvent('activity.created')
  handleActivityCreated(data: { projectId: string; activity: any }) {
    this.server.emit('activity:created', data);
    this.server.to(`project:${data.projectId}`).emit('project:activity', data.activity);
  }

  broadcastProgressUpdate(projectId: string, progress: number) {
    this.server.emit('project:progress', { projectId, progress });
    this.server.to(`project:${projectId}`).emit('progress:update', { progress });
  }
}
