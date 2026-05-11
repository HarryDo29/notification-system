import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationDto } from './dto/notification.dto';
import { Notification } from '../entity/notification.entity';
import { NotificationReadModel } from './schemas/notification-read.schema';

@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Post()
  async create(@Body() body: NotificationDto): Promise<Notification> {
    return await this.notificationService.notifyUser(body);
  }

  @Get()
  async get(
    @Query('userId') userId: string,
    @Query('skip') skip: number,
    @Query('limit') limit: number,
  ): Promise<NotificationReadModel[]> {
    return await this.notificationService.getNotifications(userId, skip, limit);
  }

  @Post('mark-read')
  async markAsRead(@Body() body: { userId: string }): Promise<number> {
    const { userId } = body;
    return await this.notificationService.markAsRead(userId);
  }
}
