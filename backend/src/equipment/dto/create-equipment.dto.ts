import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquipmentType, EquipmentStatus } from '../entities/equipment.entity';

export class CreateEquipmentDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: EquipmentType })
  @IsEnum(EquipmentType)
  type: EquipmentType;

  @ApiPropertyOptional({ enum: EquipmentStatus, default: EquipmentStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus = EquipmentStatus.AVAILABLE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lastMaintenanceDate?: string;
}
