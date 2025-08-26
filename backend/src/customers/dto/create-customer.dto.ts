import {
  IsString,
  IsEmail,
  ValidateNested,
  IsArray,
  IsOptional,
  IsBoolean,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateAddressDto {
  @ApiProperty()
  @IsString()
  street: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty({ minLength: 2, maxLength: 2, example: 'CA' })
  @IsString()
  @Length(2, 2, { message: 'State must be exactly 2 characters' })
  state: string;

  @ApiProperty({ minLength: 5, maxLength: 10, example: '12345' })
  @IsString()
  @Length(5, 10, { message: 'ZIP code must be between 5 and 10 characters' })
  zip: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  primary?: boolean = false;
}

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @ApiProperty({ type: [CreateAddressDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAddressDto)
  addresses: CreateAddressDto[];
}
