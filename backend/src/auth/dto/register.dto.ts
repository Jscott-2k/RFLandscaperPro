import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsEnum,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PASSWORD_REGEX } from '../password.util';
import { UserRole } from '../../users/user.entity';
import { CreateCompanyDto } from '../../companies/dto/create-company.dto';

export class RegisterDto {
  @ApiProperty({ description: 'Username must be unique' })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  username: string;

  @ApiProperty({ description: 'Email must be unique' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    example: 'SecurePass123!',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(PASSWORD_REGEX, {
    message:
      'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ type: () => CreateCompanyDto })
  @ValidateNested()
  @Type(() => CreateCompanyDto)
  @IsOptional()
  company?: CreateCompanyDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;
}
