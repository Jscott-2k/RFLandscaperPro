import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CustomerJobDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  title: string;
}

class CustomerAddressDto {
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
  @ApiPropertyOptional()
  unit?: string;
  @ApiPropertyOptional()
  notes?: string;
  @ApiProperty()
  primary: boolean;
}

export class CustomerResponseDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  name: string;
  @ApiProperty()
  email: string;
  @ApiPropertyOptional()
  phone?: string;
  @ApiPropertyOptional()
  notes?: string;
  @ApiProperty()
  active: boolean;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
  @ApiProperty({ type: [CustomerJobDto] })
  jobs?: CustomerJobDto[];
  @ApiProperty({ type: [CustomerAddressDto] })
  addresses?: CustomerAddressDto[];
}
