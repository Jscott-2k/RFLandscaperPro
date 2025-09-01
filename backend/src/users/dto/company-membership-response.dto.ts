import { ApiProperty } from '@nestjs/swagger';
import { type CompanyMembership, CompanyUserRole } from '@rflp/shared';

export class CompanyMembershipResponseDto implements CompanyMembership {
  @ApiProperty()
  companyId!: number;

  @ApiProperty()
  companyName!: string;

  @ApiProperty({ enum: CompanyUserRole })
  role!: CompanyUserRole;
}
