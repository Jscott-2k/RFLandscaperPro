import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

import { PASSWORD_REGEX } from '../password.util';

export class SignupOwnerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description:
      'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    example: 'SecurePass123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(PASSWORD_REGEX, {
    message:
      'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  companyName: string;
}
