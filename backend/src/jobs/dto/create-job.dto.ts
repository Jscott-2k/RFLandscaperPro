import { IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateJobDto {
  @IsString() title: string;
  @Type(() => Number)
  @IsNumber()
  customerId: number;
}
