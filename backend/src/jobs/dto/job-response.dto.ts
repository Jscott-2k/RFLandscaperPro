import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class JobCustomerDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  name: string;
  @ApiProperty()
  email: string;
}

export class JobResponseDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  title: string;
  @ApiPropertyOptional()
  description?: string;
  @ApiPropertyOptional()
  scheduledDate?: Date;
  @ApiProperty()
  completed: boolean;
  @ApiProperty({ type: JobCustomerDto })
  customer: JobCustomerDto;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}
