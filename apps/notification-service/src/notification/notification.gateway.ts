import {
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Inject } from '@nestjs/common';
import RedisClient from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter/dist/index.js';
import { Logger } from '@nestjs/common';

const IDLE_TIMEOUT = 10 * 60; // 10 phút

@WebSocketGateway({ namespace: 'notification', cors: { origin: '*' } })
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server!: Server;

  // Map socketId -> last active timestamp in memomry
  // save sockets of this server
  private onlineUsers = new Map<string, Set<string>>();

  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: RedisClient) {}

  afterInit(server: Server) {
    const pubClient = this.redisClient.duplicate();
    const subClient = this.redisClient.duplicate();
    const adapterFactory: Parameters<Server['adapter']>[0] = createAdapter(pubClient, subClient);
    server.adapter(adapterFactory);
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  async handleDisconnect(client: Socket) {
    const userId = (client.data as { userId?: string }).userId;
    if (!userId) return;
    const userKey = `user:${userId}`;
    const raw = await this.redisClient.get(userKey);
    let remaining: string[] = [];
    if (raw && raw.trim().length > 0) {
      try {
        const socketIds = JSON.parse(raw) as string[];
        remaining = socketIds.filter((id) => id !== client.id);
      } catch {
        this.logger.error(`Corrupt Redis data for ${userKey}, clearing key`);
      }
    }

    if (remaining.length > 0) {
      await this.redisClient.set(userKey, JSON.stringify(remaining), 'EX', IDLE_TIMEOUT);
    } else {
      await this.redisClient.del(userKey);
    }

    this.removeSocketFromMemory(userKey, client.id);
    this.logger.log(
      `User ${userId} disconnected socket ${client.id}. Remaining: ${remaining.length}`,
    );
  }

  @SubscribeMessage('join')
  async joinRoom(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    const userKey = `user:${userId}`; // key in Redis
    void client.join(userKey);
    const socketUser = await this.redisClient.get(userKey);
    let clientIds = new Set<string>(); // initialize clientIds
    // save socket to Redis
    if (!socketUser || socketUser.trim().length === 0) {
      clientIds.add(client.id);
      await this.redisClient.set(userKey, JSON.stringify(clientIds), 'EX', IDLE_TIMEOUT); // 10 phút
    } else {
      clientIds = new Set(JSON.parse(socketUser) as string[]);
      clientIds.add(client.id); // add the socket ID to the set
      const clientIdsArray = Array.from(clientIds);
      await this.redisClient.set(userKey, JSON.stringify(clientIdsArray), 'EX', IDLE_TIMEOUT);
    }
    this.addSocketToMemory(userKey, client.id); // save socket to local memory
    (client.data as { userId?: string }).userId = userId; // save userId to client data (socket)
    this.logger.log(`User ${userId} joined room with socketId ${client.id}`);
  }

  async sendNotification(userId: string, payload: unknown) {
    const userKey = `user:${userId}`;
    const socketIds = await this.redisClient.get(userKey);
    if (!socketIds || socketIds.trim().length === 0) return; // if no socketIds, stop sending notification
    const socketIdsArray = JSON.parse(socketIds) as string[];
    if (socketIdsArray && socketIdsArray.length > 0) {
      for (const socketId of socketIdsArray) {
        this.server.to(socketId).emit('notification', payload);
      }
      await this.redisClient.expire(userKey, IDLE_TIMEOUT);
    }
  }

  disconnectSocketIds(socketIds: string[]) {
    for (const socketId of socketIds) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (!socket) {
        continue;
      }
      void socket.disconnect(true);
      this.logger.log(`Socket ${socketId} disconnected by server`);
    }
  }

  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: Socket) {
    const userId = (client.data as { userId: string }).userId;
    if (!userId) return;
    await this.redisClient.expire(`user:${userId}`, IDLE_TIMEOUT);
  }

  // add sokcet (clientID) to memory
  addSocketToMemory(userKey: string, clientId: string) {
    if (!this.onlineUsers.has(userKey)) {
      this.onlineUsers.set(userKey, new Set([clientId]));
      return;
    }
    const socketIds = this.onlineUsers.get(userKey)!;
    socketIds.add(clientId);
    return;
  }

  // remove socket from memory
  removeSocketFromMemory(userKey: string, clientId: string) {
    const socketIds = this.onlineUsers.get(userKey);
    if (!socketIds) return; // if no socketIds, stop removing socket from memory
    if (socketIds.has(clientId)) {
      socketIds.delete(clientId);
      if (socketIds.size === 0) {
        this.onlineUsers.delete(userKey);
      }
    }
    return;
  }
}
