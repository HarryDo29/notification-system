import { Module } from '@nestjs/common';
import { JobTemplate } from '../entity/job_template.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobTemplateService } from './job-template.service';
import { TemplateService } from '../template/template.service';
import { EmailTemplate } from '../entity/email_template.entity';
import { TemplateVariable } from '../entity/template_variable.entity';
import { JobTemplateController } from './job-template.controller';

@Module({
  imports: [TypeOrmModule.forFeature([JobTemplate, EmailTemplate, TemplateVariable])],
  controllers: [JobTemplateController],
  providers: [JobTemplateService, TemplateService],
  exports: [JobTemplateService],
})
export class JobTemplateModule {}
