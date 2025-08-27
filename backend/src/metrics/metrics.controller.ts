import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { register } from 'prom-client';
import { Public } from '../common/decorators/public.decorator';

@Controller()
export class MetricsController {
  @Get('metrics')
  @Public()
  async getMetrics(@Res() res: Response): Promise<void> {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  }
}
