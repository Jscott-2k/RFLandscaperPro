import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  identifier: string;

  @IsNumber()
  capacity: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  currentLocation?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  equipmentIds?: number[];
}
