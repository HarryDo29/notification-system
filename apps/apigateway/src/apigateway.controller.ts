import { Controller, Get } from '@nestjs/common';
import { ApigatewayService } from './apigateway.service';

@Controller()
export class ApigatewayController {
  constructor(private readonly apigatewayService: ApigatewayService) {}

  @Get()
  getHello(): string {
    return this.apigatewayService.getHello();
  }
}
