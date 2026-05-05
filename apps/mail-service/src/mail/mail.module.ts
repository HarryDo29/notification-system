import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MailSingleProcessor, MailBulkProcessor } from './mail.processor';
import { MailQueue } from '../queue/enum/mail-queue.enum';
import { QueueModule } from '../queue/queue.module';
import { JobTemplateModule } from '../job-emplate/job-template.module';
import { TemplateModule } from '../template/template.module';

@Module({
  imports: [
    // Queue registration only — Redis connection is handled by QueueModule (global)
    BullModule.registerQueue({ name: MailQueue.SINGLE }),
    BullModule.registerQueue({ name: MailQueue.BULK }),
    QueueModule,
    JobTemplateModule,
    TemplateModule,
  ],
  controllers: [MailController],
  providers: [MailService, MailSingleProcessor, MailBulkProcessor],
  exports: [MailService],
})
export class MailModule {}
