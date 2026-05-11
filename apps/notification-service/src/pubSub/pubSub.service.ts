import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import RedisClient, { Redis } from 'ioredis';
import { Inject } from '@nestjs/common';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class PubSubService implements OnModuleInit {
  private redisSub!: Redis;
  private readonly logger = new Logger(PubSubService.name);

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: RedisClient,
    private readonly gateway: NotificationGateway,
  ) {}

  onModuleInit() {
    // Tạo subscriber riêng
    this.redisSub = this.redisClient.duplicate();
    // Subscribe channel ws-disconnect
    void this.redisSub.subscribe('ws-disconnect', (err, _count) => {
      if (err) {
        this.logger.error(`Error subscribing to ws-disconnect channel: ${err}`);
        return;
      }
      console.log('Subscribed to ws-disconnect channel');
    });

    void this.redisSub.on('message', (channel: string, message: string) => {
      console.log('Received message from', channel, message);
      const socketIds = JSON.parse(message) as string[];
      this.gateway.disconnectSocketIds(socketIds);
    });
  }
}
