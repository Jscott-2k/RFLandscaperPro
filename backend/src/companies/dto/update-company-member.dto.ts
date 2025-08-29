import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import {
  CompanyUserRole,
  CompanyUserStatus,
} from '../entities/company-user.entity';

export class UpdateCompanyMemberDto {
  @ApiPropertyOptional({ enum: CompanyUserRole })
  @IsEnum(CompanyUserRole)
  @IsOptional()
  role?: CompanyUserRole;

  @ApiPropertyOptional({ enum: CompanyUserStatus })
  @IsEnum(CompanyUserStatus)
  @IsOptional()
  status?: CompanyUserStatus;
}
