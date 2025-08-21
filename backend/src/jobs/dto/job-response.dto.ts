import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class JobCustomerDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  name: string;
  @ApiProperty()
  email: string;
}

class JobAssignmentUserDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  username: string;
}

class JobAssignmentEquipmentDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  name: string;
}

class JobAssignmentDto {
  @ApiProperty()
  id: number;
  @ApiProperty({ type: JobAssignmentUserDto })
  user: JobAssignmentUserDto;
  @ApiProperty({ type: JobAssignmentEquipmentDto })
  equipment: JobAssignmentEquipmentDto;
  @ApiPropertyOptional()
  startTime?: Date;
  @ApiPropertyOptional()
  endTime?: Date;
  @ApiPropertyOptional()
  notes?: string;
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
  @ApiPropertyOptional()
  estimatedHours?: number;
  @ApiPropertyOptional()
  actualHours?: number;
  @ApiPropertyOptional()
  notes?: string;
  @ApiProperty({ type: JobCustomerDto })
  customer: JobCustomerDto;
  @ApiProperty({ type: [JobAssignmentDto] })
  assignments?: JobAssignmentDto[];
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}
