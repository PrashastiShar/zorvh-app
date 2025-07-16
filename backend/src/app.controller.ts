import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

   @Get() // This decorator makes this method respond to GET requests at the root path '/'
  getHello(): string {
    return this.appService.getHello(); // Or any other message you want to return
  }
}

