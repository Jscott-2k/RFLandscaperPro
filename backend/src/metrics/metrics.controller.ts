import { Controller, Get, Header } from '@nestjs/common';
import { register } from 'prom-client';
import { Public } from '../common/decorators/public.decorator';

@Controller()
export class MetricsController {
  @Get('metrics')
  @Public()
  @Header('Content-Type', register.contentType)
  metrics(): Promise<string> {
    return register.metrics();
  }
}
