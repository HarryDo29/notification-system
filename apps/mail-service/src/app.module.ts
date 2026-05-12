import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueModule } from './queue/queue.module';
import { MailProviderModule } from './providers/mail-provider.module';
import { MailModule } from './mail/mail.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateModule } from './template/template.module';
import { CacheModule } from '@nestjs/cache-manager/dist/cache.module.js';
import type { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { JobTemplateModule } from './job-emplate/job-template.module';

/**
 * AppModule — root module of mail-service.
 *
 * To swap the email provider:
 *   Replace `SendGridModule` with your new provider module (e.g. SesModule).
 *   No other files need to change.
 */

const cacheModuleAsync: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    ttl: config.get<number>('CACHE_TTL', 600),
    max: config.get<number>('CACHE_MAX', 100),
  }),
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/mail-service/.env',
    }),
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as undefined,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: true,
    }),
    CacheModule.registerAsync(cacheModuleAsync),
    TemplateModule, // template module
    QueueModule, // BullMQ + Redis (global)
    MailProviderModule, // reads MAIL_PROVIDER_NAME from .env
    MailModule, // ← This handles the business logic
    JobTemplateModule, // job template module
  ],
})
export class AppModule {}
