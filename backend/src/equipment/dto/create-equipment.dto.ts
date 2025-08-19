import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateEquipmentDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  assignedTruckId?: number;
}
