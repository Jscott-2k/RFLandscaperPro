import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class ScheduleJobDto {
  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  scheduledDate: Date;
}
