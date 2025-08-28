import {
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { UserRole } from '../user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateCompanyDto } from '../../companies/dto/create-company.dto';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
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
