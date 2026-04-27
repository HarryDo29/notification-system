import { Module } from '@nestjs/common';
import { ApigatewayController } from './apigateway.controller';
import { ApigatewayService } from './apigateway.service';

@Module({
  imports: [],
  controllers: [ApigatewayController],
  providers: [ApigatewayService],
})
export class ApigatewayModule {}
