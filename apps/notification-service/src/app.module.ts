import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Redis } from 'ioredis';
import { Notification } from './entity/notification.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { PubSubModule } from './pubSub/pubSub.module';
import { QueueModule } from './queue/queue.module';
import { NotificationModule } from './notification/notification.module';

function buildMongoUri(config: ConfigService): string {
  const username = config.getOrThrow<string>('MONGO_DB_USERNAME');
  const password = config.getOrThrow<string>('MONGO_DB_PASSWORD');
  const host = config.getOrThrow<string>('MONGO_HOST');
  const port = config.getOrThrow<string>('MONGO_PORT');

  return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}`;
}

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/notification-service/.env',
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: buildMongoUri(config),
        dbName: config.getOrThrow<string>('MONGO_DB_NAME'),
        authMechanism: 'SCRAM-SHA-256',
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
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
    TypeOrmModule.forFeature([Notification]),
    PubSubModule,
    QueueModule,
    NotificationModule,
  ],
  controllers: [],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          db: config.get<number>('REDIS_DB', 0),
        });
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class AppModule {}
