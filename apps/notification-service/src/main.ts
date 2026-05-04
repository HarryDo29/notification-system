import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule);
  await app.listen(process.env.port ?? 3000);
}
void bootstrap();
