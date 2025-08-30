import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { Email } from '../value-objects/email.vo';

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
