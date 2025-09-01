import { PartialType, OmitType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

import { Email } from '../value-objects/email.vo';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['role', 'company', 'isVerified', 'email'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value ? new Email(value) : undefined,
  )
  email?: Email;
}
