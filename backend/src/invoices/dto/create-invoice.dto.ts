import { IsNumber, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  jobId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  customerId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  toEntity() {
    const { jobId, customerId, ...rest } = this;
    return {
      ...rest,
      job: { id: jobId },
      customer: { id: customerId },
    };
  }
}
