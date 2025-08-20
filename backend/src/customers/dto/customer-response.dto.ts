import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobResponseDto } from '../../jobs/dto/job-response.dto';

export class AddressResponseDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  street: string;
  @ApiProperty()
  city: string;
  @ApiProperty()
  state: string;
  @ApiProperty()
  zip: string;
}

export class CustomerResponseDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  name: string;
  @ApiProperty()
  email: string;
  @ApiProperty({ type: [AddressResponseDto] })
  addresses: AddressResponseDto[];
  @ApiPropertyOptional({ type: [JobResponseDto] })
  jobs?: Partial<JobResponseDto>[];
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}
