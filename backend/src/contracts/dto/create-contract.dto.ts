import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  ValidateNested,
} from 'class-validator';

import { ContractFrequency } from '../entities/contract.entity';

class JobTemplateDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  estimatedHours?: number;

  @IsOptional()
  notes?: string;
}

export class CreateContractDto {
  @IsInt()
  customerId: number;

  @IsDateString()
  startDate: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsEnum(ContractFrequency)
  frequency: ContractFrequency;

  @IsOptional()
  @IsInt()
  totalOccurrences?: number;

  @ValidateNested()
  @Type(() => JobTemplateDto)
  jobTemplate: JobTemplateDto;
}
