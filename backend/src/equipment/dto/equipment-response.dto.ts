import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { EquipmentType, EquipmentStatus } from '../entities/equipment.entity';

export class EquipmentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: EquipmentType })
  type: EquipmentType;

  @ApiProperty({ enum: EquipmentStatus })
  status: EquipmentStatus;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  lastMaintenanceDate?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
