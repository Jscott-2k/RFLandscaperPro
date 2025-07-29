import { IsString, IsNumber } from 'class-validator';

export class CreateJobDto {
  @IsString() title: string;
  @IsNumber() customerId: number;
}
