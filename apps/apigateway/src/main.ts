import { NestFactory } from '@nestjs/core';
import { ApigatewayModule } from './apigateway.module';

async function bootstrap() {
  const app = await NestFactory.create(ApigatewayModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
