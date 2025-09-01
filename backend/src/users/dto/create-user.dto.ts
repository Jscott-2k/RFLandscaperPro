import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsEnum,
  IsString,
  MinLength,
  Matches,
  ValidateNested,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

import { CreateCompanyDto } from '../../companies/dto/create-company.dto';
import { UserRole } from '../user.entity';
import { Email } from '../value-objects/email.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @Transform(({ value }: { value: string }) => new Email(value))
  @IsNotEmpty()
  email: Email;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ type: () => CreateCompanyDto })
  @ValidateNested()
  @Type(() => CreateCompanyDto)
  @IsOptional()
  company?: CreateCompanyDto;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value ? new PhoneNumber(value) : undefined,
  )
  phone?: PhoneNumber;

  @ApiProperty()
  @IsBoolean()
  isVerified: boolean;
}
