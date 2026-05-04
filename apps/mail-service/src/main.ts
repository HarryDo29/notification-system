import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = parseInt(process.env.PORT ?? '3001', 10);

  await app.listen(port);
  Logger.log(`Mail Service is running on port ${port}`, 'Bootstrap');
}

void bootstrap();
