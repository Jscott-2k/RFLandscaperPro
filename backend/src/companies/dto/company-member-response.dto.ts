import { ApiProperty } from '@nestjs/swagger';
import {
  CompanyUserRole,
  CompanyUserStatus,
} from '../entities/company-user.entity';

export class CompanyMemberResponseDto {
  @ApiProperty()
  userId!: number;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: CompanyUserRole })
  role!: CompanyUserRole;

  @ApiProperty({ enum: CompanyUserStatus })
  status!: CompanyUserStatus;
}
