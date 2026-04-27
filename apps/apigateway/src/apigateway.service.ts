import { Injectable } from '@nestjs/common';

@Injectable()
export class ApigatewayService {
  getHello(): string {
    return 'Hello World!';
  }
}
