import {
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { UserRole } from '../user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { CreateCompanyDto } from '../../companies/dto/create-company.dto';
import { Email } from '../value-objects/email.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @Transform(({ value }: { value: string }) => new Email(value))
  email: Email;

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
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value ? new PhoneNumber(value) : undefined,
  )
  phone?: PhoneNumber;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
