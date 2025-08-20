import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  customerId: number;

  toEntity() {
    const { customerId, ...jobData } = this;
    return { ...jobData, customer: { id: customerId } };
  }
}
