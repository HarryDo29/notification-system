import { Module } from '@nestjs/common';
import { NotificationGateway } from '../notification/notification.gateway';
import { PubSubService } from './pubSub.service';

@Module({
  imports: [NotificationGateway],
  providers: [PubSubService],
  exports: [PubSubService],
})
export class PubSubModule {}
