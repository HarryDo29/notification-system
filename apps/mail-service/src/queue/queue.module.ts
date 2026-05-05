import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { JobTemplate } from '../entity/job_template.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplate } from '../entity/email_template.entity';
import { TemplateVariable } from '../entity/template_variable.entity';
import { JobTemplateModule } from '../job-emplate/job-template.module';

/**
 * QueueModule — global BullMQ configuration module.
 *
 * Registers the Redis connection once for the entire app.
 * Individual feature modules call BullModule.registerQueue() for their own queues.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([JobTemplate, EmailTemplate, TemplateVariable]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'email-single-queue',
    }),
    BullModule.registerQueue({
      name: 'email-bulk-queue',
    }),
    JobTemplateModule,
  ],
  exports: [BullModule, QueueService],
  providers: [QueueService],
})
export class QueueModule {}
