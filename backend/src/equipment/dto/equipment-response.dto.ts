import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EquipmentResponseDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  name: string;
  @ApiProperty()
  type: string;
  @ApiProperty()
  status: string;
  @ApiPropertyOptional()
  location?: string;
  @ApiPropertyOptional()
  assignedTruckId?: number;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}
