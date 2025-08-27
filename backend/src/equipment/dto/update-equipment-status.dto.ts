import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EquipmentStatus } from '../entities/equipment.entity';

export class UpdateEquipmentStatusDto {
  @ApiProperty({ enum: EquipmentStatus, example: EquipmentStatus.AVAILABLE })
  @IsEnum(EquipmentStatus)
  status: EquipmentStatus;
}
