import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';

export class ResourceAssignmentDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  userId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  equipmentId: number;
}

export class BulkAssignJobDto {
  @ApiProperty({ type: [ResourceAssignmentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResourceAssignmentDto)
  @ArrayMinSize(1)
  assignments: ResourceAssignmentDto[];
}
