import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SwitchCompanyDto {
  @ApiProperty()
  @IsInt()
  companyId!: number;
}
