import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class SwitchCompanyDto {
  @ApiProperty()
  @IsInt()
  companyId!: number;
}
