import { ApiProperty } from '@nestjs/swagger';
import { CompanyUserRole } from '../../companies/entities/company-user.entity';

export class CompanyMembershipResponseDto {
  @ApiProperty()
  companyId!: number;

  @ApiProperty()
  companyName!: string;

  @ApiProperty({ enum: CompanyUserRole })
  role!: CompanyUserRole;
}
